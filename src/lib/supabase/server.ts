import { createClient } from '@supabase/supabase-js';
import { getPublicEnvironment } from '@/lib/config/env';

export function createServerSupabaseClient(accessToken?: string) {
  const env = getPublicEnvironment();
  const options = {
    auth: { autoRefreshToken: false, persistSession: false },
    ...(accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}),
  };
  return createClient(env.supabaseUrl, env.supabaseAnonKey, options);
}
