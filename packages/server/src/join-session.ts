import { joinSessionRequestSchema, joinSessionResponseSchema } from '@vibevote/contracts';
import { mapOperationError, SafeOperationError } from './errors';
import { type InternalJoinSessionResult, type ServerSupabaseClient } from './operations';
import { projectRpcParticipantRoom } from './room-projection';
import { createServiceRoleClient } from './supabase';
import { generateToken, hashToken } from './tokens';

type JoinRpcResult = { session_id?: string; participant_id?: string; room?: unknown };

export type JoinSessionOperationOptions = { client?: ServerSupabaseClient };

export async function joinSession(
  request: unknown,
  { client = createServiceRoleClient() }: JoinSessionOperationOptions = {},
): Promise<InternalJoinSessionResult> {
  try {
    const input = joinSessionRequestSchema.parse(request);
    const participantAccessToken = generateToken();
    const { data, error } = await client.rpc('join_decision_session_v1', {
      p_invitation_token_hash: hashToken(input.inviteToken),
      p_display_name: input.displayName,
      p_participant_access_token_hash: hashToken(participantAccessToken),
    });
    if (error) throw error;

    const result = data as JoinRpcResult | null;
    if (!result?.session_id || !result.participant_id || !result.room)
      throw new SafeOperationError('INTERNAL_ERROR');

    return {
      response: joinSessionResponseSchema.parse({
        session: projectRpcParticipantRoom(result.room),
      }),
      participantAccessToken,
    };
  } catch (error) {
    throw mapOperationError(error);
  }
}
