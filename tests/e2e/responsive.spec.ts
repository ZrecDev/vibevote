import { expect, test, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page) {
  const audit = await page.evaluate(() => {
    const offenders = [
      ...document.querySelectorAll<HTMLElement>('a, button, input, select, fieldset, .card'),
    ]
      .map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          name:
            element.getAttribute('aria-label') ??
            element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40) ??
            element.tagName,
          left: Math.round(bounds.left),
          right: Math.round(bounds.right),
        };
      })
      .filter(({ left, right }) => left < -1 || right > window.innerWidth + 1);
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders,
    };
  });
  expect(audit.scrollWidth).toBeLessThanOrEqual(audit.clientWidth + 1);
  expect(audit.offenders).toEqual([]);
}

test.describe('compact mobile layouts', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('keeps the full room setup inside a 320px viewport', async ({ page }) => {
    await page.goto('/create');
    for (let option = 3; option <= 12; option += 1) {
      await page.getByRole('button', { name: 'Add option' }).click();
    }
    await expect(page.getByRole('textbox', { name: 'Option 12' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create room' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('keeps the join form usable at keyboard-like viewport heights', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 420 });
    await page.goto('/join?invite=responsive-check');
    await page.getByLabel('Your name').fill('A participant with a long display name');
    await expect(page.getByRole('button', { name: 'Join room' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('desktop and short-landscape layouts', () => {
  test('keeps the landing hierarchy balanced on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /find the choice everyone/i })).toBeVisible();
    await expect(page.getByLabel('Example decision room')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('keeps setup controls in bounds in short landscape', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto('/create');
    await expect(page.getByLabel('What are you deciding?')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
