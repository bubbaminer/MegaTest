-- Isolated CI fixture. NEVER run this file against a real Supabase project.
create role anon;
create role authenticated;
create role service_role;
create table public.profiles (
  id uuid primary key,
  role text not null default 'customer',
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.profiles(id, role, display_name)
values ('00000000-0000-4000-8000-000000000001', 'admin', 'Existing administrator');
-- Model both legacy table-wide and column-level grants.
grant select, update on public.profiles to authenticated;
grant update (role) on public.profiles to authenticated;
grant all on public.profiles to service_role;
