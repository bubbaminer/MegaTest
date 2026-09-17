/**
 * CMS links may be relative, HTTP(S), mailto or tel.
 * Reject control characters and backslashes before URL normalization.
 */
export function isSafeLink(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  const url = value.trim();
  if (/[\u0000-\u0020\u007f\\]/.test(url) || url.startsWith('//')) return false;
  try {
    const parsed = new URL(url, 'https://cms.invalid');
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(parsed.protocol)
      && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}
