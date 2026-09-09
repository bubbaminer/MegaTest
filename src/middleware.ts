import { defineMiddleware } from 'astro:middleware';
import { AppError } from '@/lib/errors/app-error';
import { authenticate, authorize } from '@/lib/auth/authorize';
import { logger } from '@/lib/logging/logger';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  const isAccount = path === '/account' || path.startsWith('/account/');
  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  if (!isAccount && !isAdmin) return next();

  const token = context.cookies.get('sb-access-token')?.value;
  try {
    context.locals.auth = isAdmin ? await authorize(token, 'admin:access') : await authenticate(token);
    return next();
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('INTERNAL_ERROR', 'Authorization failed');
    logger.warn('route_access_denied', { path, code: appError.code });
    return context.redirect(appError.code === 'UNAUTHENTICATED' ? '/login' : '/', 303);
  }
});
