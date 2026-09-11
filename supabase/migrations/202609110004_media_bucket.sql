begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy media_objects_public_read on storage.objects for select using (bucket_id = 'media');
create policy media_objects_staff_insert on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.current_user_role() in ('admin', 'editor'));
create policy media_objects_staff_update on storage.objects for update to authenticated using (bucket_id = 'media' and public.current_user_role() in ('admin', 'editor')) with check (bucket_id = 'media' and public.current_user_role() in ('admin', 'editor'));
create policy media_objects_staff_delete on storage.objects for delete to authenticated using (bucket_id = 'media' and public.current_user_role() in ('admin', 'editor'));

commit;
