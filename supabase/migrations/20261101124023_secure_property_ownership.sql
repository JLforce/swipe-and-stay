
BEGIN;

-- =========================================================
-- 1. PROTECT PROFILE ROLES
-- =========================================================

-- Authenticated users must not change their own role.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NOT NULL
       AND NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'You are not allowed to change your account role.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role_trigger
ON public.profiles;

CREATE TRIGGER protect_profile_role_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_role();

REVOKE ALL ON FUNCTION public.protect_profile_role()
FROM PUBLIC, anon, authenticated;


-- =========================================================
-- 2. PROTECT LISTING OWNERSHIP
-- =========================================================

CREATE OR REPLACE FUNCTION public.protect_listing_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        IF TG_OP = 'INSERT' THEN
            NEW.created_by := auth.uid();
        ELSIF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
            RAISE EXCEPTION 'Listing ownership cannot be changed.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_listing_owner_trigger
ON public.listings;

CREATE TRIGGER protect_listing_owner_trigger
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.protect_listing_owner();

REVOKE ALL ON FUNCTION public.protect_listing_owner()
FROM PUBLIC, anon, authenticated;



-- =========================================================
-- 2.1 HARDEN ADMIN CHECK FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles AS p
        WHERE p.id = (SELECT auth.uid())
          AND p.role = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin()
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin()
TO authenticated;


-- =========================================================
-- 3. REPLACE LISTING RLS POLICIES
-- =========================================================

DROP POLICY IF EXISTS listings_admin ON public.listings;
DROP POLICY IF EXISTS listings_read ON public.listings;

-- Students can view published listings.
-- Admins can view their own listings, including drafts.

-- New listings must start as drafts.
ALTER TABLE public.listings
    ALTER COLUMN is_active SET DEFAULT false;
    
CREATE POLICY listings_read
ON public.listings
FOR SELECT
TO authenticated
USING (
    is_active = TRUE
    OR (
        public.is_admin()
        AND created_by = (SELECT auth.uid())
    )
);

-- Admins can manage only listings they own.
CREATE POLICY listings_admin
ON public.listings
FOR ALL
TO authenticated
USING (
    public.is_admin()
    AND created_by = (SELECT auth.uid())
)
WITH CHECK (
    public.is_admin()
    AND created_by = (SELECT auth.uid())
);


-- =========================================================
-- 4. RESTRICT PROFILE VISIBILITY
-- =========================================================

DROP POLICY IF EXISTS profiles_select ON public.profiles;

-- Users can read only their own profile.
CREATE POLICY profiles_select
ON public.profiles
FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid()));

-- Preserve the existing profiles_update policy.
-- Preserve the approved column-level update grants.


-- =========================================================
-- 5. SECURE SAVED LISTINGS
-- =========================================================

-- liked_listings is an existing security-invoker VIEW
-- based on the swipes table. Preserve its definition.

-- Ensure authenticated users can read the view.

-- Preserve the existing swipes RLS policies:
-- swipes_insert
-- swipes_select
-- swipes_update

-- The underlying swipes table already has:
-- NOT NULL constraints
-- Foreign keys with ON DELETE CASCADE
-- UNIQUE (user_id, listing_id)
-- CHECK (direction IN ('left', 'right'))


-- =========================================================
-- 6. DATABASE PERMISSIONS
-- =========================================================

-- Remove existing table-level privileges.
REVOKE ALL PRIVILEGES ON TABLE
    public.profiles,
    public.listings,
    public.liked_listings
FROM anon, authenticated;

-- Remove existing column-level privileges.
REVOKE ALL PRIVILEGES (
    id, email, full_name, avatar_url, role, campus_id,
    program, contact_info, budget_min, budget_max,
    housing_type, roommate_pref, desired_amenities,
    onboarding_completed, created_at
)
ON TABLE public.profiles
FROM anon, authenticated;

REVOKE ALL PRIVILEGES (
    id, title, description, price, type, occupancy,
    address, lat, lng, amenities, photo_urls,
    landlord_name, landlord_phone, landlord_email,
    landlord_link, is_active, created_by,
    created_at, updated_at
)
ON TABLE public.listings
FROM anon, authenticated;

-- Remove existing column-level privileges on the view.
REVOKE ALL PRIVILEGES (
    user_id, listing_id, liked_at
)
ON TABLE public.liked_listings
FROM anon, authenticated;

-- Profiles: read own profile and update approved fields.
GRANT SELECT ON public.profiles TO authenticated;

GRANT UPDATE (
    full_name, avatar_url, campus_id, program,
    contact_info, budget_min, budget_max,
    housing_type, roommate_pref, desired_amenities,
    onboarding_completed
)
ON public.profiles
TO authenticated;

-- Listings: RLS determines which listings Admins can manage.
GRANT SELECT, DELETE ON public.listings TO authenticated;

GRANT INSERT (
    title, description, price, type, occupancy,
    address, lat, lng, amenities, photo_urls,
    landlord_name, landlord_phone, landlord_email,
    landlord_link, is_active
)
ON public.listings
TO authenticated;

GRANT UPDATE (
    title, description, price, type, occupancy,
    address, lat, lng, amenities, photo_urls,
    landlord_name, landlord_phone, landlord_email,
    landlord_link, is_active
)
ON public.listings
TO authenticated;

-- Swipes: remove excessive table and column privileges.
REVOKE ALL PRIVILEGES ON TABLE public.swipes
FROM anon, authenticated;

REVOKE ALL PRIVILEGES (
    id, user_id, listing_id, direction, swiped_at, unliked_at
)
ON TABLE public.swipes
FROM anon, authenticated;

-- Authenticated users can read their own swipe records.
GRANT SELECT ON public.swipes TO authenticated;

-- Users can create their own swipes.
-- user_id is supplied by the client, but the existing
-- swipes_insert RLS policy validates it against auth.uid().
GRANT INSERT (user_id, listing_id, direction)
ON public.swipes TO authenticated;

-- Users can only update the unliked_at field.
GRANT UPDATE (unliked_at)
ON public.swipes TO authenticated;

-- liked_listings is a read-only view for authenticated users.
GRANT SELECT ON public.liked_listings TO authenticated;


-- =========================================================
-- 7. HARDEN AUTOMATIC PROFILE CREATION
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url
    )
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user()
FROM PUBLIC, anon, authenticated;

COMMIT;
