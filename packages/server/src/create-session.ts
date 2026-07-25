import { createSessionRequestSchema, createSessionResponseSchema } from '@vibevote/contracts';
import { mapOperationError, SafeOperationError } from './errors';
import { type InternalCreateSessionResult, type ServerSupabaseClient } from './operations';
import { projectRpcHostRoom } from './room-projection';
import { createServiceRoleClient } from './supabase';
import { generateToken, hashToken } from './tokens';

type CreateRpcResult = { session_id?: string; participant_id?: string; room?: unknown };

export type CreateSessionOperationOptions = {
  invitationBaseUrl: string | URL;
  client?: ServerSupabaseClient;
};

export async function createSession(
  request: unknown,
  { invitationBaseUrl, client = createServiceRoleClient() }: CreateSessionOperationOptions,
): Promise<InternalCreateSessionResult> {
  try {
    const input = createSessionRequestSchema.parse(request);
    const invitationToken = generateToken();
    const participantAccessToken = generateToken();
    const invitationTokenHash = hashToken(invitationToken);
    const inviteUrl = new URL(invitationBaseUrl);
    inviteUrl.searchParams.set('invite', invitationToken);

    const { data, error } = await client.rpc('create_decision_session_v1', {
      p_title: input.title,
      p_category: input.category,
      p_mode: input.mode,
      p_options: input.options,
      p_host_display_name: input.hostDisplayName,
      p_invitation_token_hash: invitationTokenHash,
      p_host_participant_access_token_hash: hashToken(participantAccessToken),
    });
    if (error) throw error;

    const result = data as CreateRpcResult | null;
    if (!result?.session_id || !result.participant_id || !result.room)
      throw new SafeOperationError('INTERNAL_ERROR');

    return {
      response: createSessionResponseSchema.parse({
        session: projectRpcHostRoom(result.room),
        invitation: {
          sessionId: result.session_id,
          inviteUrl: inviteUrl.toString(),
          expiresAt: null,
        },
      }),
      participantAccessToken,
    };
  } catch (error) {
    throw mapOperationError(error);
  }
}
