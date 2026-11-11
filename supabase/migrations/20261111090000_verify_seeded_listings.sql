-- Demo/seed listings were created before the verification workflow, so their
-- verification_status is NULL. The workflow trigger blocks admin edits on active
-- rows that are not 'verified', so mark the existing published ones as verified.
UPDATE public.listings
SET verification_status = 'verified'
WHERE verification_status IS NULL
  AND is_active = true;
