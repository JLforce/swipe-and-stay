-- Tell students when a listing they saved is deactivated.
-- Students cannot insert notifications themselves (RLS), so this runs as
-- security definer from a trigger on public.listings.

create or replace function public.notify_listing_deactivated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.notifications (user_id, type, title, body, listing_id)
    select
        s.user_id,
        'listing_deactivated',
        'A saved listing is no longer available',
        new.title || ' was deactivated.',
        new.id
    from public.swipes s
    where s.listing_id = new.id
      and s.direction = 'right'
      and s.unliked_at is null;
    return new;
end;
$$;

revoke all on function public.notify_listing_deactivated() from public, anon, authenticated;

drop trigger if exists listings_notify_deactivated on public.listings;
create trigger listings_notify_deactivated
    after update of is_active on public.listings
    for each row
    when (old.is_active is true and new.is_active is false)
    execute function public.notify_listing_deactivated();
