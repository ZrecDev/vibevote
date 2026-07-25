import { bootstrapSessionResponseSchema } from '@vibevote/contracts';
import { SafeOperationError } from './errors';
import { type ServerSupabaseClient } from './operations';
import { projectRpcHostRoom, projectRpcParticipantRoom } from './room-projection';
import { createServiceRoleClient } from './supabase';
import { hashToken } from './tokens';

type BootstrapRpcResult = { participant_id?: string; role?: 'HOST' | 'GUEST'; room?: unknown };

export async function bootstrapSession(
  sessionId: string,
  participantAccessToken: string,
  { client = createServiceRoleClient() }: { client?: ServerSupabaseClient } = {},
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId))
    throw new SafeOperationError('INVALID_REQUEST');
  try {
    const { data, error } = await client.rpc('get_participant_session_v1', {
      p_session_id: sessionId,
      p_participant_access_token_hash: hashToken(participantAccessToken),
    });
    if (error) throw error;
    const result = data as BootstrapRpcResult | null;
    if (!result?.participant_id || !result.room || !result.role)
      throw new Error('invalid bootstrap result');
    return result.role === 'HOST'
      ? bootstrapSessionResponseSchema.parse({
          kind: 'HOST',
          session: projectRpcHostRoom(result.room),
        })
      : bootstrapSessionResponseSchema.parse({
          kind: 'GUEST',
          session: projectRpcParticipantRoom(result.room),
        });
  } catch {
    throw new SafeOperationError('UNAUTHORIZED');
  }
}
