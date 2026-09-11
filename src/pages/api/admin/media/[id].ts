import type { APIRoute } from 'astro';
import { AppError } from '@/lib/errors/app-error';
import { archiveMediaAsset, updateMediaAlt } from '@/lib/cms/media';

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  if (!locals.auth || !params.id) return redirect('/login', 303);
  const form = await request.formData();
  const action = String(form.get('action') ?? 'update');
  try {
    if (action === 'archive') await archiveMediaAsset(locals.auth.accessToken, params.id);
    else await updateMediaAlt(locals.auth.accessToken, params.id, String(form.get('alt') ?? ''));
    return redirect(`/admin/media?${action === 'archive' ? 'archived' : 'saved'}=1`, 303);
  } catch (error) {
    const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';
    return redirect(`/admin/media?error=${code.toLowerCase()}`, 303);
  }
};
