import 'server-only';
import { createHash } from 'node:crypto';
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
  if (environment.NODE_ENV === 'test') return 'test';
  if (environment.NODE_ENV === 'development') return 'development';
  return environment.VERCEL_ENV === 'preview' ? 'preview' : 'production';
}

function clientAddress(request: Request) {
  const value = request.headers.get('x-vercel-forwarded-for')?.trim();
  return value && value.length <= 256 ? value : undefined;
}

function hashedRateLimitKey(namespace: string, policy: SessionRateLimitPolicy, address: string) {
  return createHash('sha256')
    .update(`vibevote-session-rate-limit:${namespace}:${policy}:${address}`)
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
  if (parsedEnvironment.data.VERCEL !== '1') return 'unavailable';

  const address = clientAddress(request);
  if (!address) return 'unavailable';

  try {
    const configuredClient = client ?? createServiceRoleClient(environment);
    const policyConfig = sessionRateLimitPolicies[policy];
    const response = await withTimeout<{ data: unknown; error: unknown }>(
      configuredClient.rpc('check_session_rate_limit_v1', {
        p_namespace: namespace,
        p_key_hash: hashedRateLimitKey(namespace, policy, address),
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
