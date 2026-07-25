import { expect, test } from '@playwright/test';

const skipLiveSessionE2E =
  Boolean(process.env.CI) && process.env.VIBEVOTE_RUN_LIVE_SESSION_E2E !== '1';

test.skip(skipLiveSessionE2E, 'Requires the isolated local VibeVote Supabase stack.');

test('host and guest bootstrap independently through browser-managed cookies', async ({
  browser,
}) => {
  const hostContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();
  const apiRequests: string[] = [];
  for (const page of [host, guest]) {
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/api/v1/sessions')) {
        expect(request.headers().authorization).toBeUndefined();
        apiRequests.push(request.url());
      }
    });
  }

  await host.goto('/create');
  await host.getByLabel('Your name').fill('Host Alex');
  await host.getByLabel('What are you deciding?').fill('Friday dinner');
  await host.getByLabel('Option 1').fill('North Star Cafe');
  await host.getByLabel('Option 2').fill('Green Bowl');
  const createResponse = host.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/sessions') && response.request().method() === 'POST',
  );
  await host.getByRole('button', { name: 'Create room' }).click();
  const createPayload = await (await createResponse).json();
  expect(createPayload).toMatchObject({ ok: true });
  expect(createPayload).not.toHaveProperty('participantAccessToken');
  const inviteUrl = createPayload.data.invitation.inviteUrl as string;
  const hostSessionId = createPayload.data.session.session.id as string;
  await expect(host).toHaveURL(new RegExp(`/room/${hostSessionId}$`));
  await expect(host.getByRole('button', { name: /start voting/i })).toBeVisible();

  await guest.goto(inviteUrl);
  await guest.getByLabel('Your name').fill('Guest Sam');
  const joinResponse = guest.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/sessions/join') && response.request().method() === 'POST',
  );
  await guest.getByRole('button', { name: 'Join room' }).click();
  const joinPayload = await (await joinResponse).json();
  expect(joinPayload).toMatchObject({ ok: true });
  expect(joinPayload).not.toHaveProperty('participantAccessToken');
  const guestSessionId = joinPayload.data.session.session.id as string;
  await expect(guest).toHaveURL(new RegExp(`/room/${guestSessionId}$`));
  await expect(guest.getByRole('heading', { name: 'Friday dinner' })).toBeVisible();
  await expect(guest.getByRole('button', { name: /start voting/i })).toHaveCount(0);

  await host.reload();
  await guest.reload();
  await expect(host.getByRole('button', { name: /start voting/i })).toBeVisible();
  await expect(guest.getByRole('button', { name: /start voting/i })).toHaveCount(0);
  for (const page of [host, guest]) {
    const storage = await page.evaluate(() => [
      ...Object.entries(localStorage),
      ...Object.entries(sessionStorage),
    ]);
    expect(storage.flat().join(' ')).not.toContain('vibevote_participant_v1');
    expect(storage.flat().join(' ')).not.toContain(inviteUrl);
    expect(await page.locator('body').textContent()).not.toContain('vibevote_participant_v1');
    expect(new URL(page.url()).search).toBe('');
    expect(new URL(page.url()).hash).toBe('');
  }
  expect(apiRequests).toHaveLength(6);
  await hostContext.close();
  await guestContext.close();
});
