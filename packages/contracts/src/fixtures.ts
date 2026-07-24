import type { ApiError, PublicRoomState } from './index';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const hostId = '550e8400-e29b-41d4-a716-446655440001';
const guestId = '550e8400-e29b-41d4-a716-446655440002';

const customOptions = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    label: 'North Star Cafe',
    order: 0,
    eligible: true,
  },
  { id: '550e8400-e29b-41d4-a716-446655440011', label: 'Green Bowl', order: 1, eligible: true },
];

const participants = [
  { id: hostId, displayName: 'Alex', role: 'HOST' as const, readiness: 'READY' as const },
  { id: guestId, displayName: 'Sam', role: 'GUEST' as const, readiness: 'WAITING' as const },
];

export const fixtures: {
  lobbyRoom: PublicRoomState;
  votingRoom: PublicRoomState;
  decidedRoom: PublicRoomState;
  safeApiError: ApiError;
} = {
  lobbyRoom: {
    session: {
      id: sessionId,
      category: 'CUSTOM',
      mode: 'BEST_FIT',
      status: 'LOBBY',
      title: 'Friday dinner',
      options: customOptions,
    },
    participants,
    finishedParticipantCount: 0,
    result: null,
  },
  votingRoom: {
    session: {
      id: sessionId,
      category: 'CUSTOM',
      mode: 'BEST_FIT',
      status: 'VOTING',
      title: 'Friday dinner',
      options: customOptions,
    },
    participants,
    finishedParticipantCount: 1,
    result: null,
  },
  decidedRoom: {
    session: {
      id: sessionId,
      category: 'CUSTOM',
      mode: 'BEST_FIT',
      status: 'DECIDED',
      title: 'Friday dinner',
      options: customOptions,
    },
    participants,
    finishedParticipantCount: 2,
    result: {
      winnerOptionId: customOptions[0]!.id,
      method: 'BEST_FIT',
      explanation: 'North Star Cafe is the group result.',
      finalizedAt: '2026-07-24T18:00:00.000Z',
    },
  },
  safeApiError: {
    ok: false,
    error: { code: 'INVALID_INVITE', message: 'This invitation is not valid.', retryable: false },
  },
};
