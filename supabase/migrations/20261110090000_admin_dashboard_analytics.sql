
-- Admin dashboard analytics.
-- Aggregates platform-wide metrics inside PostgreSQL instead of
-- downloading large swipe datasets into the Edge Function.
--
-- Access is restricted to service_role. The Edge Function must
-- authenticate the caller and verify profiles.role = 'admin'.

BEGIN;

-- Supports dashboard-wide date-range aggregation.
CREATE INDEX IF NOT EXISTS swipes_swiped_at_idx
    ON public.swipes (swiped_at DESC);

-- Supports current-like counts and listing rankings.
CREATE INDEX IF NOT EXISTS swipes_active_likes_listing_idx
    ON public.swipes (listing_id)
    WHERE direction = 'right' AND unliked_at IS NULL;

-- Supports student registration trends.
CREATE INDEX IF NOT EXISTS profiles_student_created_at_idx
    ON public.profiles (created_at DESC)
    WHERE role = 'student';

CREATE OR REPLACE FUNCTION public.admin_dashboard_analytics(
    p_days integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
    WITH parameters AS (
        SELECT
            CASE
                WHEN p_days = 30 THEN 30
                ELSE 7
            END AS days,
            (now() AT TIME ZONE 'Asia/Manila')::date AS today
    ),
    date_series AS (
        SELECT
            (p.today - series.day_offset)::date AS local_date
        FROM parameters p
        CROSS JOIN LATERAL generate_series(
            p.days - 1,
            0,
            -1
        ) AS series(day_offset)
    ),
        swipe_totals AS (
        SELECT
            COUNT(*)::bigint AS total_swipes,
            COUNT(*) FILTER (
                WHERE s.direction = 'right'
                  AND s.unliked_at IS NULL
            )::bigint AS total_likes,
            COUNT(*) FILTER (
                WHERE s.direction = 'left'
            )::bigint AS total_passes,
            COUNT(DISTINCT s.user_id)::bigint AS students_who_swiped
        FROM public.swipes s
    ),
    daily_swipes AS (
        SELECT
            (s.swiped_at AT TIME ZONE 'Asia/Manila')::date AS local_date,
            COUNT(*)::bigint AS swipes,
            COUNT(*) FILTER (
                WHERE s.direction = 'right'
            )::bigint AS likes,
            COUNT(*) FILTER (
                WHERE s.direction = 'left'
            )::bigint AS passes
        FROM public.swipes s
        CROSS JOIN parameters p
        WHERE s.swiped_at >= (
            (p.today - (p.days - 1))::timestamp
            AT TIME ZONE 'Asia/Manila'
        )
          AND s.swiped_at < (
            (p.today + 1)::timestamp
            AT TIME ZONE 'Asia/Manila'
        )
        GROUP BY 1
    ),
    daily_registrations AS (
        SELECT
            (profiles.created_at AT TIME ZONE 'Asia/Manila')::date
                AS local_date,
            COUNT(*)::bigint AS students
        FROM public.profiles profiles
        CROSS JOIN parameters p
        WHERE profiles.role = 'student'
          AND profiles.created_at >= (
            (p.today - (p.days - 1))::timestamp
            AT TIME ZONE 'Asia/Manila'
          )
          AND profiles.created_at < (
            (p.today + 1)::timestamp
            AT TIME ZONE 'Asia/Manila'
          )
        GROUP BY 1
    ),
    listing_likes AS (
        SELECT
            l.id AS listing_id,
            l.title,
            COUNT(s.id)::bigint AS likes
        FROM public.listings l
        INNER JOIN public.swipes s
            ON s.listing_id = l.id
           AND s.direction = 'right'
           AND s.unliked_at IS NULL
        GROUP BY l.id, l.title
        ORDER BY COUNT(s.id) DESC, l.title ASC
        LIMIT 5
    )
    SELECT jsonb_build_object(
        'period', jsonb_build_object(
            'days', p.days,
            'timezone', 'Asia/Manila'
        ),
        'engagement', jsonb_build_object(
            'total_swipes', st.total_swipes,
            'total_likes', st.total_likes,
            'total_passes', st.total_passes,
            'students_who_swiped', st.students_who_swiped
        ),
        'daily_activity', (
            SELECT COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'date', ds.local_date,
                        'swipes', COALESCE(sw.swipes, 0),
                        'likes', COALESCE(sw.likes, 0),
                        'passes', COALESCE(sw.passes, 0)
                    )
                    ORDER BY ds.local_date
                ),
                '[]'::jsonb
            )
            FROM date_series ds
            LEFT JOIN daily_swipes sw
                ON sw.local_date = ds.local_date
        ),
        'daily_registrations', (
            SELECT COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'date', ds.local_date,
                        'students', COALESCE(dr.students, 0)
                    )
                    ORDER BY ds.local_date
                ),
                '[]'::jsonb
            )
            FROM date_series ds
            LEFT JOIN daily_registrations dr
                ON dr.local_date = ds.local_date
        ),
        'most_liked', (
            SELECT COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'listing_id', ll.listing_id,
                        'title', ll.title,
                        'likes', ll.likes
                    )
                    ORDER BY ll.likes DESC, ll.title ASC
                ),
                '[]'::jsonb
            )
            FROM listing_likes ll
        )
    )
    FROM parameters p
    CROSS JOIN swipe_totals st;
$function$;

-- PostgreSQL functions can be executable by PUBLIC by default.
-- Explicitly remove that access.
REVOKE ALL ON FUNCTION public.admin_dashboard_analytics(integer)
    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_dashboard_analytics(integer)
    TO service_role;

COMMIT;
