import type { User } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors/app-error';
import { hasPermission, isAppRole, type AppRole, type Permission } from '@/lib/auth/roles';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface AuthContext { user: User; role: AppRole; accessToken: string }

export async function authenticate(accessToken: string | undefined): Promise<AuthContext> {
  if (!accessToken) throw new AppError('UNAUTHENTICATED', 'Authentication required');
  const supabase = createServerSupabaseClient(accessToken);
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) throw new AppError('UNAUTHENTICATED', 'Invalid session');

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('role').eq('id', userData.user.id).single();
  if (profileError || !isAppRole(profile?.role)) throw new AppError('FORBIDDEN', 'Profile role unavailable');
  return { user: userData.user, role: profile.role, accessToken };
}

export async function authorize(accessToken: string | undefined, permission: Permission): Promise<AuthContext> {
  const auth = await authenticate(accessToken);
  if (!hasPermission(auth.role, permission)) throw new AppError('FORBIDDEN', 'Insufficient permissions');
  return auth;
}
