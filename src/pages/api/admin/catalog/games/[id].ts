import type { APIRoute } from 'astro';
import { AppError } from '@/lib/errors/app-error';
import { archiveGame, updateGame } from '@/lib/catalog/admin';

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  if (!locals.auth || !params.id) return redirect('/login', 303);
  const form = await request.formData();
  const input = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
  try {
    if (input.action === 'archive') await archiveGame(locals.auth.accessToken, params.id); else await updateGame(locals.auth.accessToken, params.id, input);
    return redirect(`/admin/catalog/games/${params.id}?saved=1`, 303);
  } catch (error) { const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR'; return redirect(`/admin/catalog/games/${params.id}?error=${code.toLowerCase()}`, 303); }
};
