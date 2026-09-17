import { describe, expect, it } from 'vitest';
import { sectionTypes, validateSectionData } from '@/lib/cms/sections';
import { sectionLabels, sectionTemplates } from '@/lib/cms/section-editor';
import { faqAnswerText } from '@/lib/cms/faq-text';

describe('CMS editor contracts', () => {
  it.each(sectionTypes)('supplies a valid initial payload and Russian label for %s', (type) => {
    expect(validateSectionData(type, JSON.parse(sectionTemplates[type]))).toBe(true);
    expect(sectionLabels[type]).toMatch(/[А-Яа-я]/);
  });
  it('extracts a simple FAQ answer', () => {
    expect(faqAnswerText({ content: 'Answer' })).toBe('Answer');
  });
  it('supports nested editor nodes', () => {
    expect(faqAnswerText({ content: [{ content: [{ text: 'First' }] }, { text: 'Second' }] })).toBe('First\nSecond');
  });
  it('does not stringify unsupported FAQ objects', () => {
    expect(faqAnswerText({ unexpected: 123 })).toBe('');
  });
  it('leaves HTML as text for the Astro renderer to escape', () => {
    expect(faqAnswerText({ content: '<b>Answer</b>' })).toBe('<b>Answer</b>');
  });
});
