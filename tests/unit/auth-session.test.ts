import type { AstroCookies } from 'astro';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/lib/errors/app-error';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(), refreshSession: vi.fn(), setAuthCookies: vi.fn(), clearAuthCookies: vi.fn(),
}));
vi.mock('@/lib/auth/authorize', () => ({ authenticate: mocks.authenticate }));
vi.mock('@/lib/auth/cookies', () => ({
  setAuthCookies: mocks.setAuthCookies, clearAuthCookies: mocks.clearAuthCookies,
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: () => ({ auth: { refreshSession: mocks.refreshSession } }),
}));
import { resolveAuthSession } from '@/lib/auth/session';

function cookies(values: Record<string, string> = {}): AstroCookies {
  return { get: (key: string) => values[key] ? { value: values[key] } : undefined } as unknown as AstroCookies;
}
const auth = { user: { id: 'user' }, role: 'admin', accessToken: 'new' };
beforeEach(() => vi.resetAllMocks());

describe('server session lifecycle', () => {
  it('keeps a valid session without refreshing', async () => {
    mocks.authenticate.mockResolvedValue(auth);
    expect(await resolveAuthSession(cookies({ 'sb-access-token': 'valid' }))).toEqual(auth);
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });
  it('refreshes when the access cookie has expired', async () => {
    const jar = cookies({ 'sb-refresh-token': 'refresh' });
    mocks.refreshSession.mockResolvedValue({ data: { session: {
      access_token: 'new', refresh_token: 'rotated', expires_in: 3600,
    } }, error: null });
    mocks.authenticate.mockResolvedValue(auth);
    expect(await resolveAuthSession(jar)).toEqual(auth);
    expect(mocks.refreshSession).toHaveBeenCalledWith({ refresh_token: 'refresh' });
    expect(mocks.setAuthCookies).toHaveBeenCalledWith(jar, 'new', 'rotated', 3600);
    expect(mocks.authenticate).toHaveBeenCalledWith('new');
  });
  it('refreshes a rejected access token then rechecks identity', async () => {
    mocks.authenticate.mockRejectedValueOnce(new AppError('UNAUTHENTICATED', 'Expired')).mockResolvedValueOnce(auth);
    mocks.refreshSession.mockResolvedValue({ data: { session: {
      access_token: 'new', refresh_token: 'rotated', expires_in: 3600,
    } }, error: null });
    await expect(resolveAuthSession(cookies({ 'sb-access-token': 'expired', 'sb-refresh-token': 'refresh' }))).resolves.toEqual(auth);
    expect(mocks.authenticate).toHaveBeenCalledTimes(2);
  });
  it('does not refresh around a forbidden role', async () => {
    mocks.authenticate.mockRejectedValue(new AppError('FORBIDDEN', 'Role unavailable'));
    await expect(resolveAuthSession(cookies({ 'sb-access-token': 'valid', 'sb-refresh-token': 'refresh' }))).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });
  it('removes cookies for a revoked refresh token', async () => {
    const jar = cookies({ 'sb-refresh-token': 'revoked' });
    mocks.refreshSession.mockResolvedValue({ data: { session: null }, error: { status: 400 } });
    await expect(resolveAuthSession(jar)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(mocks.clearAuthCookies).toHaveBeenCalledWith(jar);
  });
  it('preserves cookies during an authentication service outage', async () => {
    mocks.refreshSession.mockResolvedValue({ data: { session: null }, error: { status: 503 } });
    await expect(resolveAuthSession(cookies({ 'sb-refresh-token': 'refresh' }))).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
    expect(mocks.clearAuthCookies).not.toHaveBeenCalled();
  });
  it('rejects unauthenticated requests without contacting refresh', async () => {
    await expect(resolveAuthSession(cookies())).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });
});
