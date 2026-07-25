import { fixtures } from '@vibevote/contracts';
import { describe, expect, it } from 'vitest';
import { bootstrapSession } from './bootstrap-session';
import type { ServerSupabaseClient } from './operations';

const sessionId = fixtures.lobbyRoom.session.id;
const rpcRoom = (participantId: string) => ({
  ...fixtures.lobbyRoom,
  currentParticipantId: participantId,
});

describe('bootstrapSession', () => {
  it('hashes the cookie token and projects safe host state', async () => {
    const rpc = async (_name: string, args: Record<string, unknown>) => {
      expect(args).toEqual({
        p_session_id: sessionId,
        p_participant_access_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      });
      return {
        data: {
          participant_id: fixtures.lobbyRoom.participants[0]!.id,
          role: 'HOST',
          room: rpcRoom(fixtures.lobbyRoom.participants[0]!.id),
        },
        error: null,
      };
    };
    const result = await bootstrapSession(sessionId, 'participant-secret', {
      client: { rpc } as unknown as ServerSupabaseClient,
    });
    expect(result.kind).toBe('HOST');
    if (result.kind === 'HOST') expect(result.session.hostControls).toBeDefined();
    expect(JSON.stringify(result)).not.toContain('participant-secret');
  });

  it('projects guest state without host controls', async () => {
    const result = await bootstrapSession(sessionId, 'participant-secret', {
      client: {
        rpc: async () => ({
          data: {
            participant_id: fixtures.lobbyRoom.participants[1]!.id,
            role: 'GUEST',
            room: rpcRoom(fixtures.lobbyRoom.participants[1]!.id),
          },
          error: null,
        }),
      } as unknown as ServerSupabaseClient,
    });
    expect(result.kind).toBe('GUEST');
    expect(result.session).not.toHaveProperty('hostControls');
  });

  it.each(['not-a-uuid', sessionId])('maps invalid credentials safely', async (id) => {
    await expect(
      bootstrapSession(id, 'participant-secret', {
        client: {
          rpc: async () => ({ data: null, error: { message: 'SQL credentials leaked' } }),
        } as unknown as ServerSupabaseClient,
      }),
    ).rejects.toEqual(
      expect.objectContaining({ code: id === sessionId ? 'UNAUTHORIZED' : 'INVALID_REQUEST' }),
    );
  });
});
