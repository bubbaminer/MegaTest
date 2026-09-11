begin;

create type public.content_status as enum ('draft', 'scheduled', 'published', 'archived');
create type public.review_status as enum ('pending', 'approved', 'rejected');

create table public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  slug text not null unique check (slug ~ '^(home|[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*)*)$'),
  status public.content_status not null default 'draft',
  meta_title text,
  meta_description text,
  canonical_url text,
  robots_directives text,
  og_title text,
  og_description text,
  og_image_url text,
  structured_data jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_data) = 'object'),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (status <> 'published' or published_at is not null)
);

create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.cms_pages(id) on delete cascade,
  type text not null check (length(trim(type)) > 0),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, sort_order)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_bucket text not null default 'media',
  storage_path text not null,
  filename text not null check (length(trim(filename)) > 0),
  alt text,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  mime_type text not null check (mime_type like 'image/%'),
  size_bytes bigint not null check (size_bytes >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (storage_bucket, storage_path)
);

create table public.article_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.article_categories(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text,
  content jsonb not null default '[]'::jsonb check (jsonb_typeof(content) in ('array', 'object')),
  featured_media_id uuid references public.media_assets(id) on delete set null,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (status <> 'published' or published_at is not null)
);

create table public.faq_entries (
  id uuid primary key default gen_random_uuid(),
  question text not null check (length(trim(question)) > 0),
  answer jsonb not null check (jsonb_typeof(answer) in ('array', 'object')),
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  text text not null check (length(trim(text)) between 2 and 10000),
  status public.review_status not null default 'pending',
  verified_purchase boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index cms_pages_public_idx on public.cms_pages (slug) where status = 'published' and deleted_at is null;
create index page_sections_render_idx on public.page_sections (page_id, sort_order) where is_visible;
create index articles_public_idx on public.articles (published_at desc) where status = 'published' and deleted_at is null;
create index faq_public_idx on public.faq_entries (sort_order) where status = 'published' and deleted_at is null;
create index reviews_moderation_idx on public.reviews (status, created_at desc) where deleted_at is null;

create trigger cms_pages_set_updated_at before update on public.cms_pages for each row execute function public.set_updated_at();
create trigger page_sections_set_updated_at before update on public.page_sections for each row execute function public.set_updated_at();
create trigger articles_set_updated_at before update on public.articles for each row execute function public.set_updated_at();
create trigger faq_entries_set_updated_at before update on public.faq_entries for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews for each row execute function public.set_updated_at();

alter table public.cms_pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.media_assets enable row level security;
alter table public.article_categories enable row level security;
alter table public.articles enable row level security;
alter table public.faq_entries enable row level security;
alter table public.reviews enable row level security;

create policy cms_pages_public_read on public.cms_pages for select using (status = 'published' and published_at <= now() and deleted_at is null);
create policy page_sections_public_read on public.page_sections for select using (
  is_visible and exists (select 1 from public.cms_pages p where p.id = page_id and p.status = 'published' and p.published_at <= now() and p.deleted_at is null)
);
create policy media_assets_public_read on public.media_assets for select using (deleted_at is null);
create policy article_categories_public_read on public.article_categories for select using (true);
create policy articles_public_read on public.articles for select using (status = 'published' and published_at <= now() and deleted_at is null);
create policy faq_public_read on public.faq_entries for select using (status = 'published' and deleted_at is null);
create policy reviews_public_read on public.reviews for select using (status = 'approved' and deleted_at is null);
create policy reviews_owner_read on public.reviews for select to authenticated using (user_id = auth.uid());
create policy reviews_owner_create on public.reviews for insert to authenticated with check (user_id = auth.uid() and status = 'pending' and verified_purchase = false);

create policy cms_pages_staff_all on public.cms_pages for all to authenticated using (public.current_user_role() in ('admin', 'editor')) with check (public.current_user_role() in ('admin', 'editor'));
create policy page_sections_staff_all on public.page_sections for all to authenticated using (public.current_user_role() in ('admin', 'editor')) with check (public.current_user_role() in ('admin', 'editor'));
create policy media_assets_staff_all on public.media_assets for all to authenticated using (public.current_user_role() in ('admin', 'editor')) with check (public.current_user_role() in ('admin', 'editor'));
create policy article_categories_staff_all on public.article_categories for all to authenticated using (public.current_user_role() in ('admin', 'editor')) with check (public.current_user_role() in ('admin', 'editor'));
create policy articles_staff_all on public.articles for all to authenticated using (public.current_user_role() in ('admin', 'editor')) with check (public.current_user_role() in ('admin', 'editor'));
create policy faq_staff_all on public.faq_entries for all to authenticated using (public.current_user_role() in ('admin', 'editor')) with check (public.current_user_role() in ('admin', 'editor'));
create policy reviews_staff_all on public.reviews for all to authenticated using (public.current_user_role() in ('admin', 'support')) with check (public.current_user_role() in ('admin', 'support'));

grant select on public.cms_pages, public.page_sections, public.media_assets, public.article_categories, public.articles, public.faq_entries, public.reviews to anon, authenticated;
grant insert on public.reviews to authenticated;
grant insert, update, delete on public.cms_pages, public.page_sections, public.media_assets, public.article_categories, public.articles, public.faq_entries to authenticated;
grant update, delete on public.reviews to authenticated;
grant all on public.cms_pages, public.page_sections, public.media_assets, public.article_categories, public.articles, public.faq_entries, public.reviews to service_role;

commit;
