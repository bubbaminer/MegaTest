import type { AstroCookies } from 'astro';

const secure = import.meta.env.PROD;

export function setAuthCookies(cookies: AstroCookies, accessToken: string, refreshToken: string, expiresIn: number): void {
  const common = { httpOnly: true, sameSite: 'lax' as const, secure, path: '/' };
  cookies.set('sb-access-token', accessToken, { ...common, maxAge: expiresIn });
  cookies.set('sb-refresh-token', refreshToken, { ...common, maxAge: 60 * 60 * 24 * 30 });
}

export function clearAuthCookies(cookies: AstroCookies): void {
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });
}
