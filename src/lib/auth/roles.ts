export const appRoles = ['customer', 'admin', 'manager', 'editor', 'support', 'analyst'] as const;
export type AppRole = (typeof appRoles)[number];

export const permissions = [
  'admin:access', 'catalog:write', 'content:write', 'orders:read', 'orders:write',
  'customers:read', 'payments:read', 'deliveries:write', 'analytics:read', 'settings:write',
] as const;
export type Permission = (typeof permissions)[number];

const byRole: Record<AppRole, readonly Permission[]> = {
  customer: [],
  admin: permissions,
  manager: ['admin:access', 'catalog:write', 'orders:read', 'orders:write', 'customers:read', 'payments:read', 'deliveries:write', 'analytics:read'],
  editor: ['admin:access', 'content:write'],
  support: ['admin:access', 'orders:read', 'customers:read', 'payments:read'],
  analyst: ['admin:access', 'analytics:read'],
};

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return byRole[role].includes(permission);
}

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && (appRoles as readonly string[]).includes(value);
}
