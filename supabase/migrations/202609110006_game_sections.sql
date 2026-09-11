begin;
create table public.game_sections (
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.games(id) on delete cascade,
  type text not null check (length(trim(type)) > 0), data jsonb not null default '{}'::jsonb check (jsonb_typeof(data)='object'),
  sort_order integer not null default 0 check (sort_order>=0), is_visible boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(game_id,sort_order)
);
create index game_sections_render_idx on public.game_sections(game_id,sort_order) where is_visible;
create trigger game_sections_set_updated_at before update on public.game_sections for each row execute function public.set_updated_at();
alter table public.game_sections enable row level security;
create policy game_sections_public_read on public.game_sections for select using (is_visible and exists(select 1 from public.games g where g.id=game_id and g.status='active' and g.deleted_at is null));
create policy game_sections_staff_read on public.game_sections for select to authenticated using (public.current_user_role() in ('admin','manager','editor'));
create policy game_sections_staff_insert on public.game_sections for insert to authenticated with check (public.current_user_role() in ('admin','manager','editor'));
create policy game_sections_staff_update on public.game_sections for update to authenticated using (public.current_user_role() in ('admin','manager','editor')) with check (public.current_user_role() in ('admin','manager','editor'));
create policy game_sections_staff_delete on public.game_sections for delete to authenticated using (public.current_user_role() in ('admin','manager','editor'));
grant select on public.game_sections to anon,authenticated; grant insert,update,delete on public.game_sections to authenticated; grant all on public.game_sections to service_role;

create or replace function public.game_move_section(p_section_id uuid,p_direction text) returns void language plpgsql security invoker set search_path=public as $$
declare current_row public.game_sections%rowtype; adjacent_row public.game_sections%rowtype; temporary_order integer;
begin
 if public.current_user_role() not in ('admin','manager','editor') then raise exception 'insufficient_permissions'; end if;
 if p_direction not in ('up','down') then raise exception 'invalid_direction'; end if;
 select * into current_row from public.game_sections where id=p_section_id for update; if not found then raise exception 'section_not_found'; end if;
 if p_direction='up' then select * into adjacent_row from public.game_sections where game_id=current_row.game_id and sort_order<current_row.sort_order order by sort_order desc limit 1 for update;
 else select * into adjacent_row from public.game_sections where game_id=current_row.game_id and sort_order>current_row.sort_order order by sort_order asc limit 1 for update; end if;
 if not found then return; end if;
 select coalesce(max(sort_order),0)+1000000 into temporary_order from public.game_sections where game_id=current_row.game_id;
 update public.game_sections set sort_order=temporary_order where id=current_row.id; update public.game_sections set sort_order=current_row.sort_order where id=adjacent_row.id; update public.game_sections set sort_order=adjacent_row.sort_order where id=current_row.id;
end; $$;
grant execute on function public.game_move_section(uuid,text) to authenticated;

insert into public.cms_pages(id,title,slug,status,meta_title,meta_description,robots_directives,published_at)
values('00000000-0000-4000-8000-000000000002','Каталог','catalog','published','Каталог игр','Выберите игру и подходящий цифровой товар или услугу.','index,follow',now()) on conflict(slug) do nothing;
insert into public.page_sections(id,page_id,type,data,sort_order,is_visible) values('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000002','cta','{"title":"Не нашли нужную игру?","text":"Сообщите нам, какую игру или услугу нужно добавить в каталог.","action":{"label":"Написать в поддержку","url":"/support"}}'::jsonb,100,true) on conflict(id) do nothing;
commit;
