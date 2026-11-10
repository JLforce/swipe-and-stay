-- Exact per-student swipe counts for the admin dashboard.
-- Access is restricted to service_role.
-- The calling Edge Function must authenticate and verify admin role.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_student_swipe_counts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
    SELECT COALESCE(
        jsonb_object_agg(
            counts.user_id::text,
            counts.swipes
        ),
        '{}'::jsonb
    )
    FROM (
        SELECT
            s.user_id,
            COUNT(*)::bigint AS swipes
        FROM public.swipes s
        GROUP BY s.user_id
    ) AS counts;
$function$;

REVOKE ALL ON FUNCTION public.admin_student_swipe_counts()
    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_student_swipe_counts()
    TO service_role;

COMMIT;