import 'server-only';
import { bootstrapSession } from '@vibevote/server';
import { checkSessionRateLimit, type SessionRateLimiter } from '@/lib/server/rate-limit';
import { json, operationError, safeError } from '@/lib/server/http';
import { trustedOrigin } from '@/lib/server/origin';
import { PARTICIPANT_COOKIE_NAME } from '@/lib/server/participant-cookie';

const sessionIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function participantToken(request: Request) {
  return request.headers
    .get('cookie')
    ?.match(new RegExp(`(?:^|;\\s*)${PARTICIPANT_COOKIE_NAME}=([^;]+)`))?.[1];
}

export async function getSession(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
  {
    rateLimit = checkSessionRateLimit,
    bootstrap = bootstrapSession,
  }: { rateLimit?: SessionRateLimiter; bootstrap?: typeof bootstrapSession } = {},
) {
  const trust = trustedOrigin(request);
  if (trust.error)
    return safeError(
      'UNAUTHORIZED',
      trust.error === 'rejected' ? 'Request origin is not allowed.' : 'Service is unavailable.',
      trust.error === 'rejected' ? 403 : 503,
    );
  const limited = await rateLimit(request, 'bootstrap');
  if (limited !== 'allowed')
    return safeError(
      limited === 'denied' ? 'RATE_LIMITED' : 'INTERNAL_ERROR',
      limited === 'denied' ? 'Too many attempts. Try again later.' : 'Service is unavailable.',
      limited === 'denied' ? 429 : 503,
      true,
    );
  const { sessionId } = await params;
  if (!sessionIdPattern.test(sessionId))
    return safeError('INVALID_REQUEST', 'The session ID is not valid.', 400);
  const token = participantToken(request);
  if (!token) return safeError('UNAUTHORIZED', 'This session is not available.', 401);
  try {
    return json({ ok: true, data: await bootstrap(sessionId, token) });
  } catch (error) {
    return operationError(error);
  }
}

export async function GET(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  return getSession(request, context);
}
