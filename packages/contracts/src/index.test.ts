import { describe, expect, it } from 'vitest';
import { decisionCategorySchema, publicRoomStateSchema } from '.';
const id = '550e8400-e29b-41d4-a716-446655440000';
describe('provisional contracts', () => {
  it('parses a valid public room state', () => {
    expect(
      publicRoomStateSchema.safeParse({
        session: {
          id,
          category: 'EAT',
          mode: 'BEST_FIT',
          status: 'LOBBY',
          title: 'Dinner',
          options: [
            { id, label: 'Cafe', order: 0, eligible: true },
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              label: 'Bistro',
              order: 1,
              eligible: true,
            },
          ],
        },
        participants: [{ id, displayName: 'Sam', isHost: true, ready: false }],
        finishedParticipantCount: 0,
      }).success,
    ).toBe(true);
  });
  it('rejects invalid enums and missing required fields', () => {
    expect(decisionCategorySchema.safeParse('SPORTS').success).toBe(false);
    expect(publicRoomStateSchema.safeParse({}).success).toBe(false);
  });
  it('does not permit private vote fields', () => {
    expect(
      publicRoomStateSchema.safeParse({
        session: {
          id,
          category: 'EAT',
          mode: 'BEST_FIT',
          status: 'LOBBY',
          title: 'Dinner',
          options: [
            { id, label: 'Cafe', order: 0, eligible: true },
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              label: 'Bistro',
              order: 1,
              eligible: true,
            },
          ],
        },
        participants: [],
        finishedParticipantCount: 0,
        votes: [{ value: 'LOVE' }],
      }).success,
    ).toBe(true);
    expect(Object.keys(publicRoomStateSchema.shape)).not.toContain('votes');
  });
});
