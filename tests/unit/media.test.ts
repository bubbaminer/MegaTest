import { describe, expect, it } from 'vitest';
import { validateImageUploadMetadata } from '@/lib/cms/media';

describe('media upload validation', () => {
  it('accepts supported images', () => expect(validateImageUploadMetadata('image/webp', 1024)).toBe('webp'));
  it('rejects SVG uploads', () => expect(() => validateImageUploadMetadata('image/svg+xml', 1024)).toThrow('Unsupported image type'));
  it('rejects files over 10 MB', () => expect(() => validateImageUploadMetadata('image/png', 10 * 1024 * 1024 + 1)).toThrow('10 MB'));
  it('rejects empty files', () => expect(() => validateImageUploadMetadata('image/jpeg', 0)).toThrow('between 1 byte'));
});
