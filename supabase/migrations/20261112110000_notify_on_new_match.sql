-- Tell students when a newly published listing matches their preferences.
-- Mirrors matchScore() in src/lib/matching.ts (threshold 75), using each
-- student's learned weights when they have them.

create or replace function public.notify_new_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.notifications (user_id, type, title, body, listing_id)
    select
        p.id,
        'new_match',
        'New listing matches your preferences',
        new.title || ' was just added.',
        new.id
    from public.profiles p
    join public.campuses c on c.id = p.campus_id
    left join public.preference_weights w on w.user_id = p.id
    cross join lateral (
        select
            coalesce((w.priority_weights->>'price')::numeric, 0.4) as wp,
            coalesce((w.priority_weights->>'distance')::numeric, 0.3) as wd,
            coalesce((w.priority_weights->>'amenities')::numeric, 0.2) as wa,
            coalesce((w.priority_weights->>'type')::numeric, 0.1) as wt,
            -- haversine distance in km
            2 * 6371 * asin(sqrt(
                power(sin(radians(new.lat - c.lat) / 2), 2)
                + cos(radians(c.lat)) * cos(radians(new.lat))
                * power(sin(radians(new.lng - c.lng) / 2), 2)
            )) as km
    ) k
    cross join lateral (
        select
            case
                when p.budget_max is null or p.budget_max = 0 or new.price <= p.budget_max then 1
                else greatest(0, 1 - (new.price - p.budget_max) / p.budget_max)
            end as s_price,
            case
                when k.km <= 0.5 then 1
                else greatest(0, 1 - (k.km - 0.5) / 7.5)
            end as s_dist,
            case
                when coalesce(cardinality(p.desired_amenities), 0) = 0 then 0.5
                else (
                    select count(*)::numeric
                    from unnest(p.desired_amenities) a
                    where a = any (new.amenities)
                ) / cardinality(p.desired_amenities)
            end as s_amen,
            case
                when p.housing_type is null then 0.7
                when new.type = p.housing_type then 1
                else 0.4
            end as s_type
    ) s
    where p.role = 'student'
      and p.onboarding_completed
      and round(
            least(1,
                s.s_price * k.wp + s.s_dist * k.wd + s.s_amen * k.wa + s.s_type * k.wt
                + case
                    when p.roommate_pref in ('solo', 'shared')
                         and new.occupancy = p.roommate_pref then 0.05
                    else 0
                  end
            ) * 100
        ) >= 75
      and not exists (
        select 1 from public.swipes sw
        where sw.user_id = p.id and sw.listing_id = new.id
      );
    return new;
end;
$$;

revoke all on function public.notify_new_match() from public, anon, authenticated;

-- Fires once, when a listing first becomes visible to students
-- (active and not pending/rejected).
drop trigger if exists listings_notify_new_match_ins on public.listings;
create trigger listings_notify_new_match_ins
    after insert on public.listings
    for each row
    when (new.is_active and new.verification_status is not distinct from 'verified')
    execute function public.notify_new_match();

drop trigger if exists listings_notify_new_match_upd on public.listings;
create trigger listings_notify_new_match_upd
    after update of is_active, verification_status on public.listings
    for each row
    when (
        new.is_active and new.verification_status is not distinct from 'verified'
        and not (old.is_active and old.verification_status is not distinct from 'verified')
    )
    execute function public.notify_new_match();
