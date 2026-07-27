import { fixtures } from '@vibevote/contracts';
import { describe, expect, it } from 'vitest';
import { SafeOperationError } from './errors';
import { replaceInvitation, startLobbyVoting, updateReadiness } from './lobby-operations';
import type { ServerSupabaseClient } from './operations';

const sessionId = fixtures.lobbyRoom.session.id;
const token = 'participant-token';
const client = (rpc: (name: string, args: Record<string, unknown>) => Promise<unknown>) =>
  ({ rpc }) as unknown as ServerSupabaseClient;

describe('lobby operations', () => {
  it('returns a host-only share URL while persisting hashes only', async () => {
    const result = await replaceInvitation(sessionId, token, 'https://app.example.test/join', {
      client: client(async (_name, args) => {
        expect(args.p_host_participant_access_token_hash).toMatch(/^[a-f0-9]{64}$/);
        expect(args.p_invitation_token_hash).toMatch(/^[a-f0-9]{64}$/);
        return {
          data: {
            id: '550e8400-e29b-41d4-a716-446655440020',
            sessionId,
            expiresAt: '2026-07-28T00:00:00+00:00',
            status: 'ACTIVE',
          },
          error: null,
        };
      }),
    });
    expect(result.invitation.inviteUrl).toMatch(/^https:\/\/app\.example\.test\/join\?invite=/);
    expect(result.invitation.expiresAt).toBe('2026-07-28T00:00:00.000Z');
    expect(JSON.stringify(result)).not.toMatch(/token_hash|participant-token/);
  });

  it('updates only the authenticated participant readiness', async () => {
    const result = await updateReadiness(
      sessionId,
      token,
      { readiness: 'READY' },
      {
        client: client(async (name, args) => {
          expect(name).toBe('update_participant_readiness_v1');
          expect(args).not.toHaveProperty('p_participant_id');
          return { data: fixtures.lobbyRoom.participants[0], error: null };
        }),
      },
    );
    expect(result.participant.readiness).toBe('READY');
  });

  it('maps unauthorized and invalid-state database errors safely', async () => {
    await expect(
      updateReadiness(
        sessionId,
        token,
        { readiness: 'READY' },
        { client: client(async () => ({ data: null, error: { code: '42501' } })) },
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<SafeOperationError>>({ code: 'UNAUTHORIZED' }),
    );
    await expect(
      replaceInvitation(sessionId, token, 'https://app.example.test/join', {
        client: client(async () => ({ data: null, error: { code: '55000' } })),
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<SafeOperationError>>({ code: 'INVALID_SESSION_STATUS' }),
    );
  });

  it('uses the typed room projection after an atomic start', async () => {
    const room = await startLobbyVoting(sessionId, token, {
      client: client(async () => ({
        data: {
          ...fixtures.lobbyRoom,
          currentParticipantId: fixtures.lobbyRoom.participants[0]!.id,
        },
        error: null,
      })),
    });
    expect(room.session.status).toBe('LOBBY');
    expect(room.hostControls.canStartVoting).toBe(true);
  });
});
