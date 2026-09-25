-- =====================================================================
-- Verdek Pitchly — Supabase schema
-- Run this once in your Supabase project's SQL Editor (Database > SQL
-- Editor > New query), top to bottom. Safe to re-run on a fresh project.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- ORGS — one workspace. Everyone Javian invites lands in the same org.
-- Kept as its own table (rather than hardcoding) so Verdek could later
-- license Pitchly to other freelancers/agencies as separate workspaces
-- without a schema change.
-- ---------------------------------------------------------------------
create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Verdek',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PROFILES — one row per auth.users row. role decides admin-portal access.
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references orgs(id),
  email text not null,
  display_name text,
  role text not null default 'member' check (role in ('admin','member')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- SWEEPS — a requested discovery run (query + area). Filled in by
-- whoever runs the sweep (you, in a Claude chat) and then marked done
-- with a count once qualified prospects are imported.
-- ---------------------------------------------------------------------
create table if not exists sweeps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id),
  query text not null,
  area text not null default 'anywhere in Jamaica',
  criteria text not null default 'strong reviews, weak or no website',
  status text not null default 'queued' check (status in ('queued','running','done','failed')),
  count integer not null default 0,
  requested_by uuid references profiles(id),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ---------------------------------------------------------------------
-- PROSPECTS — the merged lead + pipeline record. (The old Artifact
-- version split "prospects" and "crm" into two stores because of how
-- local-vs-synced data worked; with a real database there's no reason
-- to keep that split, so this is one table.)
-- ---------------------------------------------------------------------
create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id),

  -- discovery facts (never invented — only what was actually verified)
  name text not null,
  category text not null default 'Business',
  area text not null default 'Jamaica',
  address text not null default '',
  phone text not null default '',
  rating numeric(2,1) not null default 0,
  reviews integer not null default 0,
  website_type text not null default 'none' check (website_type in ('none','weak','listing','has_site')),
  website_url text not null default '',
  website_note text not null default '',
  instagram text not null default '',
  facebook text not null default '',
  owner_replies integer not null default 0,
  signals jsonb not null default '[]',
  source text not null default 'manual',
  sweep_id uuid references sweeps(id) on delete set null,
  added_at date not null default current_date,

  -- pipeline / CRM state
  status text not null default 'new' check (status in
    ('new','contacted','replied','interested','qualified','mockup','proposal','won','lost')),
  pitch text,
  notes text not null default '',
  package text not null default '',
  quote text not null default '',
  delivery_days text not null default '',
  qualification text not null default '',
  objection text not null default '',
  lost_reason text not null default '',
  lost_note text not null default '',
  concept jsonb,
  won_value numeric not null default 0,
  follow_up_date date,
  contacted_at timestamptz,
  fu_done integer not null default 0,
  events jsonb not null default '{}',

  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- soft dedupe guard: same name + area can't be added twice per org
  unique (org_id, area, name)
);

create index if not exists prospects_org_status_idx on prospects (org_id, status);
create index if not exists prospects_org_area_idx on prospects (org_id, area);

-- ---------------------------------------------------------------------
-- ACTIVITY LOG — one row per logged pipeline event, replacing the old
-- jsonb array-on-the-record so multiple team members get a real,
-- attributable audit trail.
-- ---------------------------------------------------------------------
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  org_id uuid not null references orgs(id),
  text text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists activity_log_prospect_idx on activity_log (prospect_id, created_at desc);

-- ---------------------------------------------------------------------
-- SCANNED BUSINESSES — the running "already has a real site, not a
-- prospect" list, so repeat sweeps don't re-surface them. Replaces the
-- hardcoded SCANNED array that used to live in the JS bundle.
-- ---------------------------------------------------------------------
create table if not exists scanned_businesses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id),
  name text not null,
  note text not null default '',
  added_at date not null default current_date,
  unique (org_id, name)
);

-- ---------------------------------------------------------------------
-- ORG SETTINGS — one row per org: pitch signature, default packages,
-- default sweep area.
-- ---------------------------------------------------------------------
create table if not exists org_settings (
  org_id uuid primary key references orgs(id),
  owner_name text not null default 'Javian',
  default_area text not null default 'all',
  packages jsonb not null default '{
    "starter":{"name":"Starter","price":"JMD $35,000","days":"5 days","items":["Simple professional one-page website","Mobile responsive","WhatsApp / contact button","Your services or products","Basic SEO"]},
    "business":{"name":"Business","price":"JMD $60,000","days":"7 days","items":["Multi-page website","Stronger branding (logo refresh and colours)","Booking or enquiry form","WhatsApp integration","SEO basics","Reviews and social proof"]},
    "premium":{"name":"Premium","price":"JMD $120,000","days":"14 days","items":["Full website","Complete branding","Booking and lead system","Advanced conversion optimisation","SEO","Ongoing support and maintenance"]}
  }',
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- Helper functions (security definer so they can see across RLS)
-- =====================================================================
create or replace function public.current_org_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

-- Only an admin may change someone's role. Called from the Admin > Users
-- page — never expose a raw "update profiles set role" to non-admins.
create or replace function public.set_user_role(target_user uuid, new_role text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  if new_role not in ('admin','member') then
    raise exception 'invalid role %', new_role;
  end if;
  update profiles set role = new_role
  where id = target_user and org_id = current_org_id();
end;
$$;

-- Auto-provision a profile (and, for the very first user ever, the org)
-- whenever someone signs in for the first time. The first person to
-- ever sign in becomes admin; everyone invited after that is a member.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid;
  v_role text;
begin
  select id into v_org_id from orgs order by created_at asc limit 1;
  if v_org_id is null then
    insert into orgs (name) values ('Verdek') returning id into v_org_id;
    v_role := 'admin';
  else
    v_role := 'member';
  end if;
  insert into profiles (id, org_id, email, display_name, role)
  values (new.id, v_org_id, new.email, split_part(new.email, '@', 1), v_role)
  on conflict (id) do nothing;

  insert into org_settings (org_id) values (v_org_id)
  on conflict (org_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep updated_at fresh on prospects
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prospects_touch on prospects;
create trigger prospects_touch before update on prospects
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Row Level Security — every table is scoped to the caller's org_id.
-- Admins are just org members with a role flag; they don't see other
-- orgs unless you deliberately widen these policies later.
-- =====================================================================
alter table orgs enable row level security;
alter table profiles enable row level security;
alter table sweeps enable row level security;
alter table prospects enable row level security;
alter table activity_log enable row level security;
alter table scanned_businesses enable row level security;
alter table org_settings enable row level security;

create policy "member reads own org" on orgs for select
  using (id = current_org_id());

create policy "member reads org profiles" on profiles for select
  using (org_id = current_org_id());
create policy "user updates own display name" on profiles for update
  using (id = auth.uid());

create policy "org rw prospects select" on prospects for select
  using (org_id = current_org_id());
create policy "org rw prospects insert" on prospects for insert
  with check (org_id = current_org_id());
create policy "org rw prospects update" on prospects for update
  using (org_id = current_org_id());
create policy "admin deletes prospects" on prospects for delete
  using (is_admin() and org_id = current_org_id());

create policy "org rw sweeps select" on sweeps for select
  using (org_id = current_org_id());
create policy "org rw sweeps insert" on sweeps for insert
  with check (org_id = current_org_id());
create policy "org rw sweeps update" on sweeps for update
  using (org_id = current_org_id());

create policy "org rw activity select" on activity_log for select
  using (org_id = current_org_id());
create policy "org rw activity insert" on activity_log for insert
  with check (org_id = current_org_id());

create policy "org rw scanned select" on scanned_businesses for select
  using (org_id = current_org_id());
create policy "org rw scanned insert" on scanned_businesses for insert
  with check (org_id = current_org_id());

create policy "org reads settings" on org_settings for select
  using (org_id = current_org_id());
create policy "admin writes settings" on org_settings for update
  using (is_admin() and org_id = current_org_id());

-- =====================================================================
-- Realtime — let the app subscribe to live changes (multi-device /
-- multi-teammate sync, replacing the old Artifact db.onSnapshot).
-- =====================================================================
alter publication supabase_realtime add table prospects;
alter publication supabase_realtime add table sweeps;
alter publication supabase_realtime add table activity_log;

-- =====================================================================
-- Done. Next steps (see README.md):
--   1. Authentication > Providers: leave Email on, turn OFF "Allow new
--      users to sign up" once you (the first user) have signed in, so
--      the app stays invite-only.
--   2. Authentication > Users > Invite user — add yourself first (you
--      become admin automatically), then teammates as needed.
-- =====================================================================
