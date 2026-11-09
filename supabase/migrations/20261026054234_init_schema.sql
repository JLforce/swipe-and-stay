-- ===== Extensions & helpers =====
create extension if not exists "pgcrypto";

-- ===== Tables =====
create table public.campuses (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    short_name text not null unique,
    city text not null default 'Cebu City',
    lat numeric(9,6) not null,
    lng numeric(9,6) not null,
    created_at timestamptz not null default now()
);

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    full_name text,
    avatar_url text,
    role text not null default 'student'
        check (role in ('student','admin')),
    campus_id uuid references public.campuses(id),
    program text,
    contact_info text,
    budget_min integer check (budget_min >= 0),
    budget_max integer check (budget_max >= 0),
    housing_type text
        check (housing_type in ('dorm','boarding_house','apartment','condo')),
    roommate_pref text
        check (roommate_pref in ('solo','shared','no_preference')),
    desired_amenities text[] not null default '{}',
    onboarding_completed boolean not null default false,
    created_at timestamptz not null default now(),
    constraint budget_order check (
        budget_min is null
        or budget_max is null
        or budget_min <= budget_max
    )
);

create table public.listings (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    price numeric(10,2) not null check (price >= 0),
    type text not null
        check (type in ('dorm','boarding_house','apartment','condo')),
    occupancy text check (occupancy in ('solo','shared')),
    address text not null,
    lat numeric(9,6) not null check (lat between -90 and 90),
    lng numeric(9,6) not null check (lng between -180 and 180),
    amenities text[] not null default '{}',
    photo_urls text[] not null default '{}',
    landlord_name text,
    landlord_phone text,
    landlord_email text,
    landlord_link text,
    is_active boolean not null default true,
    created_by uuid references public.profiles(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index listings_active_idx on public.listings (is_active);

create table public.listing_admin_notes (
    listing_id uuid primary key
        references public.listings(id) on delete cascade,
    admin_notes text not null default '',
    updated_at timestamptz not null default now()
);

create table public.swipes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    listing_id uuid not null references public.listings(id) on delete cascade,
    direction text not null check (direction in ('left','right')),
    swiped_at timestamptz not null default now(),
    unliked_at timestamptz,
    unique (user_id, listing_id)
);

create index swipes_user_idx
    on public.swipes (user_id, swiped_at desc);

create view public.liked_listings
with (security_invoker = true) as
    select s.user_id, s.listing_id, s.swiped_at as liked_at
    from public.swipes s
    where s.direction = 'right' and s.unliked_at is null;

create table public.preference_weights (
    user_id uuid primary key
        references public.profiles(id) on delete cascade,
    priority_weights jsonb not null
        default '{"price":0.4,"distance":0.3,"amenities":0.2,"type":0.1}',
    swipe_count integer not null default 0,
    updated_at timestamptz not null default now()
);

create table public.lease_reviews (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    lease_text text not null check (char_length(lease_text) <= 20000),
    summary_text text,
    deposit text,
    notice_period text,
    utilities_included text,
    penalties text,
    flagged_clauses jsonb not null default '[]',
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    type text not null
        check (type in ('new_match','listing_deactivated')),
    title text not null,
    body text,
    listing_id uuid references public.listings(id) on delete set null,
    created_at timestamptz not null default now(),
    read_at timestamptz
);

create index notifications_user_idx
    on public.notifications (user_id, created_at desc);

create table public.match_explanations (
    user_id uuid not null references public.profiles(id) on delete cascade,
    listing_id uuid not null references public.listings(id) on delete cascade,
    explanation text not null,
    created_at timestamptz not null default now(),
    primary key (user_id, listing_id)
);

-- ===== Helper functions & triggers =====
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles p
        where p.id = auth.uid() and p.role = 'admin'
    );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name, avatar_url)
    values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger listings_touch
    before update on public.listings
    for each row execute function public.touch_updated_at();

-- ===== Row-Level Security =====
alter table public.campuses enable row level security;
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_admin_notes enable row level security;
alter table public.swipes enable row level security;
alter table public.preference_weights enable row level security;
alter table public.lease_reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.match_explanations enable row level security;

-- Campuses: signed-in users can read; admins can manage
create policy campuses_read on public.campuses
    for select to authenticated using (true);

create policy campuses_admin on public.campuses
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Profiles: own profile; admins can read all
create policy profiles_select on public.profiles
    for select to authenticated
    using (id = (select auth.uid()) or public.is_admin());

create policy profiles_update on public.profiles
    for update to authenticated
    using (id = (select auth.uid()))
    with check (id = (select auth.uid()));

revoke update on public.profiles from authenticated;

grant update (
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
) on public.profiles to authenticated;

-- Listings: signed-in users can read; admins can manage
create policy listings_read on public.listings
    for select to authenticated using (true);

create policy listings_admin on public.listings
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

create policy notes_admin on public.listing_admin_notes
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Swipes: users manage their own rows
create policy swipes_select on public.swipes
    for select to authenticated
    using (user_id = (select auth.uid()));

create policy swipes_insert on public.swipes
    for insert to authenticated
    with check (user_id = (select auth.uid()));

create policy swipes_update on public.swipes
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

revoke update on public.swipes from authenticated;
grant update (unliked_at) on public.swipes to authenticated;

-- Preference weights and lease reviews: own rows only
create policy weights_all on public.preference_weights
    for all to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

create policy lease_select on public.lease_reviews
    for select to authenticated
    using (user_id = (select auth.uid()));

create policy lease_insert on public.lease_reviews
    for insert to authenticated
    with check (user_id = (select auth.uid()));

-- Notifications: read own and update read_at only
create policy notif_select on public.notifications
    for select to authenticated
    using (user_id = (select auth.uid()));

create policy notif_update on public.notifications
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Match explanations: users can read their own
create policy expl_select on public.match_explanations
    for select to authenticated
    using (user_id = (select auth.uid()));

-- ===== Realtime notifications =====
alter publication supabase_realtime
    add table public.notifications;

-- ===== Storage for listing photos =====
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy photos_read on storage.objects
    for select
    using (bucket_id = 'listing-photos');

create policy photos_admin_insert on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'listing-photos'
        and public.is_admin()
    );

create policy photos_admin_update on storage.objects
    for update to authenticated
    using (
        bucket_id = 'listing-photos'
        and public.is_admin()
    );

create policy photos_admin_delete on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'listing-photos'
        and public.is_admin()
    );