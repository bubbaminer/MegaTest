-- Isolated CI fixture assertion; not a production migration.
do $$
begin
  if not exists (
    select 1 from public.profiles
    where id = '00000000-0000-4000-8000-000000000001'
      and role = 'admin' and display_name = 'Existing administrator'
  ) then
    raise exception 'Existing administrator was changed by the migration';
  end if;
end
$$;
