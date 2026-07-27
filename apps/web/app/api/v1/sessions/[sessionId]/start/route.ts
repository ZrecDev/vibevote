import 'server-only';
import { startLobbyVoting } from '@vibevote/server';
import { json, operationError, safeError } from '@/lib/server/http';
import { trustedOrigin } from '@/lib/server/origin';
import { participantToken } from '@/lib/server/participant-token';
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const trust = trustedOrigin(request);
  if (trust.error) return safeError('UNAUTHORIZED', 'Request origin is not allowed.', 403);
  const token = participantToken(request);
  if (!token) return safeError('UNAUTHORIZED', 'This session is not available.', 401);
  try {
    return json({
      ok: true,
      data: { session: await startLobbyVoting((await params).sessionId, token) },
    });
  } catch (error) {
    return operationError(error);
  }
}
