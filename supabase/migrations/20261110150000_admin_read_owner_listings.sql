-- Allow Admins to read listings submitted by Owner accounts.
-- Includes pending, inactive, and rejected listings.
-- Does not grant additional INSERT, UPDATE, or DELETE permissions.

CREATE POLICY "listings_admin_read_owner_submissions"
ON public.listings
FOR SELECT
TO authenticated
USING (
    public.is_admin()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = listings.created_by
          AND profiles.role = 'owner'
    )
);