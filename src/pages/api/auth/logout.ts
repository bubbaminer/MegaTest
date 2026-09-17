import type { APIRoute } from 'astro';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging/logger';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  try {
    if (refreshToken) {
      const client = createServerSupabaseClient();
      const { error } = accessToken
        ? await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        : await client.auth.refreshSession({ refresh_token: refreshToken });
      if (!error) {
        const { error: signOutError } = await client.auth.signOut({ scope: 'local' });
        if (signOutError) logger.warn('session_revocation_failed');
      } else {
        logger.warn('session_revocation_failed');
      }
    }
  } catch {
    logger.warn('session_revocation_failed');
  } finally {
    clearAuthCookies(cookies);
  }
  return redirect('/', 303);
};
