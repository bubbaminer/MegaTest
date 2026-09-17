import { defineMiddleware } from 'astro:middleware';
import { AppError } from '@/lib/errors/app-error';
import { resolveAuthSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { adminApiPermission } from '@/lib/auth/route-permissions';
import { logger } from '@/lib/logging/logger';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  const isAdminApi = path === '/api/admin' || path.startsWith('/api/admin/');
  const isAccount = path === '/account' || path.startsWith('/account/');
  const isAdmin = path === '/admin' || path.startsWith('/admin/') || isAdminApi;
  if (!isAccount && !isAdmin) return next();

  context.response.headers.set('Cache-Control', 'private, no-store');
  try {
    const auth = await resolveAuthSession(context.cookies);
    if (isAdmin && !hasPermission(auth.role, 'admin:access')) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions');
    }
    if (isAdminApi && !hasPermission(auth.role, adminApiPermission(path))) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions');
    }
    context.locals.auth = auth;
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('INTERNAL_ERROR', 'Authorization failed');
    logger.warn('route_access_denied', { path, code: appError.code });
    if (isAdminApi || appError.code === 'INTERNAL_ERROR') {
      return new Response(JSON.stringify({ error: appError.code }), {
        status: appError.status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
      });
    }
    return context.redirect(appError.code === 'UNAUTHENTICATED' ? '/login' : '/', 303);
  }
  return next();
});
