export interface PublicEnvironment {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

function requireValue(name: string, value: string | undefined): string {
  if (!value?.trim()) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getPublicEnvironment(): PublicEnvironment {
  return {
    supabaseUrl: requireValue('PUBLIC_SUPABASE_URL', import.meta.env.PUBLIC_SUPABASE_URL),
    supabaseAnonKey: requireValue('PUBLIC_SUPABASE_ANON_KEY', import.meta.env.PUBLIC_SUPABASE_ANON_KEY),
  };
}
