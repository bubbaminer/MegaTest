import { AppError } from '@/lib/errors/app-error';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { faqAnswerText } from '@/lib/cms/faq-text';

export interface PublicFaq { id: string; question: string; answer: string }

export async function listPublicFaq(ids: string[] = []): Promise<PublicFaq[]> {
  let query = createServerSupabaseClient().from('faq_entries')
    .select('id,question,answer').eq('status', 'published').is('deleted_at', null)
    .order('sort_order').order('id').limit(24);
  if (ids.length) query = query.in('id', ids.slice(0, 24));
  const { data, error } = await query;
  if (error) throw new AppError('INTERNAL_ERROR', 'Unable to load FAQ', { code: error.code });
  const entries = (data ?? []).map((row) => ({
    id: String(row.id), question: String(row.question), answer: faqAnswerText(row.answer),
  })).filter((entry) => entry.answer.trim());
  return ids.length ? entries.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)) : entries;
}
