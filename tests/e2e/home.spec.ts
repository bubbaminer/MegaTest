import { expect, test } from '@playwright/test';

test('foundation page renders and navigates accessibly', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Digital Store');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toBeVisible();
});
