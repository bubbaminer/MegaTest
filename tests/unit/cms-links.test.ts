import { describe, expect, it } from 'vitest';
import { isSafeLink } from '@/lib/validation/urls';
import { validateSectionData } from '@/lib/cms/sections';

describe('CMS links', () => {
  it.each(['/catalog/', '#products', '?page=2', 'support', 'https://example.com/path', 'mailto:help@example.com', 'tel:+12345'])('accepts a supported link: %s', (url) => {
    expect(isSafeLink(url)).toBe(true);
  });
  it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,test', 'vbscript:test', '//example.com', '/\\example.com', 'java\nscript:test', '', 'https://user:pass@example.com'])('rejects an unsafe link: %s', (url) => {
    expect(isSafeLink(url)).toBe(false);
  });
  it('rejects unsafe CTA data at the section boundary', () => {
    expect(validateSectionData('hero', { title: 'Test', cta: { label: 'Go', url: 'javascript:alert(1)' } })).toBe(false);
    expect(validateSectionData('cta', { title: 'Test', action: { label: 'Go', url: '/catalog/' } })).toBe(true);
  });
});
