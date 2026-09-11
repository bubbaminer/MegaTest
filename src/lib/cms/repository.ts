import { AppError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logging/logger';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSectionType, parseSection, type CmsSection, type SectionType } from '@/lib/cms/sections';

export interface PublishedPage {
  id: string;
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  robotsDirectives?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  structuredData: Record<string, unknown>;
  sections: CmsSection<SectionType>[];
}

type Row = Record<string, unknown>;

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function mapSectionRow(row: Row): CmsSection<SectionType> | null {
  if (!isSectionType(row.type)) return null;
  try {
    return {
      id: String(row.id),
      type: row.type,
      data: parseSection(row.type, row.data),
      sortOrder: Number(row.sort_order),
      isVisible: row.is_visible === true,
    };
  } catch {
    logger.warn('cms_section_payload_rejected', { sectionId: String(row.id), type: row.type });
    return null;
  }
}

export async function getPublishedPage(slug: string): Promise<PublishedPage | null> {
  const supabase = createServerSupabaseClient();
  const { data: page, error: pageError } = await supabase
    .from('cms_pages')
    .select('id,title,slug,meta_title,meta_description,canonical_url,robots_directives,og_title,og_description,og_image_url,structured_data')
    .eq('slug', slug)
    .maybeSingle();

  if (pageError) {
    logger.error('cms_page_query_failed', { slug, code: pageError.code });
    throw new AppError('INTERNAL_ERROR', 'Unable to load CMS page');
  }
  if (!page) return null;

  const { data: rows, error: sectionsError } = await supabase
    .from('page_sections')
    .select('id,type,data,sort_order,is_visible')
    .eq('page_id', page.id)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (sectionsError) {
    logger.error('cms_sections_query_failed', { pageId: page.id, code: sectionsError.code });
    throw new AppError('INTERNAL_ERROR', 'Unable to load CMS sections');
  }

  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    metaTitle: optionalString(page.meta_title),
    metaDescription: optionalString(page.meta_description),
    canonicalUrl: optionalString(page.canonical_url),
    robotsDirectives: optionalString(page.robots_directives),
    ogTitle: optionalString(page.og_title),
    ogDescription: optionalString(page.og_description),
    ogImageUrl: optionalString(page.og_image_url),
    structuredData: typeof page.structured_data === 'object' && page.structured_data !== null ? page.structured_data as Record<string, unknown> : {},
    sections: (rows ?? []).map((row) => mapSectionRow(row)).filter((section): section is CmsSection<SectionType> => section !== null),
  };
}
