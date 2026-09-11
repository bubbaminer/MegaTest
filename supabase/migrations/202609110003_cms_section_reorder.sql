begin;

create or replace function public.cms_move_section(p_section_id uuid, p_direction text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_row public.page_sections%rowtype;
  adjacent_row public.page_sections%rowtype;
  temporary_order integer;
begin
  if public.current_user_role() not in ('admin', 'editor') then raise exception 'insufficient_permissions'; end if;
  if p_direction not in ('up', 'down') then raise exception 'invalid_direction'; end if;
  select * into current_row from public.page_sections where id = p_section_id for update;
  if not found then raise exception 'section_not_found'; end if;
  if p_direction = 'up' then
    select * into adjacent_row from public.page_sections where page_id = current_row.page_id and sort_order < current_row.sort_order order by sort_order desc limit 1 for update;
  else
    select * into adjacent_row from public.page_sections where page_id = current_row.page_id and sort_order > current_row.sort_order order by sort_order asc limit 1 for update;
  end if;
  if not found then return; end if;
  select coalesce(max(sort_order), 0) + 1000000 into temporary_order from public.page_sections where page_id = current_row.page_id;
  update public.page_sections set sort_order = temporary_order where id = current_row.id;
  update public.page_sections set sort_order = current_row.sort_order where id = adjacent_row.id;
  update public.page_sections set sort_order = adjacent_row.sort_order where id = current_row.id;
end;
$$;

grant execute on function public.cms_move_section(uuid, text) to authenticated;

commit;
