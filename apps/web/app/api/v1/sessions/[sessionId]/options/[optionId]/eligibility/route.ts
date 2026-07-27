import 'server-only';
import { updateOptionEligibility } from '@vibevote/server';
import { json, operationError, readJson, safeError } from '@/lib/server/http';
import { trustedOrigin } from '@/lib/server/origin';
import { participantToken } from '@/lib/server/participant-token';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; optionId: string }> },
) {
  const trust = trustedOrigin(request);
  if (trust.error) return safeError('UNAUTHORIZED', 'Request origin is not allowed.', 403);
  const token = participantToken(request);
  if (!token) return safeError('UNAUTHORIZED', 'This session is not available.', 401);
  const parsed = await readJson(request);
  if (parsed.error) return parsed.error;
  try {
    const { sessionId, optionId } = await params;
    return json({
      ok: true,
      data: await updateOptionEligibility(sessionId, token, optionId, parsed.value),
    });
  } catch (error) {
    return operationError(error);
  }
}
