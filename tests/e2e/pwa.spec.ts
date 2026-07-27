import { expect, test } from '@playwright/test';

test('publishes install metadata and registers an app-shell-only service worker', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest).toMatchObject({ name: 'VibeVote', display: 'standalone' });
  const worker = await (await page.request.get('/sw.js')).text();
  expect(worker).toContain("pathname.startsWith('/api/')");
  expect(worker).not.toMatch(/participantAccessToken|localStorage|sessionStorage/);
});
