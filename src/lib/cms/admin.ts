import { AppError } from '@/lib/errors/app-error';
import { isSectionType, validateSectionData } from '@/lib/cms/sections';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface CmsPageSummary {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  updatedAt: string;
}

export interface CmsAdminSection {
  id: string;
  type: string;
  data: Record<string, unknown>;
  sortOrder: number;
  isVisible: boolean;
}

export interface CmsAdminPage extends CmsPageSummary {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robotsDirectives: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  sections: CmsAdminSection[];
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
const statuses: readonly ContentStatus[] = ['draft', 'scheduled', 'published', 'archived'];
const text = (value: unknown): string => typeof value === 'string' ? value : '';
const nullable = (value: string): string | null => value.trim() || null;

export async function listCmsPages(accessToken: string): Promise<CmsPageSummary[]> {
  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase.from('cms_pages').select('id,title,slug,status,updated_at').is('deleted_at', null).order('updated_at', { ascending: false });
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to load CMS pages', { code: error.code });
  return (data ?? []).map((row) => ({ id: row.id, title: row.title, slug: row.slug, status: row.status, updatedAt: row.updated_at }));
}

export async function getCmsPageForAdmin(accessToken: string, id: string): Promise<CmsAdminPage | null> {
  const supabase = createServerSupabaseClient(accessToken);
  const { data: page, error } = await supabase
    .from('cms_pages')
    .select('id,title,slug,status,updated_at,meta_title,meta_description,canonical_url,robots_directives,og_title,og_description,og_image_url')
    .eq('id', id).is('deleted_at', null).maybeSingle();
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to load CMS page', { code: error.code });
  if (!page) return null;
  const { data: sections, error: sectionsError } = await supabase
    .from('page_sections').select('id,type,data,sort_order,is_visible').eq('page_id', id).order('sort_order');
  if (sectionsError) throw new AppError('INTERNAL_ERROR', 'Unable to load CMS sections', { code: sectionsError.code });
  return {
    id: page.id, title: page.title, slug: page.slug, status: page.status, updatedAt: page.updated_at,
    metaTitle: text(page.meta_title), metaDescription: text(page.meta_description), canonicalUrl: text(page.canonical_url),
    robotsDirectives: text(page.robots_directives), ogTitle: text(page.og_title), ogDescription: text(page.og_description), ogImageUrl: text(page.og_image_url),
    sections: (sections ?? []).map((section) => ({ id: section.id, type: section.type, data: section.data as Record<string, unknown>, sortOrder: section.sort_order, isVisible: section.is_visible })),
  };
}

export async function createCmsPage(accessToken: string, input: { title: string; slug: string }): Promise<string> {
  const title = input.title.trim();
  const slug = input.slug.trim().toLowerCase();
  if (!title || !slugPattern.test(slug)) throw new AppError('BAD_REQUEST', 'Invalid page title or slug');
  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase.from('cms_pages').insert({ title, slug, status: 'draft' }).select('id').single();
  if (error) throw new AppError(error.code === '23505' ? 'CONFLICT' : 'INTERNAL_ERROR', 'Unable to create CMS page', { code: error.code });
  return data.id;
}

export async function updateCmsPage(accessToken: string, id: string, input: Record<string, string>): Promise<void> {
  const title = input.title?.trim() ?? '';
  const slug = input.slug?.trim().toLowerCase() ?? '';
  const status = input.status as ContentStatus;
  if (!title || !slugPattern.test(slug) || !statuses.includes(status)) throw new AppError('BAD_REQUEST', 'Invalid page data');
  const supabase = createServerSupabaseClient(accessToken);
  const { data: existing, error: readError } = await supabase.from('cms_pages')
    .select('id,published_at').eq('id', id).is('deleted_at', null).maybeSingle();
  if (readError) throw new AppError('INTERNAL_ERROR', 'Unable to load CMS page', { code: readError.code });
  if (!existing) throw new AppError('NOT_FOUND', 'CMS page not found');
  const { data: updated, error } = await supabase.from('cms_pages').update({
    title, slug, status,
    published_at: status === 'published' ? existing.published_at ?? new Date().toISOString() : existing.published_at,
    meta_title: nullable(input.metaTitle ?? ''), meta_description: nullable(input.metaDescription ?? ''),
    canonical_url: nullable(input.canonicalUrl ?? ''), robots_directives: nullable(input.robotsDirectives ?? ''),
    og_title: nullable(input.ogTitle ?? ''), og_description: nullable(input.ogDescription ?? ''), og_image_url: nullable(input.ogImageUrl ?? ''),
  }).eq('id', id).is('deleted_at', null).select('id').maybeSingle();
  if (error) throw new AppError(error.code === '23505' ? 'CONFLICT' : 'INTERNAL_ERROR', 'Unable to update CMS page', { code: error.code });
  if (!updated) throw new AppError('NOT_FOUND', 'CMS page not found or not editable');
}

export async function createCmsSection(accessToken: string, pageId: string, typeValue: string, json: string): Promise<void> {
  if (!isSectionType(typeValue)) throw new AppError('BAD_REQUEST', 'Unknown section type');
  let data: unknown;
  try { data = JSON.parse(json); } catch { throw new AppError('BAD_REQUEST', 'Section data must be valid JSON'); }
  if (!validateSectionData(typeValue, data)) throw new AppError('BAD_REQUEST', 'Section data does not match its type');
  const supabase = createServerSupabaseClient(accessToken);
  const { data: last } = await supabase.from('page_sections').select('sort_order').eq('page_id', pageId).order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from('page_sections').insert({ page_id: pageId, type: typeValue, data, sort_order: (last?.sort_order ?? -10) + 10, is_visible: true });
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to create section', { code: error.code });
}

export async function updateCmsSection(accessToken: string, id: string, typeValue: string, json: string): Promise<void> {
  if (!isSectionType(typeValue)) throw new AppError('BAD_REQUEST', 'Unknown section type');
  let data: unknown;
  try { data = JSON.parse(json); } catch { throw new AppError('BAD_REQUEST', 'Section data must be valid JSON'); }
  if (!validateSectionData(typeValue, data)) throw new AppError('BAD_REQUEST', 'Section data does not match its type');
  const { data: updated, error } = await createServerSupabaseClient(accessToken).from('page_sections').update({ type: typeValue, data }).eq('id', id).select('id').maybeSingle();
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to update section', { code: error.code });
  if (!updated) throw new AppError('NOT_FOUND', 'Section not found or not editable');
}

export async function runSectionAction(accessToken: string, id: string, action: string): Promise<void> {
  const supabase = createServerSupabaseClient(accessToken);
  if (action === 'delete') {
    const { data: deleted, error } = await supabase.from('page_sections').delete().eq('id', id).select('id').maybeSingle();
    if (error) throw new AppError('INTERNAL_ERROR', 'Unable to delete section', { code: error.code });
    if (!deleted) throw new AppError('NOT_FOUND', 'Section not found or not editable');
    return;
  }
  if (action === 'toggle') {
    const { data, error: readError } = await supabase.from('page_sections').select('is_visible').eq('id', id).single();
    if (readError) throw new AppError('NOT_FOUND', 'Section not found');
    const { data: updated, error } = await supabase.from('page_sections').update({ is_visible: !data.is_visible }).eq('id', id).select('id').maybeSingle();
    if (error) throw new AppError('INTERNAL_ERROR', 'Unable to toggle section', { code: error.code });
    if (!updated) throw new AppError('NOT_FOUND', 'Section not found or not editable');
    return;
  }
  if (action === 'up' || action === 'down') {
    const { error } = await supabase.rpc('cms_move_section', { p_section_id: id, p_direction: action });
    if (error) throw new AppError('INTERNAL_ERROR', 'Unable to reorder section', { code: error.code });
    return;
  }
  throw new AppError('BAD_REQUEST', 'Unknown section action');
}
