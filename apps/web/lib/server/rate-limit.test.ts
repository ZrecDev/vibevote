import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkSessionRateLimit, sessionRateLimitPolicies } from './rate-limit';

const originalEnv = { ...process.env };
const request = (address = '203.0.113.10') =>
  new Request('https://app.example.test/api/v1/sessions', {
    headers: { 'x-forwarded-for': address },
  });
const deployedEnvironment = {
  NODE_ENV: 'production',
  VERCEL: '1',
  VERCEL_ENV: 'preview',
  VERCEL_PROJECT_ID: 'prj_VibeVoteReview',
  VIBEVOTE_RATE_LIMIT_KEY_SECRET: 'rate-limit-key-secret-for-tests-only',
  SUPABASE_URL: 'https://project.example.test',
  SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
};
const rpcResult = (allowed: boolean) => ({
  data: [{ allowed, remaining: allowed ? 4 : 0, reset_at: '2026-07-25T00:01:00.000Z' }],
  error: null,
});

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe('durable session rate limiting', () => {
  it('keeps development and test provider-free', async () => {
    const rpc = vi.fn();
    await expect(
      checkSessionRateLimit(request(), 'create', {
        client: { rpc } as never,
        environment: { NODE_ENV: 'development' },
      }),
    ).resolves.toBe('allowed');
    await expect(
      checkSessionRateLimit(request(), 'create', {
        client: { rpc } as never,
        environment: { NODE_ENV: 'test' },
      }),
    ).resolves.toBe('allowed');
    expect(rpc).not.toHaveBeenCalled();
  });

  it('fails closed for missing or malformed deployed configuration', async () => {
    await expect(
      checkSessionRateLimit(request(), 'create', { environment: { NODE_ENV: 'production' } }),
    ).resolves.toBe('unavailable');
    await expect(
      checkSessionRateLimit(request(), 'create', {
        environment: { ...deployedEnvironment, VIBEVOTE_RATE_LIMIT_TIMEOUT_MS: 'nope' },
      }),
    ).resolves.toBe('unavailable');
    await expect(
      checkSessionRateLimit(request(), 'create', {
        environment: { ...deployedEnvironment, VERCEL_ENV: undefined },
      }),
    ).resolves.toBe('unavailable');
    await expect(
      checkSessionRateLimit(request(), 'create', {
        environment: { ...deployedEnvironment, VERCEL_PROJECT_ID: undefined },
      }),
    ).resolves.toBe('unavailable');
    await expect(
      checkSessionRateLimit(request(), 'create', {
        environment: { ...deployedEnvironment, VIBEVOTE_RATE_LIMIT_KEY_SECRET: 'short' },
      }),
    ).resolves.toBe('unavailable');
    const diagnostics = vi.mocked(console.error).mock.calls.flat().join(' ');
    expect(diagnostics).toContain('[vibevote:rate-limit] unavailable:');
    expect(diagnostics).not.toMatch(/server-secret|203\.0\.113\.10|rate-limit-key-secret/);
  });

  it('derives a domain-separated limiter key from the server database credential', async () => {
    const rpc = vi.fn().mockResolvedValue(rpcResult(true));
    const environment = { ...deployedEnvironment };
    delete (environment as Partial<typeof deployedEnvironment>).VIBEVOTE_RATE_LIMIT_KEY_SECRET;
    await expect(
      checkSessionRateLimit(request(), 'create', {
        client: { rpc } as never,
        environment,
      }),
    ).resolves.toBe('allowed');
    expect(rpc).toHaveBeenCalledWith(
      'check_session_rate_limit_v1',
      expect.objectContaining({ p_key_hash: expect.stringMatching(/^[a-f0-9]{64}$/) }),
    );
    expect(JSON.stringify(rpc.mock.calls)).not.toContain(environment.SUPABASE_SERVICE_ROLE_KEY);
  });

  it('uses separate preview and production namespaces without storing the raw address', async () => {
    const rpc = vi.fn().mockResolvedValue(rpcResult(true));
    await expect(
      checkSessionRateLimit(request(), 'create', {
        client: { rpc } as never,
        environment: deployedEnvironment,
      }),
    ).resolves.toBe('allowed');
    await expect(
      checkSessionRateLimit(request(), 'create', {
        client: { rpc } as never,
        environment: { ...deployedEnvironment, VERCEL_ENV: 'production' },
      }),
    ).resolves.toBe('allowed');
    await expect(
      checkSessionRateLimit(request(), 'create', {
        client: { rpc } as never,
        environment: { ...deployedEnvironment, VERCEL_PROJECT_ID: 'prj_SeparateProject' },
      }),
    ).resolves.toBe('allowed');
    await expect(
      checkSessionRateLimit(request(), 'create', {
        client: { rpc } as never,
        environment: {
          ...deployedEnvironment,
          VIBEVOTE_RATE_LIMIT_KEY_SECRET: 'a-different-rate-limit-key-secret-for-tests',
        },
      }),
    ).resolves.toBe('allowed');
    expect(rpc).toHaveBeenNthCalledWith(
      1,
      'check_session_rate_limit_v1',
      expect.objectContaining({
        p_namespace: 'preview:prj_VibeVoteReview',
        p_limit: sessionRateLimitPolicies.create.limit,
      }),
    );
    expect(rpc).toHaveBeenNthCalledWith(
      2,
      'check_session_rate_limit_v1',
      expect.objectContaining({ p_namespace: 'production:prj_VibeVoteReview' }),
    );
    expect(rpc).toHaveBeenNthCalledWith(
      3,
      'check_session_rate_limit_v1',
      expect.objectContaining({ p_namespace: 'preview:prj_SeparateProject' }),
    );
    expect(rpc.mock.calls[0]![1].p_key_hash).not.toBe(rpc.mock.calls[3]![1].p_key_hash);
    expect(JSON.stringify(rpc.mock.calls)).not.toContain('203.0.113.10');
  });

  it('canonicalizes equivalent addresses and rejects malformed forwarding values', async () => {
    const rpc = vi.fn().mockResolvedValue(rpcResult(true));
    for (const address of [
      '2001:0db8:0:0:0:0:0:1',
      '2001:db8::1',
      '::ffff:192.0.2.1',
      '192.0.2.1',
    ]) {
      await expect(
        checkSessionRateLimit(request(address), 'create', {
          client: { rpc } as never,
          environment: deployedEnvironment,
        }),
      ).resolves.toBe('allowed');
    }
    expect(rpc.mock.calls[0]![1].p_key_hash).toBe(rpc.mock.calls[1]![1].p_key_hash);
    expect(rpc.mock.calls[2]![1].p_key_hash).toBe(rpc.mock.calls[3]![1].p_key_hash);
    await expect(
      checkSessionRateLimit(request('203.0.113.10, 198.51.100.1'), 'create', {
        client: { rpc } as never,
        environment: deployedEnvironment,
      }),
    ).resolves.toBe('unavailable');
  });

  it('maps allowed and denied atomic-provider results without leaking key material', async () => {
    const allowedRpc = vi.fn().mockResolvedValue(rpcResult(true));
    const deniedRpc = vi.fn().mockResolvedValue(rpcResult(false));
    await expect(
      checkSessionRateLimit(request('2001:db8::1'), 'join', {
        client: { rpc: allowedRpc } as never,
        environment: deployedEnvironment,
      }),
    ).resolves.toBe('allowed');
    await expect(
      checkSessionRateLimit(request('2001:db8::1'), 'join', {
        client: { rpc: deniedRpc } as never,
        environment: deployedEnvironment,
      }),
    ).resolves.toBe('denied');
    expect(allowedRpc).toHaveBeenCalledWith(
      'check_session_rate_limit_v1',
      expect.objectContaining({
        p_limit: sessionRateLimitPolicies.join.limit,
        p_window_seconds: sessionRateLimitPolicies.join.windowSeconds,
        p_key_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    expect(JSON.stringify(allowedRpc.mock.calls)).not.toContain('2001:db8::1');
  });

  it.each([
    [
      'missing client address',
      () => Promise.resolve({ data: rpcResult(true).data, error: null }),
      new Request('https://app.example.test'),
    ],
    [
      'provider error',
      () => Promise.resolve({ data: null, error: { message: 'database secret' } }),
      request(),
    ],
    ['network failure', () => Promise.reject(new Error('provider password')), request()],
    [
      'malformed provider response',
      () => Promise.resolve({ data: { allowed: true }, error: null }),
      request(),
    ],
  ])('fails closed for %s', async (_name, response, input) => {
    await expect(
      checkSessionRateLimit(input, 'bootstrap', {
        client: { rpc: vi.fn().mockImplementation(response) } as never,
        environment: deployedEnvironment,
      }),
    ).resolves.toBe('unavailable');
  });

  it('bounds provider waits', async () => {
    await expect(
      checkSessionRateLimit(request(), 'create', {
        client: { rpc: vi.fn().mockImplementation(() => new Promise(() => undefined)) } as never,
        environment: { ...deployedEnvironment, VIBEVOTE_RATE_LIMIT_TIMEOUT_MS: '100' },
      }),
    ).resolves.toBe('unavailable');
  });
});
