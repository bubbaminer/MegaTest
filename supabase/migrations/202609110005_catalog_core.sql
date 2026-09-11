begin;

create type public.catalog_status as enum ('draft', 'active', 'hidden', 'archived');
create type public.delivery_type as enum ('automatic_api', 'top_up', 'trade', 'mail', 'manual');
create type public.stock_status as enum ('unlimited', 'in_stock', 'out_of_stock', 'preorder');

create table public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text,
  description jsonb not null default '[]'::jsonb check (jsonb_typeof(description) in ('array', 'object')),
  logo_media_id uuid references public.media_assets(id) on delete set null,
  image_media_id uuid references public.media_assets(id) on delete set null,
  banner_media_id uuid references public.media_assets(id) on delete set null,
  status public.catalog_status not null default 'draft',
  sort_order integer not null default 0 check (sort_order >= 0),
  extra_fields jsonb not null default '{}'::jsonb check (jsonb_typeof(extra_fields) = 'object'),
  meta_title text, meta_description text, canonical_url text, robots_directives text,
  og_title text, og_description text, og_image_url text,
  structured_data jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description jsonb not null default '[]'::jsonb check (jsonb_typeof(description) in ('array', 'object')),
  image_media_id uuid references public.media_assets(id) on delete set null,
  status public.catalog_status not null default 'draft',
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (parent_id is null or parent_id <> id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete restrict,
  category_id uuid references public.categories(id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text,
  description jsonb not null default '[]'::jsonb check (jsonb_typeof(description) in ('array', 'object')),
  image_media_id uuid references public.media_assets(id) on delete set null,
  price_minor bigint not null check (price_minor >= 0),
  old_price_minor bigint check (old_price_minor is null or old_price_minor >= price_minor),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  stock_status public.stock_status not null default 'unlimited',
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  delivery_type public.delivery_type not null default 'manual',
  checkout_requirements jsonb not null default '[]'::jsonb check (jsonb_typeof(checkout_requirements) = 'array'),
  delivery_config jsonb not null default '{}'::jsonb check (jsonb_typeof(delivery_config) = 'object'),
  status public.catalog_status not null default 'draft',
  sort_order integer not null default 0 check (sort_order >= 0),
  meta_title text, meta_description text, canonical_url text, robots_directives text,
  og_title text, og_description text, og_image_url text,
  structured_data jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete restrict,
  category_id uuid references public.categories(id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text,
  description jsonb not null default '[]'::jsonb check (jsonb_typeof(description) in ('array', 'object')),
  instructions jsonb not null default '[]'::jsonb check (jsonb_typeof(instructions) in ('array', 'object')),
  image_media_id uuid references public.media_assets(id) on delete set null,
  price_minor bigint not null check (price_minor >= 0),
  old_price_minor bigint check (old_price_minor is null or old_price_minor >= price_minor),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  variants jsonb not null default '[]'::jsonb check (jsonb_typeof(variants) = 'array'),
  checkout_requirements jsonb not null default '[]'::jsonb check (jsonb_typeof(checkout_requirements) = 'array'),
  delivery_type public.delivery_type not null default 'manual',
  delivery_config jsonb not null default '{}'::jsonb check (jsonb_typeof(delivery_config) = 'object'),
  status public.catalog_status not null default 'draft',
  sort_order integer not null default 0 check (sort_order >= 0),
  meta_title text, meta_description text, canonical_url text, robots_directives text,
  og_title text, og_description text, og_image_url text,
  structured_data jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.reviews add column product_id uuid references public.products(id) on delete restrict;

create index games_public_idx on public.games (sort_order, name) where status = 'active' and deleted_at is null;
create index categories_parent_idx on public.categories (parent_id, sort_order, name) where deleted_at is null;
create index products_game_idx on public.products (game_id, sort_order) where status = 'active' and deleted_at is null;
create index products_category_idx on public.products (category_id, sort_order) where status = 'active' and deleted_at is null;
create index services_game_idx on public.services (game_id, sort_order) where status = 'active' and deleted_at is null;

create trigger games_set_updated_at before update on public.games for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger services_set_updated_at before update on public.services for each row execute function public.set_updated_at();

alter table public.games enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;

create policy games_public_read on public.games for select using (status = 'active' and deleted_at is null);
create policy categories_public_read on public.categories for select using (status = 'active' and deleted_at is null);
create policy products_public_read on public.products for select using (status = 'active' and deleted_at is null);
create policy services_public_read on public.services for select using (status = 'active' and deleted_at is null);

create policy games_staff_read on public.games for select to authenticated using (public.current_user_role() in ('admin', 'manager'));
create policy games_staff_insert on public.games for insert to authenticated with check (public.current_user_role() in ('admin', 'manager'));
create policy games_staff_update on public.games for update to authenticated using (public.current_user_role() in ('admin', 'manager')) with check (public.current_user_role() in ('admin', 'manager'));
create policy categories_staff_read on public.categories for select to authenticated using (public.current_user_role() in ('admin', 'manager'));
create policy categories_staff_insert on public.categories for insert to authenticated with check (public.current_user_role() in ('admin', 'manager'));
create policy categories_staff_update on public.categories for update to authenticated using (public.current_user_role() in ('admin', 'manager')) with check (public.current_user_role() in ('admin', 'manager'));
create policy products_staff_read on public.products for select to authenticated using (public.current_user_role() in ('admin', 'manager'));
create policy products_staff_insert on public.products for insert to authenticated with check (public.current_user_role() in ('admin', 'manager'));
create policy products_staff_update on public.products for update to authenticated using (public.current_user_role() in ('admin', 'manager')) with check (public.current_user_role() in ('admin', 'manager'));
create policy services_staff_read on public.services for select to authenticated using (public.current_user_role() in ('admin', 'manager'));
create policy services_staff_insert on public.services for insert to authenticated with check (public.current_user_role() in ('admin', 'manager'));
create policy services_staff_update on public.services for update to authenticated using (public.current_user_role() in ('admin', 'manager')) with check (public.current_user_role() in ('admin', 'manager'));

grant select on public.games, public.categories, public.products, public.services to anon, authenticated;
grant insert, update on public.games, public.categories, public.products, public.services to authenticated;
grant all on public.games, public.categories, public.products, public.services to service_role;

commit;
