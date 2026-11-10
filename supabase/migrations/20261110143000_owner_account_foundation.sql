BEGIN;

-- =====================================================
-- 1. ADD OWNER ROLE
-- =====================================================

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('student', 'owner', 'admin'));


-- =====================================================
-- 2. ADD OWNER ACCOUNT STATUS
-- Existing accounts remain active.
-- =====================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_status text
NOT NULL DEFAULT 'active';

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_account_status_check
CHECK (account_status IN ('pending', 'active', 'suspended'));


-- =====================================================
-- 3. OWNER AUTHORIZATION FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_owner()
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
    );
$$;

CREATE OR REPLACE FUNCTION public.is_active_owner()
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
          AND p.account_status = 'active'
    );
$$;

REVOKE ALL ON FUNCTION public.is_owner()
FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.is_active_owner()
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_owner()
TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_active_owner()
TO authenticated;


-- =====================================================
-- 4. ALLOW ADMINS TO VIEW OWNER PROFILES
-- Existing own-profile visibility remains unchanged.
-- =====================================================

DROP POLICY IF EXISTS profiles_select_owner_admin
ON public.profiles;

CREATE POLICY profiles_select_owner_admin
ON public.profiles
FOR SELECT
TO authenticated
USING (
    role = 'owner'
    AND public.is_admin()
);


-- =====================================================
-- 5. SECURE AUTOMATIC PROFILE CREATION
--
-- Owner registration is permitted through user metadata.
-- Admin role can only originate from trusted app metadata.
-- All other registrations default to Student.
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    assigned_role text;
    assigned_status text;
BEGIN
    IF NEW.raw_app_meta_data ->> 'role' = 'admin' THEN
        assigned_role := 'admin';
        assigned_status := 'active';

    ELSIF NEW.raw_user_meta_data ->> 'role' = 'owner' THEN
        assigned_role := 'owner';
        assigned_status := 'pending';

    ELSE
        assigned_role := 'student';
        assigned_status := 'active';
    END IF;

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
        assigned_role,
        assigned_status
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user()
FROM PUBLIC, anon, authenticated;


COMMIT;
