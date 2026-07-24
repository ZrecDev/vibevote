import { fixtures } from '@vibevote/contracts';
import { describe, expect, it } from 'vitest';
import { SafeOperationError } from './errors';
import { createSession } from './create-session';
import type { ServerSupabaseClient } from './operations';

const input = {
  title: 'Dinner',
  category: 'CUSTOM' as const,
  mode: 'BEST_FIT' as const,
  options: [{ label: 'One' }, { label: 'Two' }],
  hostDisplayName: 'Alex',
};
const rpcRoom = (participantId: string) => ({
  ...fixtures.lobbyRoom,
  currentParticipantId: participantId,
});

describe('createSession', () => {
  it('persists hashes only and returns the host credential only internally', async () => {
    const rpc = async (_name: string, args: Record<string, unknown>) => {
      expect(args.p_host_participant_access_token_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(args.p_host_participant_access_token_hash).not.toBe(args.p_invitation_token_hash);
      return {
        data: {
          session_id: fixtures.lobbyRoom.session.id,
          participant_id: fixtures.lobbyRoom.participants[0]!.id,
          room: rpcRoom(fixtures.lobbyRoom.participants[0]!.id),
        },
        error: null,
      };
    };
    const result = await createSession(input, {
      invitationBaseUrl: 'https://app.example.test/join',
      client: { rpc } as unknown as ServerSupabaseClient,
    });
    expect(result.participantAccessToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(JSON.stringify(result.response)).not.toContain(result.participantAccessToken);
    expect(result.response.session.hostControls).toBeDefined();
  });

  it('maps malformed RPC output to a safe error', async () => {
    await expect(
      createSession(input, {
        invitationBaseUrl: 'https://app.example.test/join',
        client: { rpc: async () => ({ data: {}, error: null }) } as unknown as ServerSupabaseClient,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<SafeOperationError>>({ code: 'INTERNAL_ERROR' }),
    );
  });
});
