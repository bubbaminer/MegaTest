import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: () => ({ from: mocks.from }) }));
import { updateCmsPage, updateCmsSection } from '@/lib/cms/admin';

function query(result: unknown) {
  const chain = {
    select: vi.fn(), eq: vi.fn(), is: vi.fn(), update: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  return chain;
}
beforeEach(() => vi.resetAllMocks());

describe('CMS save results', () => {
  it('preserves the original publication timestamp', async () => {
    const date = '2026-09-11T00:00:00Z';
    const read = query({ data: { id: 'page', published_at: date }, error: null });
    const write = query({ data: { id: 'page' }, error: null });
    mocks.from.mockReturnValueOnce(read).mockReturnValueOnce(write);
    await updateCmsPage('token', 'page', { title: 'Title', slug: 'home', status: 'published' });
    expect(write.update).toHaveBeenCalledWith(expect.objectContaining({ published_at: date }));
  });
  it('reports a missing page instead of saved', async () => {
    mocks.from.mockReturnValue(query({ data: null, error: null }));
    await expect(updateCmsPage('token', 'missing', { title: 'Title', slug: 'home', status: 'published' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
  it('reports an RLS-filtered update instead of saved', async () => {
    mocks.from
      .mockReturnValueOnce(query({ data: { id: 'page', published_at: null }, error: null }))
      .mockReturnValueOnce(query({ data: null, error: null }));
    await expect(updateCmsPage('token', 'page', { title: 'Title', slug: 'home', status: 'draft' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
  it('reports a missing section instead of saved', async () => {
    mocks.from.mockReturnValue(query({ data: null, error: null }));
    await expect(updateCmsSection('token', 'missing', 'rich_text', '{"content":"Text"}')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
