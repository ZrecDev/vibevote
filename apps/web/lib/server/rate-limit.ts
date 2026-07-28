import 'server-only';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { createServiceRoleClient } from '@vibevote/server';
import { z } from 'zod';

export type RateLimitResult = 'allowed' | 'denied' | 'unavailable';

export const sessionRateLimitPolicies = {
  create: { limit: 5, windowSeconds: 60 },
  join: { limit: 10, windowSeconds: 60 },
  bootstrap: { limit: 60, windowSeconds: 60 },
} as const;

export type SessionRateLimitPolicy = keyof typeof sessionRateLimitPolicies;
export type SessionRateLimiter = typeof checkSessionRateLimit;

type RateLimitClient = Pick<ReturnType<typeof createServiceRoleClient>, 'rpc'>;

const rateLimitEnvironmentSchema = z.object({
  NODE_ENV: z.string().optional(),
  VERCEL: z.string().optional(),
  VERCEL_ENV: z.enum(['preview', 'production']).optional(),
  VERCEL_PROJECT_ID: z
    .string()
    .regex(/^prj_[A-Za-z0-9]+$/)
    .optional(),
  VIBEVOTE_RATE_LIMIT_KEY_SECRET: z.string().min(32).max(512).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  VIBEVOTE_RATE_LIMIT_TIMEOUT_MS: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(100).max(10_000))
    .optional(),
});

const rateLimitResponseSchema = z
  .array(
    z.object({
      allowed: z.boolean(),
      remaining: z.number().int().nonnegative(),
      reset_at: z.string().datetime({ offset: true }),
    }),
  )
  .length(1);

const defaultTimeoutMs = 1_000;

function namespaceFor(environment: z.infer<typeof rateLimitEnvironmentSchema>) {
  if (!environment.VERCEL && !environment.VERCEL_ENV && !environment.VERCEL_PROJECT_ID) {
    if (environment.NODE_ENV === 'test') return 'test';
    if (environment.NODE_ENV === 'development') return 'development';
  }
  if (environment.VERCEL !== '1' || !environment.VERCEL_ENV || !environment.VERCEL_PROJECT_ID)
    return undefined;
  return `${environment.VERCEL_ENV}:${environment.VERCEL_PROJECT_ID}`;
}

function rateLimitSecret(environment: z.infer<typeof rateLimitEnvironmentSchema>) {
  if (environment.VIBEVOTE_RATE_LIMIT_KEY_SECRET) return environment.VIBEVOTE_RATE_LIMIT_KEY_SECRET;
  if (!environment.SUPABASE_SERVICE_ROLE_KEY) return undefined;
  return createHmac('sha256', environment.SUPABASE_SERVICE_ROLE_KEY)
    .update('vibevote-rate-limit-key-secret-v1')
    .digest('hex');
}

function clientAddress(request: Request) {
  const value = request.headers.get('x-forwarded-for')?.trim();
  if (!value || value.length > 45 || !isIP(value)) return undefined;
  if (isIP(value) === 4) return value;
  const normalized = new URL(`http://[${value}]`).hostname.slice(1, -1);
  const mapped = normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!mapped) return normalized;
  const high = Number.parseInt(mapped[1]!, 16);
  const low = Number.parseInt(mapped[2]!, 16);
  return [high >> 8, high & 255, low >> 8, low & 255].join('.');
}

function hashedRateLimitKey(
  namespace: string,
  policy: SessionRateLimitPolicy,
  address: string,
  secret: string,
) {
  return createHmac('sha256', secret)
    .update(JSON.stringify(['vibevote-session-rate-limit-v1', namespace, policy, address]))
    .digest('hex');
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T | undefined> {
  let clear: (() => void) | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<undefined>((resolve) => {
        const timeout = setTimeout(resolve, timeoutMs);
        clear = () => clearTimeout(timeout);
      }),
    ]);
  } finally {
    clear?.();
  }
}

/**
 * Uses Vercel's deployment-owned client address header and an atomic Supabase RPC.
 * Local development and tests remain intentionally provider-free.
 */
export async function checkSessionRateLimit(
  request: Request,
  policy: SessionRateLimitPolicy,
  {
    client,
    environment = process.env,
  }: {
    client?: RateLimitClient;
    environment?: Record<string, string | undefined>;
  } = {},
): Promise<RateLimitResult> {
  const parsedEnvironment = rateLimitEnvironmentSchema.safeParse(environment);
  if (!parsedEnvironment.success) return 'unavailable';

  const namespace = namespaceFor(parsedEnvironment.data);
  if (namespace === 'development' || namespace === 'test') return 'allowed';
  if (!namespace) return 'unavailable';
  const secret = rateLimitSecret(parsedEnvironment.data);
  if (!secret) return 'unavailable';

  const address = clientAddress(request);
  if (!address) return 'unavailable';

  try {
    const configuredClient = client ?? createServiceRoleClient(environment);
    const policyConfig = sessionRateLimitPolicies[policy];
    const response = await withTimeout<{ data: unknown; error: unknown }>(
      configuredClient.rpc('check_session_rate_limit_v1', {
        p_namespace: namespace,
        p_key_hash: hashedRateLimitKey(namespace, policy, address, secret),
        p_limit: policyConfig.limit,
        p_window_seconds: policyConfig.windowSeconds,
      }) as unknown as Promise<{ data: unknown; error: unknown }>,
      parsedEnvironment.data.VIBEVOTE_RATE_LIMIT_TIMEOUT_MS ?? defaultTimeoutMs,
    );
    if (!response || response.error) return 'unavailable';
    const result = rateLimitResponseSchema.safeParse(response.data);
    if (!result.success) return 'unavailable';
    return result.data[0]!.allowed ? 'allowed' : 'denied';
  } catch {
    return 'unavailable';
  }
}
