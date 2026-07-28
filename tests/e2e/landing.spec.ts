import { expect, test } from '@playwright/test';
test.use({ viewport: { width: 390, height: 844 } });
test('the mobile landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Find the choice everyone can feel good about.' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /start a decision/i })).toBeVisible();
});
