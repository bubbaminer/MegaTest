import type { APIRoute } from 'astro';
import { AppError } from '@/lib/errors/app-error';
import { createCmsPage } from '@/lib/cms/admin';
import { logger } from '@/lib/logging/logger';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!locals.auth) return redirect('/login', 303);
  const form = await request.formData();
  try {
    await createCmsPage(locals.auth.accessToken, {
      title: String(form.get('title') ?? ''),
      slug: String(form.get('slug') ?? ''),
    });
    return redirect('/admin/content/pages?created=1', 303);
  } catch (error) {
    const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';
    logger.warn('cms_page_create_failed', { code, actorId: locals.auth.user.id });
    return redirect(`/admin/content/pages?error=${code.toLowerCase()}`, 303);
  }
};
