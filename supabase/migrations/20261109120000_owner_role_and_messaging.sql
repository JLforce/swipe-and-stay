-- Owner accounts, owner-managed listings, student <-> owner messaging,
-- and owner dashboard data.
--
-- Design notes
--   * "owner" is a self-service role (landlords post their own rentals).
--     "admin" stays a project-team role and can never be self-selected.
--   * Clients still cannot change profiles.role directly. The only paths are:
--       1. sign-up metadata (account_type = 'owner'), read by handle_new_user()
--       2. claim_owner_role(), for Google sign-ups that have no sign-up form
--   * Owners never see a student's email, phone or contact_info. They only see
--     the display name a student had when the conversation started.

begin;

-- =========================================================
-- 1. OWNER ROLE
-- =========================================================

-- profiles_role_check and handle_new_user() are defined in 20261110143000_owner_account_foundation.sql
-- and 20261110155032_owner_listing_verification_and_permissions.sql; they are not redefined here.

-- Allow role changes only inside claim_owner_role(), which sets a
-- transaction-local flag. Everyone else is still blocked.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if auth.uid() is not null
       and new.role is distinct from old.role
       and coalesce(current_setting('app.allow_role_change', true), '') <> 'on'
    then
        raise exception 'You are not allowed to change your account role.';
    end if;

    return new;
end;
$$;

revoke all on function public.protect_profile_role()
    from public, anon, authenticated;

-- Defined here because the storage policies below need it; 20261110143000_owner_account_foundation.sql
-- replaces it later with the same logic.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.profiles as p
        where p.id = (select auth.uid())
          and p.role = 'owner'
    );
$$;

revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;


-- Google sign-up has no form to send account_type, so a brand-new account
-- that picked "Owner" calls this once. It refuses accounts already used as
-- students (onboarded, or have swiped) so a student cannot flip role later.
create or replace function public.claim_owner_role()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_uid  uuid := (select auth.uid());
    v_role text;
    v_done boolean;
begin
    if v_uid is null then
        raise exception 'Please sign in first.';
    end if;

    select p.role, p.onboarding_completed
      into v_role, v_done
      from public.profiles as p
     where p.id = v_uid;

    if v_role = 'owner' then
        return 'owner';
    end if;

    if v_role is distinct from 'student' then
        raise exception 'This account cannot become an owner account.';
    end if;

    if v_done or exists (
        select 1 from public.swipes as s where s.user_id = v_uid
    ) then
        raise exception 'This account is already used as a student account. Use a different Google account for your owner profile.';
    end if;

    perform set_config('app.allow_role_change', 'on', true);

    update public.profiles
       set role = 'owner'
     where id = v_uid;

    perform set_config('app.allow_role_change', 'off', true);

    return 'owner';
end;
$$;

revoke all on function public.claim_owner_role() from public, anon;
grant execute on function public.claim_owner_role() to authenticated;

-- =========================================================
-- 2. OWNER LISTINGS
-- =========================================================

alter table public.listings
    add column if not exists slots_left integer not null default 1
    check (slots_left >= 0);

grant insert (slots_left) on public.listings to authenticated;
grant update (slots_left) on public.listings to authenticated;

-- listings_read / listings_owner policies are defined in 20261110155032_owner_listing_verification_and_permissions.sql.

-- Listing photos: owners upload into a folder named after their user id.
drop policy if exists photos_owner_insert on storage.objects;
drop policy if exists photos_owner_update on storage.objects;
drop policy if exists photos_owner_delete on storage.objects;

create policy photos_owner_insert on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'listing-photos'
        and public.is_owner()
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

create policy photos_owner_update on storage.objects
    for update to authenticated
    using (
        bucket_id = 'listing-photos'
        and public.is_owner()
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

create policy photos_owner_delete on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'listing-photos'
        and public.is_owner()
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

-- =========================================================
-- 3. MESSAGING
-- =========================================================

create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.listings(id) on delete cascade,
    student_id uuid not null references public.profiles(id) on delete cascade,
    owner_id uuid not null references public.profiles(id) on delete cascade,
    -- Name the student had when the chat started. Owners read this instead of
    -- the profiles table, which they are not allowed to query.
    student_name text,
    last_message_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    unique (listing_id, student_id)
);

create index if not exists conversations_owner_idx
    on public.conversations (owner_id, last_message_at desc);
create index if not exists conversations_student_idx
    on public.conversations (student_id, last_message_at desc);

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null
        references public.conversations(id) on delete cascade,
    sender_id uuid not null references public.profiles(id) on delete cascade,
    body text not null check (char_length(btrim(body)) between 1 and 2000),
    created_at timestamptz not null default now(),
    read_at timestamptz
);

create index if not exists messages_conversation_idx
    on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on table public.conversations from anon, authenticated;
revoke all on table public.messages from anon, authenticated;

-- Conversations: participants can read. Rows are created only by
-- start_conversation() below.
grant select on public.conversations to authenticated;

create policy conversations_select on public.conversations
    for select to authenticated
    using (
        student_id = (select auth.uid())
        or owner_id = (select auth.uid())
    );

-- Messages: participants read and send; the recipient can mark as read.
grant select on public.messages to authenticated;
grant insert (conversation_id, sender_id, body) on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;

create policy messages_select on public.messages
    for select to authenticated
    using (
        exists (
            select 1
            from public.conversations as c
            where c.id = messages.conversation_id
              and (
                  c.student_id = (select auth.uid())
                  or c.owner_id = (select auth.uid())
              )
        )
    );

create policy messages_insert on public.messages
    for insert to authenticated
    with check (
        sender_id = (select auth.uid())
        and exists (
            select 1
            from public.conversations as c
            where c.id = messages.conversation_id
              and (
                  c.student_id = (select auth.uid())
                  or c.owner_id = (select auth.uid())
              )
        )
    );

create policy messages_mark_read on public.messages
    for update to authenticated
    using (
        sender_id <> (select auth.uid())
        and exists (
            select 1
            from public.conversations as c
            where c.id = messages.conversation_id
              and (
                  c.student_id = (select auth.uid())
                  or c.owner_id = (select auth.uid())
              )
        )
    )
    with check (
        sender_id <> (select auth.uid())
    );

-- Keep conversations.last_message_at current.
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.conversations
       set last_message_at = new.created_at
     where id = new.conversation_id;
    return new;
end;
$$;

revoke all on function public.touch_conversation()
    from public, anon, authenticated;

drop trigger if exists messages_touch_conversation on public.messages;

create trigger messages_touch_conversation
    after insert on public.messages
    for each row execute function public.touch_conversation();

-- A student starts (or continues) a chat about one listing.
create or replace function public.start_conversation(
    p_listing_id uuid,
    p_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_uid   uuid := (select auth.uid());
    v_role  text;
    v_name  text;
    v_owner uuid;
    v_conv  uuid;
begin
    if v_uid is null then
        raise exception 'Please sign in first.';
    end if;

    select p.role, p.full_name
      into v_role, v_name
      from public.profiles as p
     where p.id = v_uid;

    if v_role is distinct from 'student' then
        raise exception 'Only student accounts can start a conversation.';
    end if;

    if p_body is null or char_length(btrim(p_body)) = 0 then
        raise exception 'Please write a message.';
    end if;

    if char_length(p_body) > 2000 then
        raise exception 'Messages can be at most 2000 characters.';
    end if;

    select l.created_by
      into v_owner
      from public.listings as l
     where l.id = p_listing_id
       and l.is_active = true;

    if v_owner is null then
        raise exception 'This listing is not available.';
    end if;

    insert into public.conversations (listing_id, student_id, owner_id, student_name)
    values (p_listing_id, v_uid, v_owner, coalesce(nullif(btrim(v_name), ''), 'Student'))
    on conflict (listing_id, student_id)
    do update set last_message_at = now()
    returning id into v_conv;

    insert into public.messages (conversation_id, sender_id, body)
    values (v_conv, v_uid, btrim(p_body));

    return v_conv;
end;
$$;

revoke all on function public.start_conversation(uuid, text) from public, anon;
grant execute on function public.start_conversation(uuid, text) to authenticated;

-- Inbox for either side: one row per conversation.
create or replace function public.my_conversations()
returns table (
    id uuid,
    listing_id uuid,
    listing_title text,
    other_name text,
    last_body text,
    last_at timestamptz,
    last_from_me boolean,
    unread_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
    select
        c.id,
        c.listing_id,
        l.title as listing_title,
        case
            when c.owner_id = (select auth.uid())
                then coalesce(c.student_name, 'Student')
            else coalesce(
                nullif(btrim(l.landlord_name), ''),
                nullif(btrim(op.full_name), ''),
                'Owner'
            )
        end as other_name,
        lm.body as last_body,
        coalesce(lm.created_at, c.last_message_at) as last_at,
        coalesce(lm.sender_id = (select auth.uid()), false) as last_from_me,
        (
            select count(*)
            from public.messages as m
            where m.conversation_id = c.id
              and m.sender_id <> (select auth.uid())
              and m.read_at is null
        ) as unread_count
    from public.conversations as c
    join public.listings as l on l.id = c.listing_id
    left join public.profiles as op on op.id = c.owner_id
    left join lateral (
        select m.body, m.created_at, m.sender_id
        from public.messages as m
        where m.conversation_id = c.id
        order by m.created_at desc
        limit 1
    ) as lm on true
    where c.student_id = (select auth.uid())
       or c.owner_id = (select auth.uid())
    order by coalesce(lm.created_at, c.last_message_at) desc
    limit 200;
$$;

revoke all on function public.my_conversations() from public, anon;
grant execute on function public.my_conversations() to authenticated;

-- Realtime: new messages and inbox changes arrive without refreshing.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;

-- Students' Discover feed refreshes when an owner publishes or edits a listing.
alter publication supabase_realtime add table public.listings;

-- =========================================================
-- 4. OWNER DASHBOARD DATA
-- =========================================================

create or replace function public.owner_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    v_uid uuid := (select auth.uid());
begin
    if not (public.is_owner() or public.is_admin()) then
        raise exception 'Owner access only.';
    end if;

    return jsonb_build_object(
        'total_listings', (
            select count(*) from public.listings l
            where l.created_by = v_uid
        ),
        'active_listings', (
            select count(*) from public.listings l
            where l.created_by = v_uid and l.is_active
        ),
        'swipes', (
            select count(*)
            from public.swipes s
            join public.listings l on l.id = s.listing_id
            where l.created_by = v_uid
        ),
        'saves', (
            select count(*)
            from public.swipes s
            join public.listings l on l.id = s.listing_id
            where l.created_by = v_uid
              and s.direction = 'right'
              and s.unliked_at is null
        ),
        'interested_students', (
            select count(distinct s.user_id)
            from public.swipes s
            join public.listings l on l.id = s.listing_id
            where l.created_by = v_uid
              and s.direction = 'right'
              and s.unliked_at is null
        ),
        'new_inquiries', (
            select count(*)
            from public.conversations c
            where c.owner_id = v_uid
              and exists (
                  select 1
                  from public.messages m
                  where m.conversation_id = c.id
                    and m.sender_id = c.student_id
                    and m.read_at is null
              )
        )
    );
end;
$$;

revoke all on function public.owner_dashboard_stats() from public, anon;
grant execute on function public.owner_dashboard_stats() to authenticated;

-- Students who saved at least one of the caller's listings.
-- Monitoring details only: no email, phone or contact_info.
create or replace function public.owner_interested_students()
returns table (
    full_name text,
    campus text,
    saved_count bigint,
    swipe_count bigint,
    last_activity timestamptz,
    joined_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
    select
        coalesce(nullif(btrim(p.full_name), ''), 'Student') as full_name,
        cp.short_name as campus,
        count(*) filter (
            where s.direction = 'right' and s.unliked_at is null
        ) as saved_count,
        count(*) as swipe_count,
        max(s.swiped_at) as last_activity,
        p.created_at as joined_at
    from public.swipes as s
    join public.listings as l on l.id = s.listing_id
    join public.profiles as p on p.id = s.user_id
    left join public.campuses as cp on cp.id = p.campus_id
    where l.created_by = (select auth.uid())
      and p.role = 'student'
      and (public.is_owner() or public.is_admin())
    group by p.id, p.full_name, cp.short_name, p.created_at
    having count(*) filter (
        where s.direction = 'right' and s.unliked_at is null
    ) > 0
    order by max(s.swiped_at) desc
    limit 100;
$$;

revoke all on function public.owner_interested_students() from public, anon;
grant execute on function public.owner_interested_students() to authenticated;

commit;
