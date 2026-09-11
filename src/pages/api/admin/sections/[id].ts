import type { APIRoute } from 'astro';
import { AppError } from '@/lib/errors/app-error';
import { runSectionAction, updateCmsSection } from '@/lib/cms/admin';

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  if (!locals.auth || !params.id) return redirect('/login', 303);
  const form = await request.formData();
  const pageId = String(form.get('pageId') ?? '');
  const action = String(form.get('action') ?? 'update');
  try {
    if (action === 'update') await updateCmsSection(locals.auth.accessToken, params.id, String(form.get('type') ?? ''), String(form.get('data') ?? ''));
    else await runSectionAction(locals.auth.accessToken, params.id, action);
    return redirect(`/admin/content/pages/${pageId}?sectionSaved=1`, 303);
  } catch (error) {
    const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';
    return redirect(`/admin/content/pages/${pageId}?error=${code.toLowerCase()}`, 303);
  }
};
