import type { SectionType } from '@/lib/cms/sections';

export const sectionLabels: Record<SectionType, string> = {
  hero: 'Главный баннер',
  rich_text: 'Текст',
  image_text: 'Изображение и текст',
  featured_products: 'Подборка товаров',
  featured_games: 'Подборка игр',
  faq: 'Вопросы и ответы',
  cta: 'Призыв к действию',
  trust_signals: 'Преимущества',
  expert_profile: 'Эксперт',
  process_steps: 'Этапы заказа',
};

export function sectionLabel(type: string): string {
  return Object.prototype.hasOwnProperty.call(sectionLabels, type)
    ? sectionLabels[type as SectionType]
    : type;
}

export const sectionTemplates: Record<SectionType, string> = Object.fromEntries(
  Object.entries({
    hero: { title: 'Заголовок', subtitle: 'Подзаголовок', cta: { label: 'Открыть каталог', url: '/catalog/' } },
    rich_text: { content: 'Текст блока' },
    image_text: { title: 'Заголовок', text: 'Текст', imageUrl: 'https://example.com/image.webp', imageAlt: 'Описание изображения' },
    featured_products: { productIds: [], title: 'Товары' },
    featured_games: { gameIds: [], title: 'Игры' },
    faq: { faqIds: [], title: 'Вопросы и ответы' },
    cta: { title: 'Нужна помощь?', text: 'Свяжитесь с нами', action: { label: 'Поддержка', url: '/support' } },
    trust_signals: { title: 'Преимущества', items: [{ title: 'Заголовок', text: 'Описание' }] },
    expert_profile: { name: 'Имя', role: 'Специалист', bio: 'Описание', credentials: [] },
    process_steps: { title: 'Этапы заказа', steps: [{ title: 'Выбор товара', text: 'Описание шага' }] },
  }).map(([type, data]) => [type, JSON.stringify(data, null, 2)]),
) as Record<SectionType, string>;
