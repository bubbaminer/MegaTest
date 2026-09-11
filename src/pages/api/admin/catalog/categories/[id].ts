import type { APIRoute } from 'astro';
import { AppError } from '@/lib/errors/app-error';
import { archiveCategory, updateCategory } from '@/lib/catalog/admin';

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  if (!locals.auth || !params.id) return redirect('/login', 303);
  const form = await request.formData();
  const input = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
  try {
    if (input.action === 'archive') await archiveCategory(locals.auth.accessToken, params.id); else await updateCategory(locals.auth.accessToken, params.id, input);
    return redirect(`/admin/catalog/categories/${params.id}?saved=1`, 303);
  } catch (error) { const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR'; return redirect(`/admin/catalog/categories/${params.id}?error=${code.toLowerCase()}`, 303); }
};
