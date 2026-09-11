import type { APIRoute } from 'astro';
import { AppError } from '@/lib/errors/app-error';
import { createGame } from '@/lib/catalog/admin';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!locals.auth) return redirect('/login', 303);
  const form = await request.formData();
  const input = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
  try { const id = await createGame(locals.auth.accessToken, input); return redirect(`/admin/catalog/games/${id}?created=1`, 303); }
  catch (error) { const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR'; return redirect(`/admin/catalog/games?error=${code.toLowerCase()}`, 303); }
};
