import { describe, expect, it } from 'vitest';
import { adminApiPermission } from '@/lib/auth/route-permissions';
import { hasPermission } from '@/lib/auth/roles';

describe('administrative API permissions', () => {
  it('lets an editor change CMS but not the catalog', () => {
    expect(hasPermission('editor', adminApiPermission('/api/admin/pages/123'))).toBe(true);
    expect(hasPermission('editor', adminApiPermission('/api/admin/catalog/products/123'))).toBe(false);
  });
  it('lets a manager change catalog but not media metadata', () => {
    expect(hasPermission('manager', adminApiPermission('/api/admin/catalog/games/123'))).toBe(true);
    expect(hasPermission('manager', adminApiPermission('/api/admin/media/123'))).toBe(false);
  });
  it('does not treat a similar prefix as CMS authorization', () => {
    expect(adminApiPermission('/api/admin/pages-export')).toBe('settings:write');
  });
  it('rejects customers and support on content writes', () => {
    expect(hasPermission('customer', adminApiPermission('/api/admin/sections/123'))).toBe(false);
    expect(hasPermission('support', adminApiPermission('/api/admin/sections/123'))).toBe(false);
  });
});
