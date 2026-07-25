import type { PublicRoomState, ResultSummary } from '@vibevote/contracts';

export const mockRoom: PublicRoomState = {
  session: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    category: 'EAT',
    mode: 'BEST_FIT',
    status: 'LOBBY',
    title: 'Friday night dinner',
    options: [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        label: 'Juniper & Rye',
        order: 0,
        eligible: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        label: 'Luna Noodle House',
        order: 1,
        eligible: true,
      },
      { id: '550e8400-e29b-41d4-a716-446655440003', label: 'Pasta Fino', order: 2, eligible: true },
    ],
  },
  participants: [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      displayName: 'Maya',
      role: 'HOST',
      readiness: 'READY',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      displayName: 'Jordan',
      role: 'GUEST',
      readiness: 'READY',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      displayName: 'You',
      role: 'GUEST',
      readiness: 'WAITING',
    },
  ],
  finishedParticipantCount: 2,
  result: null,
};

export const mockResult: ResultSummary = {
  winnerOptionId: mockRoom.session.options[0]!.id,
  method: 'BEST_FIT',
  explanation:
    'Juniper & Rye is the strongest eligible option across the group. It cleared every hard constraint and received broad support.',
  finalizedAt: '2026-07-24T19:30:00.000Z',
};

export const mockInvite = 'vibevote.example/join/friday-dinner';
