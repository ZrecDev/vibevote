import { createSession } from '@vibevote/server';
import { createSessionRequestSchema } from '@vibevote/contracts';
import { checkSessionRateLimit, type SessionRateLimiter } from '@/lib/server/rate-limit';
import { json, operationError, readJson, safeError } from '@/lib/server/http';
import { trustedOrigin } from '@/lib/server/origin';

export async function postSession(
  request: Request,
  { rateLimit = checkSessionRateLimit }: { rateLimit?: SessionRateLimiter } = {},
) {
  const trust = trustedOrigin(request);
  if (trust.error)
    return safeError(
      'UNAUTHORIZED',
      trust.error === 'rejected' ? 'Request origin is not allowed.' : 'Service is unavailable.',
      trust.error === 'rejected' ? 403 : 503,
    );
  const limited = await rateLimit();
  if (limited !== 'allowed')
    return safeError(
      limited === 'denied' ? 'RATE_LIMITED' : 'INTERNAL_ERROR',
      limited === 'denied' ? 'Too many attempts. Try again later.' : 'Service is unavailable.',
      limited === 'denied' ? 429 : 503,
      true,
    );
  const parsed = await readJson(request);
  if (parsed.error) return parsed.error;
  try {
    const input = createSessionRequestSchema.parse(parsed.value);
    return json({
      ok: true,
      data: await createSession(input, { invitationBaseUrl: `${trust.origin}/join` }),
    });
  } catch (error) {
    return operationError(error);
  }
}

export async function POST(request: Request) {
  return postSession(request);
}
