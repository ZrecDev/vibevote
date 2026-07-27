import { describe, expect, it } from 'vitest';
import {
  apiErrorSchema,
  apiErrorCodeSchema,
  bootstrapSessionResponseSchema,
  createInvitationResponseSchema,
  createSessionRequestSchema,
  finalResultResponseSchema,
  fixtures,
  joinSessionRequestSchema,
  publicRoomStateSchema,
  sessionStatusSchema,
  submitPrivateBallotRequestSchema,
  updateReadinessRequestSchema,
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

  it('keeps invitation sharing responses safe and host-scoped', () => {
    const invitation = {
      id: '550e8400-e29b-41d4-a716-446655440020',
      sessionId: fixtures.lobbyRoom.session.id,
      inviteUrl: 'https://app.example.test/join?invite=raw-share-token',
      expiresAt: null,
      status: 'ACTIVE',
    };
    expect(createInvitationResponseSchema.safeParse({ invitation }).success).toBe(true);
    expect(
      createInvitationResponseSchema.safeParse({
        invitation: { ...invitation, invitationTokenHash: 'a'.repeat(64) },
      }).success,
    ).toBe(false);
  });

  it('accepts a participant readiness update and rejects extra capability claims', () => {
    expect(updateReadinessRequestSchema.safeParse({ readiness: 'READY' }).success).toBe(true);
    expect(
      updateReadinessRequestSchema.safeParse({ readiness: 'READY', canStartVoting: true }).success,
    ).toBe(false);
  });

  it('accepts complete unique private ballot entries without making them public state', () => {
    const ballots = fixtures.lobbyRoom.session.options.map((option, index) => ({
      optionId: option.id,
      value: index === 0 ? 'LOVE' : 'FINE',
    }));
    expect(submitPrivateBallotRequestSchema.safeParse({ ballots }).success).toBe(true);
    expect(
      submitPrivateBallotRequestSchema.safeParse({ ballots: [...ballots, ballots[0]] }).success,
    ).toBe(false);
    expect(publicRoomStateSchema.safeParse({ ...fixtures.votingRoom, ballots }).success).toBe(
      false,
    );
  });

  it('accepts a safe immutable result receipt and rejects private decision material', () => {
    const result = {
      id: '550e8400-e29b-41d4-a716-446655440021',
      sessionId: fixtures.decidedRoom.session.id,
      winnerOptionId: fixtures.decidedRoom.session.options[0]!.id,
      method: 'BEST_FIT',
      explanation: 'North Star Cafe is the group result.',
      finalizedAt: '2026-07-24T18:00:00.000Z',
    };
    expect(finalResultResponseSchema.safeParse({ result }).success).toBe(true);
    expect(
      finalResultResponseSchema.safeParse({ result: { ...result, randomSeed: 'secret' } }).success,
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
