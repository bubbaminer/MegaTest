-- Run after 202609170001_profile_update_permissions.sql.
-- Assertions only; no user data is modified.
begin;
do $$
begin
  if has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE') then
    raise exception 'authenticated must not update profile roles';
  end if;
  if has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE') then
    raise exception 'authenticated must not update profile ownership';
  end if;
  if has_column_privilege('anon', 'public.profiles', 'display_name', 'UPDATE') then
    raise exception 'anonymous profile updates must be denied';
  end if;
  if not has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE') then
    raise exception 'profile display name updates must remain available';
  end if;
  if not has_column_privilege('authenticated', 'public.profiles', 'avatar_url', 'UPDATE') then
    raise exception 'profile avatar updates must remain available';
  end if;
  if not has_column_privilege('service_role', 'public.profiles', 'role', 'UPDATE') then
    raise exception 'trusted role administration must remain available';
  end if;
end
$$;
rollback;
