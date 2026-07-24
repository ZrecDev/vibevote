import {
  createSessionRequestSchema,
  createSessionResponseSchema,
  type CreateSessionResponse,
} from '@vibevote/contracts';
import { mapOperationError, SafeOperationError } from './errors';
import { type ServerSupabaseClient } from './operations';
import { projectRpcHostRoom } from './room-projection';
import { createServiceRoleClient } from './supabase';
import { generateToken, hashToken } from './tokens';

type CreateRpcResult = { session_id?: string; participant_id?: string; room?: unknown };

export type CreateSessionOperationOptions = {
  hostDisplayName: string;
  invitationBaseUrl: string | URL;
  client?: ServerSupabaseClient;
};

export async function createSession(
  request: unknown,
  {
    hostDisplayName,
    invitationBaseUrl,
    client = createServiceRoleClient(),
  }: CreateSessionOperationOptions,
): Promise<CreateSessionResponse> {
  try {
    const input = createSessionRequestSchema.parse(request);
    const invitationToken = generateToken();
    const invitationTokenHash = hashToken(invitationToken);
    const inviteUrl = new URL(invitationBaseUrl);
    inviteUrl.searchParams.set('invite', invitationToken);

    const { data, error } = await client.rpc('create_decision_session_v1', {
      p_title: input.title,
      p_category: input.category,
      p_mode: input.mode,
      p_options: input.options,
      p_host_display_name: hostDisplayName,
      p_invitation_token_hash: invitationTokenHash,
    });
    if (error) throw error;

    const result = data as CreateRpcResult | null;
    if (!result?.session_id || !result.participant_id || !result.room)
      throw new SafeOperationError('INTERNAL_ERROR');

    return createSessionResponseSchema.parse({
      session: projectRpcHostRoom(result.room),
      invitation: {
        sessionId: result.session_id,
        inviteUrl: inviteUrl.toString(),
        expiresAt: null,
      },
    });
  } catch (error) {
    throw mapOperationError(error);
  }
}
