import type { APIRoute } from 'astro';
import { AppError } from '@/lib/errors/app-error';
import { updateCmsPage } from '@/lib/cms/admin';
import { logger } from '@/lib/logging/logger';

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  if (!locals.auth || !params.id) return redirect('/login', 303);
  const form = await request.formData();
  const input = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
  try {
    await updateCmsPage(locals.auth.accessToken, params.id, input);
    return redirect(`/admin/content/pages/${params.id}?saved=1`, 303);
  } catch (error) {
    const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';
    logger.warn('cms_page_update_failed', { code, pageId: params.id, actorId: locals.auth.user.id });
    return redirect(`/admin/content/pages/${params.id}?error=${code.toLowerCase()}`, 303);
  }
};
