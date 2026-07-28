import { afterEach, describe, expect, it, vi } from 'vitest';
import { participantCookie, PARTICIPANT_COOKIE_NAME } from './participant-cookie';
import { trustedOrigin } from './origin';
import { checkSessionRateLimit } from './rate-limit';

const originalEnv = { ...process.env };
afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe('trustedOrigin', () => {
  it('uses only the configured origin and accepts a missing Origin for same-site navigations', () => {
    process.env.VIBEVOTE_APP_ORIGIN = 'https://app.example.test';
    const request = new Request('https://attacker.test/api', {
      headers: { host: 'attacker.test', 'x-forwarded-host': 'attacker.test' },
    });
    expect(trustedOrigin(request)).toEqual({ origin: 'https://app.example.test' });
  });

  it.each([
    'http://app.example.test',
    'https://other.example.test',
    'https://app.example.test:444',
  ])('rejects cross-site Origins: %s', (origin) => {
    process.env.VIBEVOTE_APP_ORIGIN = 'https://app.example.test';
    expect(
      trustedOrigin(new Request('https://app.example.test/api', { headers: { origin } })),
    ).toEqual({ error: 'rejected' });
  });

  it('fails closed for malformed or absent non-provider production configuration', () => {
    process.env = { ...process.env, NODE_ENV: 'production' };
    process.env.VIBEVOTE_APP_ORIGIN = 'not a URL';
    expect(trustedOrigin(new Request('https://app.example.test/api'))).toEqual({
      error: 'unavailable',
    });
    delete process.env.VIBEVOTE_APP_ORIGIN;
    expect(trustedOrigin(new Request('https://app.example.test/api'))).toEqual({
      error: 'unavailable',
    });
  });

  it('uses deployment-owned Vercel origins when an explicit origin is absent', () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'production',
      VERCEL: '1',
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'vibevote.vercel.app',
      VERCEL_URL: 'vibevote-deployment.vercel.app',
    };
    delete process.env.VIBEVOTE_APP_ORIGIN;
    expect(
      trustedOrigin(
        new Request('https://internal.invalid/api', {
          headers: { origin: 'https://vibevote.vercel.app' },
        }),
      ),
    ).toEqual({ origin: 'https://vibevote.vercel.app' });
    expect(
      trustedOrigin(
        new Request('https://internal.invalid/api', {
          headers: { origin: 'https://vibevote-deployment.vercel.app' },
        }),
      ),
    ).toEqual({ origin: 'https://vibevote-deployment.vercel.app' });
    expect(
      trustedOrigin(
        new Request('https://internal.invalid/api', {
          headers: { origin: 'https://attacker.vercel.app.evil.test' },
        }),
      ),
    ).toEqual({ error: 'rejected' });
  });

  it('keeps preview and production provider origins isolated', () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'production',
      VERCEL: '1',
      VERCEL_ENV: 'preview',
      VERCEL_PROJECT_PRODUCTION_URL: 'vibevote.vercel.app',
      VERCEL_URL: 'vibevote-preview.vercel.app',
    };
    delete process.env.VIBEVOTE_APP_ORIGIN;
    expect(
      trustedOrigin(
        new Request('https://internal.invalid/api', {
          headers: { origin: 'https://vibevote.vercel.app' },
        }),
      ),
    ).toEqual({ error: 'rejected' });
  });
});

describe('session rate limiting', () => {
  it('is explicitly permissive only outside production', async () => {
    const request = new Request('http://127.0.0.1:3000/api/v1/sessions');
    process.env = { ...process.env, NODE_ENV: 'test' };
    await expect(checkSessionRateLimit(request, 'create')).resolves.toBe('allowed');
    process.env = { ...process.env, NODE_ENV: 'development' };
    await expect(checkSessionRateLimit(request, 'create')).resolves.toBe('allowed');
    process.env = { ...process.env, NODE_ENV: 'production' };
    await expect(checkSessionRateLimit(request, 'create')).resolves.toBe('unavailable');
  });
});

describe('participant cookie', () => {
  it('has the scoped, session-only credential attributes', () => {
    process.env = { ...process.env, NODE_ENV: 'production' };
    const cookie = participantCookie('550e8400-e29b-41d4-a716-446655440000', 'participant-secret');
    expect(cookie.name).toBe(PARTICIPANT_COOKIE_NAME);
    expect(cookie.options).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/api/v1/sessions/550e8400-e29b-41d4-a716-446655440000',
    });
    expect(JSON.stringify(cookie)).not.toContain('console');
  });

  it('is secure in preview and disabled only in development and test', () => {
    for (const environment of ['production'] as const) {
      process.env = { ...process.env, NODE_ENV: environment };
      expect(
        participantCookie('550e8400-e29b-41d4-a716-446655440000', 'token').options.secure,
      ).toBe(true);
    }
    process.env = { ...process.env, NODE_ENV: 'production', VERCEL_ENV: 'preview' };
    expect(participantCookie('550e8400-e29b-41d4-a716-446655440000', 'token').options.secure).toBe(
      true,
    );
    for (const environment of ['development', 'test'] as const) {
      process.env = { ...process.env, NODE_ENV: environment };
      expect(
        participantCookie('550e8400-e29b-41d4-a716-446655440000', 'token').options.secure,
      ).toBe(false);
    }
  });

  it('rejects malformed session identifiers rather than allowing them to alter a cookie path', () => {
    expect(() => participantCookie('not-a-uuid; Path=/', 'token')).toThrow(
      'Session ID must be a UUID.',
    );
    const one = participantCookie('550e8400-e29b-41d4-a716-446655440000', 'one');
    const two = participantCookie('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'two');
    expect(one.options.path).not.toBe(two.options.path);
  });
});
