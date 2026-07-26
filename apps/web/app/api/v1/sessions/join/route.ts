import 'server-only';
import { joinSession } from '@vibevote/server';
import { joinSessionRequestSchema } from '@vibevote/contracts';
import { participantCookie } from '@/lib/server/participant-cookie';
import { json, operationError, readJson, safeError } from '@/lib/server/http';
import { trustedOrigin } from '@/lib/server/origin';
import { checkSessionRateLimit, type SessionRateLimiter } from '@/lib/server/rate-limit';

export async function postJoinSession(
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
  const limited = await rateLimit(request, 'join');
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
    const result = await joinSession(joinSessionRequestSchema.parse(parsed.value));
    const response = json({ ok: true, data: result.response });
    const cookie = participantCookie(
      result.response.session.session.id,
      result.participantAccessToken,
    );
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    return operationError(error);
  }
}

export async function POST(request: Request) {
  return postJoinSession(request);
}
