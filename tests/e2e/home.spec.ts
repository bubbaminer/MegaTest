import { expect, test } from '@playwright/test';

test('homepage renders with navigation for the current viewport', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/\S/);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  const mobile = (page.viewportSize()?.width ?? 1280) < 640;
  await expect(page.getByRole('navigation', {
    name: mobile ? 'Мобильная навигация' : 'Основная навигация',
  })).toBeVisible();
});
