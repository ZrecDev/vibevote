import {
  createInvitationResponseSchema,
  hostRoomStateSchema,
  updateReadinessRequestSchema,
  updateReadinessResponseSchema,
  updateOptionEligibilityRequestSchema,
  updateOptionEligibilityResponseSchema,
} from '@vibevote/contracts';
import { mapOperationError, SafeOperationError } from './errors';
import type { ServerSupabaseClient } from './operations';
import { projectRpcHostRoom } from './room-projection';
import { createServiceRoleClient } from './supabase';
import { generateToken, hashToken } from './tokens';

const sessionIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const valid = (sessionId: string) => {
  if (!sessionIdPattern.test(sessionId)) throw new SafeOperationError('INVALID_REQUEST');
};

export async function replaceInvitation(
  sessionId: string,
  participantToken: string,
  invitationBaseUrl: string | URL,
  { client = createServiceRoleClient() }: { client?: ServerSupabaseClient } = {},
) {
  valid(sessionId);
  try {
    const token = generateToken();
    const { data, error } = await client.rpc('replace_session_invitation_v1', {
      p_session_id: sessionId,
      p_host_participant_access_token_hash: hashToken(participantToken),
      p_invitation_token_hash: hashToken(token),
    });
    if (error) throw error;
    const inviteUrl = new URL(invitationBaseUrl);
    inviteUrl.searchParams.set('invite', token);
    const invitation = data as { expiresAt?: unknown } & object;
    return createInvitationResponseSchema.parse({
      invitation: {
        ...invitation,
        inviteUrl: inviteUrl.toString(),
        expiresAt:
          typeof invitation.expiresAt === 'string'
            ? new Date(invitation.expiresAt).toISOString()
            : invitation.expiresAt,
      },
    });
  } catch (error) {
    throw mapOperationError(error);
  }
}

export async function revokeInvitation(
  sessionId: string,
  participantToken: string,
  { client = createServiceRoleClient() }: { client?: ServerSupabaseClient } = {},
) {
  valid(sessionId);
  try {
    const { error } = await client.rpc('revoke_session_invitation_v1', {
      p_session_id: sessionId,
      p_host_participant_access_token_hash: hashToken(participantToken),
    });
    if (error) throw error;
  } catch (error) {
    throw mapOperationError(error);
  }
}

export async function updateReadiness(
  sessionId: string,
  participantToken: string,
  request: unknown,
  { client = createServiceRoleClient() }: { client?: ServerSupabaseClient } = {},
) {
  valid(sessionId);
  try {
    const input = updateReadinessRequestSchema.parse(request);
    const { data, error } = await client.rpc('update_participant_readiness_v1', {
      p_session_id: sessionId,
      p_participant_access_token_hash: hashToken(participantToken),
      p_readiness: input.readiness,
    });
    if (error) throw error;
    return updateReadinessResponseSchema.parse({ participant: data });
  } catch (error) {
    throw mapOperationError(error);
  }
}

export async function updateOptionEligibility(
  sessionId: string,
  participantToken: string,
  optionId: string,
  request: unknown,
  { client = createServiceRoleClient() }: { client?: ServerSupabaseClient } = {},
) {
  valid(sessionId);
  try {
    const input = updateOptionEligibilityRequestSchema.parse(request);
    const { data, error } = await client.rpc('update_option_eligibility_v1', {
      p_session_id: sessionId,
      p_host_participant_access_token_hash: hashToken(participantToken),
      p_option_id: optionId,
      p_eligible: input.eligible,
    });
    if (error) throw error;
    return updateOptionEligibilityResponseSchema.parse({ option: data });
  } catch (error) {
    throw mapOperationError(error);
  }
}

export async function startLobbyVoting(
  sessionId: string,
  participantToken: string,
  { client = createServiceRoleClient() }: { client?: ServerSupabaseClient } = {},
) {
  valid(sessionId);
  try {
    const { data, error } = await client.rpc('start_lobby_voting_v1', {
      p_session_id: sessionId,
      p_host_participant_access_token_hash: hashToken(participantToken),
    });
    if (error) throw error;
    return hostRoomStateSchema.parse(projectRpcHostRoom(data));
  } catch (error) {
    throw mapOperationError(error);
  }
}
