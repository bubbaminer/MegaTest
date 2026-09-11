import { AppError } from '@/lib/errors/app-error';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface CmsPageSummary {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  updatedAt: string;
}

export async function listCmsPages(accessToken: string): Promise<CmsPageSummary[]> {
  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from('cms_pages')
    .select('id,title,slug,status,updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to load CMS pages', { code: error.code });
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    updatedAt: row.updated_at,
  }));
}

export async function createCmsPage(accessToken: string, input: { title: string; slug: string }): Promise<string> {
  const title = input.title.trim();
  const slug = input.slug.trim().toLowerCase();
  if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(slug)) {
    throw new AppError('BAD_REQUEST', 'Invalid page title or slug');
  }
  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from('cms_pages')
    .insert({ title, slug, status: 'draft' })
    .select('id')
    .single();
  if (error) throw new AppError(error.code === '23505' ? 'CONFLICT' : 'INTERNAL_ERROR', 'Unable to create CMS page', { code: error.code });
  return data.id;
}
