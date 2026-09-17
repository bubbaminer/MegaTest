import type { Permission } from '@/lib/auth/roles';

export function adminApiPermission(path: string): Permission {
  if (path.startsWith('/api/admin/catalog/')) return 'catalog:write';
  if (['pages', 'sections', 'media'].some((name) =>
    path === '/api/admin/' + name || path.startsWith('/api/admin/' + name + '/')
  )) return 'content:write';
  // New administrative APIs must explicitly declare their permission here.
  return 'settings:write';
}
