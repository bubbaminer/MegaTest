// Extract text from simple content objects and nested editor nodes.
// HTML is never interpreted; Astro escapes the resulting string.
export function faqAnswerText(value: unknown, depth = 0): string {
  if (depth > 12) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map((item) => faqAnswerText(item, depth + 1)).filter(Boolean).join('\n');
  if (!value || typeof value !== 'object') return '';
  const node = value as Record<string, unknown>;
  if (typeof node.text === 'string') return node.text;
  if (node.content !== undefined) return faqAnswerText(node.content, depth + 1);
  return '';
}
