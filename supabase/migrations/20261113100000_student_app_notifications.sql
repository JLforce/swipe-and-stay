-- Let the app save its own notifications (re-ranking, lease summary) so they
-- survive a restart. Students can only add these two kinds for themselves;
-- match and deactivation notifications still come only from the triggers.

alter table public.notifications
    drop constraint if exists notifications_type_check;
alter table public.notifications
    add constraint notifications_type_check
    check (type in ('new_match', 'listing_deactivated', 'rerank', 'lease_ready'));

grant insert (user_id, type, title, body) on public.notifications to authenticated;

drop policy if exists notif_insert_own on public.notifications;
create policy notif_insert_own on public.notifications
    for insert to authenticated
    with check (
        user_id = (select auth.uid())
        and type in ('rerank', 'lease_ready')
    );
