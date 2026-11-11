BEGIN;

-- =====================================================
-- 0. NEW USER PROFILE INITIALIZATION
-- Owners require Admin approval before activation.
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_role text := CASE
        WHEN NEW.raw_user_meta_data ->> 'account_type' = 'owner'
            THEN 'owner'
        ELSE 'student'
    END;

    v_account_status text := CASE
        WHEN NEW.raw_user_meta_data ->> 'account_type' = 'owner'
            THEN 'pending'
        ELSE 'active'
    END;

BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        role,
        account_status
    )
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url',
        v_role,
        v_account_status
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$function$;

-- Owner listing verification and permissions.
-- Reviewed changes versus the first draft:
--   A. Listings inserted by an Admin are verified automatically.
--   B. Moving a listing out of 'verified' unpublishes it automatically.
--   C. An Owner's live listings are unpublished whenever the Owner's
--      status leaves 'active' (pending or suspended).
--   D. The new trigger functions cannot be called by app users.

-- =====================================================
-- 1. LISTING VERIFICATION COLUMNS
-- =====================================================

ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS verification_status text;

ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Allow authenticated Admin operations to update review fields.
-- Owner modifications remain blocked by enforce_listing_workflow().
GRANT UPDATE (
    verification_status,
    rejection_reason
)
ON public.listings
TO authenticated;

-- Preserve the existing published Admin-created listing.
UPDATE public.listings
SET verification_status = 'verified'
WHERE id = 'b446399d-d4ff-4f9e-91f0-905486e39dd1'
  AND is_active = true;

-- Existing demo records intentionally remain NULL.
-- Future listings default to pending.
ALTER TABLE public.listings
ALTER COLUMN verification_status SET DEFAULT 'pending';

ALTER TABLE public.listings
ADD CONSTRAINT listings_verification_status_check
CHECK (
    verification_status IS NULL
    OR verification_status IN ('pending', 'verified', 'rejected')
);

ALTER TABLE public.listings
ADD CONSTRAINT listings_rejection_reason_check
CHECK (
    CASE
        WHEN verification_status = 'rejected' THEN
            rejection_reason IS NOT NULL
            AND length(btrim(rejection_reason)) BETWEEN 1 AND 1000
        ELSE
            rejection_reason IS NULL
    END
);


-- =====================================================
-- 2. OWNER ACCESS HELPER
-- Pending and active Owners can manage their own
-- submissions. Suspended Owners cannot.
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_owner_not_suspended()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role = 'owner'
          AND p.account_status IN ('pending', 'active')
    );
$$;

REVOKE ALL ON FUNCTION public.is_owner_not_suspended()
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_owner_not_suspended()
TO authenticated;


-- =====================================================
-- 3. LISTING WORKFLOW ENFORCEMENT
--
-- Owners:
-- - Cannot set verification status.
-- - Cannot set publication status.
-- - Cannot change listing ownership.
-- - Content edits reset verification and publication.
--
-- Admins:
-- - Can review and manage listings.
-- - Can publish only verified listings.
-- - Cannot publish listings belonging to suspended
--   or pending Owners.
-- =====================================================

CREATE OR REPLACE FUNCTION public.enforce_listing_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    owner_status text;
    owner_role text;
    content_changed boolean := false;
BEGIN

    -- Trusted server-side operations and migrations.
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- ADMIN OPERATIONS
    IF public.is_admin() THEN

        -- A. Listings created by an Admin are verified by definition.
        IF TG_OP = 'INSERT' THEN
            NEW.verification_status := 'verified';
            NEW.rejection_reason := NULL;
        END IF;

        -- Clear the previous rejection reason when an Admin
-- moves a listing out of the rejected state.
IF TG_OP = 'UPDATE'
   AND NEW.verification_status IS DISTINCT FROM 'rejected' THEN
    NEW.rejection_reason := NULL;
END IF;

        -- B. Moving a verified listing to pending or rejected unpublishes it.
        IF TG_OP = 'UPDATE'
           AND OLD.verification_status = 'verified'
           AND NEW.verification_status IS DISTINCT FROM 'verified' THEN
            NEW.is_active := false;
        END IF;

        IF NEW.is_active = true THEN

            IF NEW.verification_status IS DISTINCT FROM 'verified' THEN
                RAISE EXCEPTION
                    'Only verified listings can be published.';
            END IF;

            SELECT p.role, p.account_status
            INTO owner_role, owner_status
            FROM public.profiles p
            WHERE p.id = NEW.created_by;

            IF owner_role = 'owner'
               AND owner_status IS DISTINCT FROM 'active' THEN
                RAISE EXCEPTION
                    'Listings belonging to inactive Owners cannot be published.';
            END IF;

        END IF;

        RETURN NEW;
    END IF;


    -- OWNER OPERATIONS
    IF public.is_owner() THEN

        SELECT p.account_status
        INTO owner_status
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'owner';

        IF owner_status IS DISTINCT FROM 'pending'
           AND owner_status IS DISTINCT FROM 'active' THEN
            RAISE EXCEPTION
                'Your Owner account cannot manage listings.';
        END IF;

        IF TG_OP = 'INSERT' THEN

            NEW.created_by := auth.uid();
            NEW.verification_status := 'pending';
            NEW.rejection_reason := NULL;
            NEW.is_active := false;

            RETURN NEW;
        END IF;

        -- Owners cannot transfer listing ownership.
        IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
            RAISE EXCEPTION
                'Listing ownership cannot be changed.';
        END IF;

        -- Owners cannot modify Admin-controlled fields.
        IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
           OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
           OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
            RAISE EXCEPTION
                'Owners cannot change verification or publication status.';
        END IF;

        -- Detect changes to property information.
        content_changed :=
            NEW.title IS DISTINCT FROM OLD.title
            OR NEW.description IS DISTINCT FROM OLD.description
            OR NEW.price IS DISTINCT FROM OLD.price
            OR NEW.type IS DISTINCT FROM OLD.type
            OR NEW.occupancy IS DISTINCT FROM OLD.occupancy
            OR NEW.address IS DISTINCT FROM OLD.address
            OR NEW.lat IS DISTINCT FROM OLD.lat
            OR NEW.lng IS DISTINCT FROM OLD.lng
            OR NEW.amenities IS DISTINCT FROM OLD.amenities
            OR NEW.photo_urls IS DISTINCT FROM OLD.photo_urls
            OR NEW.landlord_name IS DISTINCT FROM OLD.landlord_name
            OR NEW.landlord_phone IS DISTINCT FROM OLD.landlord_phone
            OR NEW.landlord_email IS DISTINCT FROM OLD.landlord_email
            OR NEW.landlord_link IS DISTINCT FROM OLD.landlord_link;

        IF content_changed THEN
            NEW.verification_status := 'pending';
            NEW.rejection_reason := NULL;
            NEW.is_active := false;
        END IF;

        RETURN NEW;
    END IF;

    RAISE EXCEPTION
        'You are not authorized to modify listings.';

END;
$$;

-- The existing ownership-protection trigger runs first.
-- The zz prefix ensures this workflow trigger runs after it.
DROP TRIGGER IF EXISTS zz_enforce_listing_workflow
ON public.listings;

CREATE TRIGGER zz_enforce_listing_workflow
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.enforce_listing_workflow();


-- =====================================================
-- 4. OWNER ACCOUNT STATUS PROTECTION
--
-- Admins can change the account status of Owner accounts.
-- Ordinary users cannot change their own account status.
-- Admins cannot use this permission to edit other profile
-- information or change their own account status.
-- =====================================================

GRANT UPDATE (account_status)
ON public.profiles
TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_profile_account_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

    -- Trusted server-side operations and migrations.
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Only Admins may change the account status of
    -- another existing Owner account.
    IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN

        IF NOT (
            public.is_admin()
            AND OLD.role = 'owner'
            AND NEW.role = 'owner'
            AND OLD.id IS DISTINCT FROM (SELECT auth.uid())
        ) THEN
            RAISE EXCEPTION
                'Only Admins can change the account status of Owner accounts.';
        END IF;

    END IF;

    -- Admins managing another Owner profile may only
    -- change account_status, not other profile fields.
    IF OLD.id IS DISTINCT FROM (SELECT auth.uid())
       AND public.is_admin()
       AND OLD.role = 'owner'
       AND (
           (to_jsonb(NEW) - 'account_status')
           IS DISTINCT FROM
           (to_jsonb(OLD) - 'account_status')
       ) THEN

        RAISE EXCEPTION
            'Admins can only modify the account status of Owner profiles.';

    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_account_status_trigger
ON public.profiles;

CREATE TRIGGER protect_profile_account_status_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_account_status();


-- =====================================================
-- 5. ADMIN OWNER ACCOUNT MANAGEMENT PERMISSIONS
-- Admins can update Owner account statuses only.
-- =====================================================

DROP POLICY IF EXISTS profiles_admin_update_owner_status
ON public.profiles;

CREATE POLICY profiles_admin_update_owner_status
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    AND role = 'owner'
)
WITH CHECK (
    public.is_admin()
    AND role = 'owner'
);


-- =====================================================
-- 6. AUTOMATIC UNPUBLISHING WHEN AN OWNER IS NOT ACTIVE
-- (function and trigger names kept from the first draft)
-- =====================================================

CREATE OR REPLACE FUNCTION public.unpublish_suspended_owner_listings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

    -- C. Pending or suspended Owners cannot have live listings.
    IF NEW.role = 'owner'
       AND NEW.account_status IS DISTINCT FROM 'active'
       AND (
           OLD.role IS DISTINCT FROM NEW.role
           OR OLD.account_status IS DISTINCT FROM NEW.account_status
       ) THEN

        UPDATE public.listings
        SET is_active = false
        WHERE created_by = NEW.id
          AND is_active = true;

    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS unpublish_suspended_owner_listings_trigger
ON public.profiles;

CREATE TRIGGER unpublish_suspended_owner_listings_trigger
AFTER UPDATE OF role, account_status
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.unpublish_suspended_owner_listings();


-- =====================================================
-- 7. ADMIN LISTING PERMISSIONS
-- Admins can manage listings across all Owners.
-- =====================================================

DROP POLICY IF EXISTS listings_admin
ON public.listings;

DROP POLICY IF EXISTS listings_admin_read_owner_submissions
ON public.listings;

CREATE POLICY listings_admin_manage_all
ON public.listings
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- =====================================================
-- 8. OWNER LISTING PERMISSIONS
-- =====================================================

-- Replace the broad read policy.
-- Published listings remain visible to authenticated users.
-- Inactive personal listings are visible only to eligible Owners.
-- Admin access is handled by listings_admin_manage_all.

DROP POLICY IF EXISTS listings_read
ON public.listings;

CREATE POLICY listings_read
ON public.listings
FOR SELECT
TO authenticated
USING (
    is_active = true
    OR (
        created_by = (SELECT auth.uid())
        AND public.is_owner_not_suspended()
    )
);

-- Remove the old broad Owner policy.
DROP POLICY IF EXISTS listings_owner
ON public.listings;

DROP POLICY IF EXISTS listings_owner_select_own
ON public.listings;

CREATE POLICY listings_owner_select_own
ON public.listings
FOR SELECT
TO authenticated
USING (
    created_by = (SELECT auth.uid())
    AND public.is_owner_not_suspended()
);

DROP POLICY IF EXISTS listings_owner_insert_own
ON public.listings;

CREATE POLICY listings_owner_insert_own
ON public.listings
FOR INSERT
TO authenticated
WITH CHECK (
    created_by = (SELECT auth.uid())
    AND public.is_owner_not_suspended()
);

DROP POLICY IF EXISTS listings_owner_update_own
ON public.listings;

CREATE POLICY listings_owner_update_own
ON public.listings
FOR UPDATE
TO authenticated
USING (
    created_by = (SELECT auth.uid())
    AND public.is_owner_not_suspended()
)
WITH CHECK (
    created_by = (SELECT auth.uid())
    AND public.is_owner_not_suspended()
);

DROP POLICY IF EXISTS listings_owner_delete_own
ON public.listings;

CREATE POLICY listings_owner_delete_own
ON public.listings
FOR DELETE
TO authenticated
USING (
    created_by = (SELECT auth.uid())
    AND public.is_owner_not_suspended()
);


-- =====================================================
-- 9. HARDENING
-- Trigger functions must not be callable by app users.
-- =====================================================

REVOKE ALL ON FUNCTION public.enforce_listing_workflow()
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.protect_profile_account_status()
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.unpublish_suspended_owner_listings()
FROM PUBLIC, anon, authenticated;


COMMIT;
