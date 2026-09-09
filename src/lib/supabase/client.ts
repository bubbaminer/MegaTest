import { createClient } from '@supabase/supabase-js';
import { getPublicEnvironment } from '@/lib/config/env';

export function createBrowserSupabaseClient() {
  const env = getPublicEnvironment();
  return createClient(env.supabaseUrl, env.supabaseAnonKey);
}
