import { fixtures } from '@vibevote/contracts';
import { describe, expect, it } from 'vitest';
import { joinSession } from './join-session';
import type { ServerSupabaseClient } from './operations';

const rpcRoom = (participantId: string) => ({
  ...fixtures.lobbyRoom,
  currentParticipantId: participantId,
});

describe('joinSession', () => {
  it('persists only a new participant credential hash and keeps it out of the public response', async () => {
    const rpc = async (_name: string, args: Record<string, unknown>) => {
      expect(args.p_invitation_token_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(args.p_participant_access_token_hash).toMatch(/^[a-f0-9]{64}$/);
      return {
        data: {
          session_id: fixtures.lobbyRoom.session.id,
          participant_id: fixtures.lobbyRoom.participants[1]!.id,
          room: rpcRoom(fixtures.lobbyRoom.participants[1]!.id),
        },
        error: null,
      };
    };
    const result = await joinSession(
      { inviteToken: 'invite-secret', displayName: 'Sam' },
      { client: { rpc } as unknown as ServerSupabaseClient },
    );
    expect(result.participantAccessToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(JSON.stringify(result.response)).not.toContain(result.participantAccessToken);
  });

  it('keeps invalid invitation failures safe', async () => {
    await expect(
      joinSession(
        { inviteToken: 'invite-secret', displayName: 'Sam' },
        {
          client: {
            rpc: async () => ({ data: null, error: { code: '22023' } }),
          } as unknown as ServerSupabaseClient,
        },
      ),
    ).rejects.toEqual(expect.objectContaining({ code: 'INVALID_INVITE' }));
  });
});
