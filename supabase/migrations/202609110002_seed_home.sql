begin;

insert into public.cms_pages (
  id, title, slug, status, meta_title, meta_description, robots_directives, published_at
) values (
  '00000000-0000-4000-8000-000000000001',
  'Главная',
  'home',
  'published',
  'Digital Store',
  'Платформа цифровых игровых товаров',
  'index,follow',
  now()
) on conflict (slug) do nothing;

insert into public.page_sections (id, page_id, type, data, sort_order, is_visible)
values
  (
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000001',
    'hero',
    '{"title":"Цифровые игровые товары","subtitle":"Управляйте этим текстом и всеми секциями главной страницы через CMS.","cta":{"label":"Перейти в каталог","url":"/catalog/"}}'::jsonb,
    0,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000001',
    'rich_text',
    '{"content":"CMS-страница успешно опубликована. Следующий шаг — административный редактор секций."}'::jsonb,
    10,
    true
  )
on conflict (id) do nothing;

commit;
