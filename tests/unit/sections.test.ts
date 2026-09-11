import { describe, expect, it } from 'vitest';
import { parseSection, validateSectionData } from '@/lib/cms/sections';

describe('CMS section registry', () => {
  it('accepts a valid hero', () => {
    const data = { title: 'Store', subtitle: 'Digital goods', cta: { label: 'Browse', url: '/catalog/' } };
    expect(validateSectionData('hero', data)).toBe(true);
    expect(parseSection('hero', data)).toEqual(data);
  });

  it('rejects a hero without a title', () => {
    expect(validateSectionData('hero', { subtitle: 'Missing title' })).toBe(false);
  });

  it('accepts empty curated product lists', () => {
    expect(validateSectionData('featured_products', { productIds: [] })).toBe(true);
  });

  it('rejects unsafe non-object payloads', () => {
    expect(validateSectionData('rich_text', '<script>alert(1)</script>')).toBe(false);
  });
});
