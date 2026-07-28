import { expect, test } from '@playwright/test';
test.use({ viewport: { width: 390, height: 844 } });
test('the mobile landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Decide together.' })).toBeVisible();
  await expect(page.getByRole('link', { name: /create room/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /join room/i })).toBeVisible();
});
