import type { APIRoute } from 'astro';
import { AppError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logging/logger';
import { uploadMediaAsset } from '@/lib/cms/media';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!locals.auth) return redirect('/login', 303);
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return redirect('/admin/media?error=bad_request', 303);
  try {
    await uploadMediaAsset(locals.auth.accessToken, locals.auth.user.id, file, String(form.get('alt') ?? ''));
    return redirect('/admin/media?uploaded=1', 303);
  } catch (error) {
    const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';
    logger.warn('media_upload_failed', { code, actorId: locals.auth.user.id, mimeType: file.type, size: file.size });
    return redirect(`/admin/media?error=${code.toLowerCase()}`, 303);
  }
};
