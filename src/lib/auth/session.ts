import type { AstroCookies } from 'astro';
import { authenticate, type AuthContext } from '@/lib/auth/authorize';
import { clearAuthCookies, setAuthCookies } from '@/lib/auth/cookies';
import { AppError } from '@/lib/errors/app-error';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function resolveAuthSession(cookies: AstroCookies): Promise<AuthContext> {
  const accessToken = cookies.get('sb-access-token')?.value;
  if (accessToken) {
    try {
      return await authenticate(accessToken);
    } catch (error) {
      if (!(error instanceof AppError) || error.code !== 'UNAUTHENTICATED') throw error;
    }
  }

  const refreshToken = cookies.get('sb-refresh-token')?.value;
  if (!refreshToken) {
    clearAuthCookies(cookies);
    throw new AppError('UNAUTHENTICATED', 'Authentication required');
  }

  const { data, error } = await createServerSupabaseClient().auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error || !data.session) {
    if (error && (!error.status || error.status >= 500 || error.status === 429)) {
      throw new AppError('INTERNAL_ERROR', 'Session service temporarily unavailable');
    }
    clearAuthCookies(cookies);
    throw new AppError('UNAUTHENTICATED', 'Session expired');
  }

  const session = data.session;
  // Save rotated tokens before the role lookup, so a temporary profile error
  // cannot leave the browser with a refresh token that was already rotated.
  setAuthCookies(cookies, session.access_token, session.refresh_token, session.expires_in);
  return authenticate(session.access_token);
}
