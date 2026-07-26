import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkSessionRateLimit, sessionRateLimitPolicies } from './rate-limit';

const originalEnv = { ...process.env };
const request = (address = '203.0.113.10') =>
  new Request('https://app.example.test/api/v1/sessions', {
    headers: { 'x-vercel-forwarded-for': address },
  });
const deployedEnvironment = {
  NODE_ENV: 'production',
  VERCEL: '1',
  VERCEL_ENV: 'preview',
  SUPABASE_URL: 'https://project.example.test',
  SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
};
const rpcResult = (allowed: boolean) => ({
  data: [{ allowed, remaining: allowed ? 4 : 0, reset_at: '2026-07-25T00:01:00.000Z' }],
  error: null,
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
    expect(rpc).toHaveBeenNthCalledWith(
      1,
      'check_session_rate_limit_v1',
      expect.objectContaining({
        p_namespace: 'preview',
        p_limit: sessionRateLimitPolicies.create.limit,
      }),
    );
    expect(rpc).toHaveBeenNthCalledWith(
      2,
      'check_session_rate_limit_v1',
      expect.objectContaining({ p_namespace: 'production' }),
    );
    expect(JSON.stringify(rpc.mock.calls)).not.toContain('203.0.113.10');
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
