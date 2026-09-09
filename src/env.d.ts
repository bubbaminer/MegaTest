/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly APP_ENV?: 'development' | 'test' | 'production';
  readonly LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
}

interface ImportMeta { readonly env: ImportMetaEnv; }
