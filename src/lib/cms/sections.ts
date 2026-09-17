import { isSafeLink } from '@/lib/validation/urls';

export const sectionTypes = ['hero','rich_text','image_text','featured_products','featured_games','faq','cta','trust_signals','expert_profile','process_steps'] as const;
export type SectionType = (typeof sectionTypes)[number];

type Cta = { label: string; url: string };
type InfoItem = { title: string; text: string };
export type SectionDataMap = {
  hero: { title: string; subtitle?: string; imageUrl?: string; cta?: Cta };
  rich_text: { content: string };
  image_text: { title: string; text: string; imageUrl: string; imageAlt?: string; imagePosition?: 'left' | 'right'; cta?: Cta };
  featured_products: { productIds: string[]; title?: string };
  featured_games: { gameIds: string[]; title?: string };
  faq: { faqIds: string[]; title?: string };
  cta: { title: string; text?: string; action: Cta };
  trust_signals: { title: string; items: InfoItem[] };
  expert_profile: { name: string; role: string; bio: string; imageUrl?: string; credentials?: string[] };
  process_steps: { title: string; steps: InfoItem[] };
};
export type CmsSection<T extends SectionType = SectionType> = { id: string; type: T; data: SectionDataMap[T]; sortOrder: number; isVisible: boolean };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isOptionalText = (value: unknown): value is string | undefined => value === undefined || typeof value === 'string';
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isText);
const isCta = (value: unknown): value is Cta => isRecord(value) && isText(value.label) && isSafeLink(value.url);
const isInfoItems = (value: unknown): value is InfoItem[] => Array.isArray(value) && value.length > 0 && value.every((item) => isRecord(item) && isText(item.title) && isText(item.text));
export function isSectionType(value: unknown): value is SectionType { return typeof value === 'string' && (sectionTypes as readonly string[]).includes(value); }
export function validateSectionData<T extends SectionType>(type: T, value: unknown): value is SectionDataMap[T] {
  if (!isRecord(value)) return false;
  switch (type) {
    case 'hero': return isText(value.title) && isOptionalText(value.subtitle) && isOptionalText(value.imageUrl) && (value.cta === undefined || isCta(value.cta));
    case 'rich_text': return isText(value.content);
    case 'image_text': return isText(value.title) && isText(value.text) && isText(value.imageUrl) && isOptionalText(value.imageAlt) && (value.imagePosition === undefined || value.imagePosition === 'left' || value.imagePosition === 'right') && (value.cta === undefined || isCta(value.cta));
    case 'featured_products': return isStringArray(value.productIds) && isOptionalText(value.title);
    case 'featured_games': return isStringArray(value.gameIds) && isOptionalText(value.title);
    case 'faq': return isStringArray(value.faqIds) && isOptionalText(value.title);
    case 'cta': return isText(value.title) && isOptionalText(value.text) && isCta(value.action);
    case 'trust_signals': return isText(value.title) && isInfoItems(value.items);
    case 'expert_profile': return isText(value.name) && isText(value.role) && isText(value.bio) && isOptionalText(value.imageUrl) && (value.credentials === undefined || isStringArray(value.credentials));
    case 'process_steps': return isText(value.title) && isInfoItems(value.steps);
  }
}
export function parseSection<T extends SectionType>(type: T, data: unknown): SectionDataMap[T] { if (!validateSectionData(type, data)) throw new Error(`Invalid CMS section payload for type: ${type}`); return data; }
