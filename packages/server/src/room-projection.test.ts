import { describe, expect, it } from 'vitest';
import { projectHostRoom, projectParticipantRoom, type SafeRoomRows } from './room-projection';

const rows: SafeRoomRows = {
  session: {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Dinner',
    category: 'EAT',
    mode: 'BEST_FIT',
    status: 'LOBBY',
  },
  options: [
    { id: '22222222-2222-4222-8222-222222222222', label: 'Second', position: 1, eligible: true },
    { id: '33333333-3333-4333-8333-333333333333', label: 'First', position: 0, eligible: true },
  ],
  participants: [
    {
      id: '44444444-4444-4444-8444-444444444444',
      display_name: 'Host',
      role: 'HOST',
      readiness: 'READY',
    },
    {
      id: '55555555-5555-4555-8555-555555555555',
      display_name: 'Guest',
      role: 'GUEST',
      readiness: 'WAITING',
    },
  ],
  currentParticipantId: '44444444-4444-4444-8444-444444444444',
};

describe('safe room projection', () => {
  it('projects ordered public room state without credential fields', () => {
    const room = projectParticipantRoom(rows);

    expect(room.session.options.map((option) => option.label)).toEqual(['First', 'Second']);
    expect(room.finishedParticipantCount).toBe(1);
    expect(JSON.stringify(room)).not.toMatch(/token|hash|seed/i);
  });

  it('adds only host capability hints to the host projection', () => {
    const room = projectHostRoom(rows);

    expect(room.hostControls).toEqual({ canStartVoting: true, canCancelSession: true });
  });
});
