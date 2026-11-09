BEGIN;

-- Remove excessive table-level permissions.
REVOKE ALL PRIVILEGES
ON TABLE public.campuses
FROM anon, authenticated;

-- Remove existing column-level permissions.
REVOKE ALL PRIVILEGES
ON TABLE public.campuses
FROM anon, authenticated;

-- Allow authenticated users to read campus records.
-- RLS policies restrict campus management to admins.
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.campuses
TO authenticated;

COMMIT;