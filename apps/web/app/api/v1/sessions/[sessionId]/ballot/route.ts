import 'server-only';
import { submitPrivateBallot } from '@vibevote/server';
import { json, operationError, readJson, safeError } from '@/lib/server/http';
import { trustedOrigin } from '@/lib/server/origin';
import { participantToken } from '@/lib/server/participant-token';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const trust = trustedOrigin(request);
  if (trust.error)
    return safeError(
      'UNAUTHORIZED',
      'Request origin is not allowed.',
      trust.error === 'rejected' ? 403 : 503,
    );
  const token = participantToken(request);
  if (!token) return safeError('UNAUTHORIZED', 'This session is not available.', 401);
  const parsed = await readJson(request);
  if (parsed.error) return parsed.error;
  try {
    return json({
      ok: true,
      data: await submitPrivateBallot((await params).sessionId, token, parsed.value),
    });
  } catch (error) {
    return operationError(error);
  }
}
