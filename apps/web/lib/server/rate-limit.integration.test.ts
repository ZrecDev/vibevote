import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { postSession } from '@/app/api/v1/sessions/route';
import { checkSessionRateLimit, sessionRateLimitPolicies } from './rate-limit';

const isolatedSupabaseOrigin = 'http://127.0.0.1:55321';

function hasIsolatedVibeVoteSupabase(
  environment: Record<string, string | undefined> = process.env,
) {
  if (!environment.SUPABASE_URL || !environment.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    return new URL(environment.SUPABASE_URL).origin === isolatedSupabaseOrigin;
  } catch {
    return false;
  }
}

const enabled = hasIsolatedVibeVoteSupabase();
const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
});

describe('isolated Supabase integration guard', () => {
  it('runs the live suite only against the approved local VibeVote API origin', () => {
    expect(
      hasIsolatedVibeVoteSupabase({
        SUPABASE_URL: 'http://127.0.0.1:55321/',
        SUPABASE_SERVICE_ROLE_KEY: 'local-service-role-key',
      }),
    ).toBe(true);
    expect(
      hasIsolatedVibeVoteSupabase({
        SUPABASE_URL: 'https://project.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      }),
    ).toBe(false);
    expect(hasIsolatedVibeVoteSupabase({ SUPABASE_URL: isolatedSupabaseOrigin })).toBe(false);
  });
});

describe.skipIf(!enabled)('durable session rate-limit integration', () => {
  it('atomically limits concurrent create attempts through the isolated Supabase stack', async () => {
    const address = `test-${randomUUID()}`;
    const request = new Request('http://127.0.0.1:3000/api/v1/sessions', {
      headers: { 'x-vercel-forwarded-for': address },
    });
    const environment: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: 'production',
      VERCEL: '1',
      VERCEL_ENV: 'preview',
      VIBEVOTE_RATE_LIMIT_TIMEOUT_MS: '1000',
    };
    const results = await Promise.all(
      Array.from({ length: sessionRateLimitPolicies.create.limit + 5 }, () =>
        checkSessionRateLimit(request, 'create', { environment }),
      ),
    );
    expect(results.filter((result) => result === 'allowed')).toHaveLength(
      sessionRateLimitPolicies.create.limit,
    );
    expect(results.filter((result) => result === 'denied')).toHaveLength(5);
  });

  it('returns 429 when the durable limit is exhausted, 503 when unavailable, then recovers', async () => {
    const origin = 'https://app.example.test';
    const address = `route-${randomUUID()}`;
    const environment: NodeJS.ProcessEnv = {
      ...originalEnvironment,
      NODE_ENV: 'production',
      VERCEL: '1',
      VERCEL_ENV: 'preview',
      VIBEVOTE_APP_ORIGIN: origin,
      VIBEVOTE_RATE_LIMIT_TIMEOUT_MS: '1000',
    };
    process.env = environment;
    const request = (clientAddress: string) =>
      new Request(`${origin}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-vercel-forwarded-for': clientAddress,
        },
        body: JSON.stringify({
          title: `Rate limit ${randomUUID()}`,
          category: 'CUSTOM',
          mode: 'BEST_FIT',
          options: [{ label: 'One' }, { label: 'Two' }],
          hostDisplayName: 'Taylor',
        }),
      });

    for (let attempt = 0; attempt < sessionRateLimitPolicies.create.limit; attempt += 1) {
      expect((await postSession(request(address))).status).toBe(200);
    }
    const limited = await postSession(request(address));
    expect(limited.status).toBe(429);
    expect((await limited.json()).error.code).toBe('RATE_LIMITED');

    process.env = { ...environment };
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const unavailable = await postSession(request(`unavailable-${randomUUID()}`));
    expect(unavailable.status).toBe(503);
    expect(await unavailable.text()).not.toContain('SUPABASE');

    process.env = environment;
    expect((await postSession(request(`restored-${randomUUID()}`))).status).toBe(200);
  });
});
