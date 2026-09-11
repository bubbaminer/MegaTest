import type { APIRoute } from 'astro';
import { setAuthCookies } from '@/lib/auth/cookies';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password) return redirect('/login?error=missing', 303);

  const { data, error } = await createServerSupabaseClient().auth.signInWithPassword({ email, password });
  if (error || !data.session) return redirect('/login?error=invalid', 303);
  setAuthCookies(cookies, data.session.access_token, data.session.refresh_token, data.session.expires_in);
  return redirect('/admin', 303);
};
