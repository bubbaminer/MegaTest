begin;

-- Changing grants does not modify users, roles, content or storage objects.
-- Revoke both table-wide and existing column-level UPDATE grants.
revoke update on public.profiles from public, anon, authenticated;
revoke update (id, role, display_name, avatar_url, created_at, updated_at)
  on public.profiles from public, anon, authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- Existing self-update RLS remains in force. Administrative role assignment
-- continues through trusted SQL/service_role, never a browser profile update.
commit;
