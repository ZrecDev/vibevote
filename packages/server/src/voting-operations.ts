import {
  finalResultResponseSchema,
  submitPrivateBallotRequestSchema,
  submitPrivateBallotResponseSchema,
} from '@vibevote/contracts';
import { mapOperationError, SafeOperationError } from './errors';
import type { ServerSupabaseClient } from './operations';
import { createServiceRoleClient } from './supabase';
import { hashToken } from './tokens';

const sessionIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const valid = (sessionId: string) => {
  if (!sessionIdPattern.test(sessionId)) throw new SafeOperationError('INVALID_REQUEST');
};

export async function submitPrivateBallot(
  sessionId: string,
  participantToken: string,
  request: unknown,
  { client = createServiceRoleClient() }: { client?: ServerSupabaseClient } = {},
) {
  valid(sessionId);
  try {
    const input = submitPrivateBallotRequestSchema.parse(request);
    const { data, error } = await client.rpc('submit_private_ballot_v1', {
      p_session_id: sessionId,
      p_participant_access_token_hash: hashToken(participantToken),
      p_ballots: input.ballots,
    });
    if (error) throw error;
    return submitPrivateBallotResponseSchema.parse({ progress: data });
  } catch (error) {
    throw mapOperationError(error);
  }
}

export async function finalizeDecision(
  sessionId: string,
  participantToken: string,
  { client = createServiceRoleClient() }: { client?: ServerSupabaseClient } = {},
) {
  valid(sessionId);
  try {
    const { data, error } = await client.rpc('finalize_decision_v1', {
      p_session_id: sessionId,
      p_host_participant_access_token_hash: hashToken(participantToken),
    });
    if (error) throw error;
    const result = data as { finalizedAt?: unknown } & object;
    return finalResultResponseSchema.parse({
      result: {
        ...result,
        finalizedAt:
          typeof result.finalizedAt === 'string'
            ? new Date(result.finalizedAt).toISOString()
            : result.finalizedAt,
      },
    });
  } catch (error) {
    throw mapOperationError(error);
  }
}
