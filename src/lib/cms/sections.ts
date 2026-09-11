export const sectionTypes = [
  'hero',
  'rich_text',
  'image_text',
  'featured_products',
  'featured_games',
  'faq',
  'cta',
] as const;

export type SectionType = (typeof sectionTypes)[number];

type Cta = { label: string; url: string };
export type SectionDataMap = {
  hero: { title: string; subtitle?: string; imageUrl?: string; cta?: Cta };
  rich_text: { content: string };
  image_text: { title: string; text: string; imageUrl: string; imageAlt?: string; imagePosition?: 'left' | 'right'; cta?: Cta };
  featured_products: { productIds: string[]; title?: string };
  featured_games: { gameIds: string[]; title?: string };
  faq: { faqIds: string[]; title?: string };
  cta: { title: string; text?: string; action: Cta };
};

export type CmsSection<T extends SectionType = SectionType> = {
  id: string;
  type: T;
  data: SectionDataMap[T];
  sortOrder: number;
  isVisible: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isOptionalText = (value: unknown): value is string | undefined => value === undefined || typeof value === 'string';
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isText);
const isCta = (value: unknown): value is Cta => isRecord(value) && isText(value.label) && isText(value.url);

export function isSectionType(value: unknown): value is SectionType {
  return typeof value === 'string' && (sectionTypes as readonly string[]).includes(value);
}

export function validateSectionData<T extends SectionType>(type: T, value: unknown): value is SectionDataMap[T] {
  if (!isRecord(value)) return false;
  switch (type) {
    case 'hero':
      return isText(value.title) && isOptionalText(value.subtitle) && isOptionalText(value.imageUrl) && (value.cta === undefined || isCta(value.cta));
    case 'rich_text':
      return isText(value.content);
    case 'image_text':
      return isText(value.title) && isText(value.text) && isText(value.imageUrl)
        && isOptionalText(value.imageAlt)
        && (value.imagePosition === undefined || value.imagePosition === 'left' || value.imagePosition === 'right')
        && (value.cta === undefined || isCta(value.cta));
    case 'featured_products':
      return isStringArray(value.productIds) && isOptionalText(value.title);
    case 'featured_games':
      return isStringArray(value.gameIds) && isOptionalText(value.title);
    case 'faq':
      return isStringArray(value.faqIds) && isOptionalText(value.title);
    case 'cta':
      return isText(value.title) && isOptionalText(value.text) && isCta(value.action);
  }
}

export function parseSection<T extends SectionType>(type: T, data: unknown): SectionDataMap[T] {
  if (!validateSectionData(type, data)) throw new Error(`Invalid CMS section payload for type: ${type}`);
  return data;
}
