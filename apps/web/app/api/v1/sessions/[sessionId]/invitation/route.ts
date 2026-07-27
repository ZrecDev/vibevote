import 'server-only';
import { replaceInvitation, revokeInvitation } from '@vibevote/server';
import { json, operationError, safeError } from '@/lib/server/http';
import { trustedOrigin } from '@/lib/server/origin';
import { participantToken } from '@/lib/server/participant-token';

async function context(request: Request, params: Promise<{ sessionId: string }>) {
  const trust = trustedOrigin(request);
  if (trust.error)
    return {
      error: safeError(
        'UNAUTHORIZED',
        trust.error === 'rejected' ? 'Request origin is not allowed.' : 'Service is unavailable.',
        trust.error === 'rejected' ? 403 : 503,
      ),
    };
  const token = participantToken(request);
  if (!token) return { error: safeError('UNAUTHORIZED', 'This session is not available.', 401) };
  return { token, sessionId: (await params).sessionId, origin: trust.origin! };
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const value = await context(request, params);
  if ('error' in value) return value.error;
  try {
    return json({
      ok: true,
      data: await replaceInvitation(value.sessionId, value.token, `${value.origin}/join`),
    });
  } catch (error) {
    return operationError(error);
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const value = await context(request, params);
  if ('error' in value) return value.error;
  try {
    await revokeInvitation(value.sessionId, value.token);
    return new Response(null, { status: 204 });
  } catch (error) {
    return operationError(error);
  }
}
