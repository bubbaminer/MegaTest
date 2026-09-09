import { describe, expect, it } from 'vitest';
import { hasPermission, isAppRole } from '@/lib/auth/roles';

describe('role authorization', () => {
  it('keeps customers outside admin', () => expect(hasPermission('customer', 'admin:access')).toBe(false));
  it('allows admins to manage settings', () => expect(hasPermission('admin', 'settings:write')).toBe(true));
  it('limits editors to content administration', () => {
    expect(hasPermission('editor', 'content:write')).toBe(true);
    expect(hasPermission('editor', 'orders:write')).toBe(false);
  });
  it('rejects unknown roles', () => expect(isAppRole('owner')).toBe(false));
});
