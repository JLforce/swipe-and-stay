
-- Restore the approved profile update permissions for authenticated users.
-- Users can update their own profiles, but cannot change their role.

REVOKE UPDATE ON public.profiles FROM authenticated;

GRANT UPDATE (
    full_name,
    avatar_url,
    campus_id,
    program,
    contact_info,
    budget_min,
    budget_max,
    housing_type,
    roommate_pref,
    desired_amenities,
    onboarding_completed
)
ON public.profiles
TO authenticated;
