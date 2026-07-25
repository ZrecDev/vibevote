import { describe, expect, it } from 'vitest';
import {
  apiErrorSchema,
  apiErrorCodeSchema,
  bootstrapSessionResponseSchema,
  createSessionRequestSchema,
  fixtures,
  joinSessionRequestSchema,
  publicRoomStateSchema,
  sessionStatusSchema,
} from '.';

const options = [{ label: 'North Star Cafe' }, { label: 'Green Bowl' }];

describe('v1 session contracts', () => {
  it('strictly discriminates safe bootstrap host and guest room responses', () => {
    const host = {
      kind: 'HOST',
      session: {
        ...fixtures.lobbyRoom,
        currentParticipantId: fixtures.lobbyRoom.participants[0]!.id,
        hostControls: { canStartVoting: true, canCancelSession: true },
      },
    };
    const guest = {
      kind: 'GUEST',
      session: {
        ...fixtures.lobbyRoom,
        currentParticipantId: fixtures.lobbyRoom.participants[1]!.id,
      },
    };
    expect(bootstrapSessionResponseSchema.safeParse(host).success).toBe(true);
    expect(bootstrapSessionResponseSchema.safeParse(guest).success).toBe(true);
    expect(
      bootstrapSessionResponseSchema.safeParse({
        ...guest,
        session: { ...guest.session, hostControls: host.session.hostControls },
      }).success,
    ).toBe(false);
    for (const invalid of [
      { session: guest.session },
      { kind: 'GUEST', session: guest.session, participantAccessToken: 'secret' },
      { kind: 'HOST', session: host.session, participant_access_token_hash: 'a'.repeat(64) },
    ]) {
      expect(bootstrapSessionResponseSchema.safeParse(invalid).success).toBe(false);
    }
  });
  it('parses a valid create-session request', () => {
    expect(
      createSessionRequestSchema.safeParse({
        title: 'Friday dinner',
        category: 'CUSTOM',
        mode: 'BEST_FIT',
        options,
        hostDisplayName: '  Alex  ',
      }).success,
    ).toBe(true);
  });

  it('requires a trimmed host display name and keeps the schema strict', () => {
    expect(
      createSessionRequestSchema.parse({
        title: 'Dinner',
        category: 'EAT',
        mode: 'BEST_FIT',
        options,
        hostDisplayName: '  Alex  ',
      }).hostDisplayName,
    ).toBe('Alex');
    for (const hostDisplayName of ['', '   ', 'x'.repeat(61)]) {
      expect(
        createSessionRequestSchema.safeParse({
          title: 'Dinner',
          category: 'EAT',
          mode: 'BEST_FIT',
          options,
          hostDisplayName,
        }).success,
      ).toBe(false);
    }
    expect(
      createSessionRequestSchema.safeParse({
        title: 'Dinner',
        category: 'EAT',
        mode: 'BEST_FIT',
        options,
        hostDisplayName: 'Alex',
        extra: true,
      }).success,
    ).toBe(false);
  });

  it('accepts the minimum and maximum option counts', () => {
    expect(
      createSessionRequestSchema.safeParse({
        title: 'Two',
        category: 'CUSTOM',
        mode: 'BEST_FIT',
        options,
        hostDisplayName: 'Alex',
      }).success,
    ).toBe(true);
    expect(
      createSessionRequestSchema.safeParse({
        title: 'Twelve',
        category: 'CUSTOM',
        mode: 'BEST_FIT',
        options: Array.from({ length: 12 }, (_, index) => ({ label: `Option ${index + 1}` })),
        hostDisplayName: 'Alex',
      }).success,
    ).toBe(true);
  });

  it('rejects fewer than two or more than twelve options', () => {
    expect(
      createSessionRequestSchema.safeParse({
        title: 'One',
        category: 'CUSTOM',
        mode: 'BEST_FIT',
        options: options.slice(0, 1),
        hostDisplayName: 'Alex',
      }).success,
    ).toBe(false);
    expect(
      createSessionRequestSchema.safeParse({
        title: 'Thirteen',
        category: 'CUSTOM',
        mode: 'BEST_FIT',
        options: Array.from({ length: 13 }, (_, index) => ({ label: `Option ${index + 1}` })),
        hostDisplayName: 'Alex',
      }).success,
    ).toBe(false);
  });

  it('rejects invalid decision modes and session statuses', () => {
    expect(
      createSessionRequestSchema.safeParse({
        title: 'Mode',
        category: 'CUSTOM',
        mode: 'RANDOM',
        options,
        hostDisplayName: 'Alex',
      }).success,
    ).toBe(false);
    expect(sessionStatusSchema.safeParse('OPEN').success).toBe(false);
  });

  it('parses a valid guest join request and rejects invalid display names', () => {
    expect(
      joinSessionRequestSchema.safeParse({ inviteToken: 'invite-token', displayName: 'Sam' })
        .success,
    ).toBe(true);
    expect(
      joinSessionRequestSchema.safeParse({ inviteToken: 'invite-token', displayName: '   ' })
        .success,
    ).toBe(false);
  });

  it('parses valid public state and rejects private fields', () => {
    expect(publicRoomStateSchema.safeParse(fixtures.lobbyRoom).success).toBe(true);
    expect(
      publicRoomStateSchema.safeParse({ ...fixtures.lobbyRoom, votes: [{ value: 'LOVE' }] })
        .success,
    ).toBe(false);
    expect(
      publicRoomStateSchema.safeParse({ ...fixtures.lobbyRoom, invitationTokenHash: 'hash' })
        .success,
    ).toBe(false);
    expect(
      publicRoomStateSchema.safeParse({ ...fixtures.lobbyRoom, randomSeed: 'seed' }).success,
    ).toBe(false);
  });

  it('uses only stable API error codes', () => {
    expect(apiErrorCodeSchema.safeParse('INVALID_INVITE').success).toBe(true);
    expect(apiErrorCodeSchema.safeParse('DATABASE_TIMEOUT').success).toBe(false);
  });

  it('keeps all fixtures schema-conformant', () => {
    expect(publicRoomStateSchema.safeParse(fixtures.lobbyRoom).success).toBe(true);
    expect(publicRoomStateSchema.safeParse(fixtures.votingRoom).success).toBe(true);
    expect(publicRoomStateSchema.safeParse(fixtures.decidedRoom).success).toBe(true);
    expect(apiErrorSchema.safeParse(fixtures.safeApiError).success).toBe(true);
  });
});
