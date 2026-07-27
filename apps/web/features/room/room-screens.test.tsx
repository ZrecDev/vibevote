import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { fixtures } from '@vibevote/contracts';
import { LobbyScreen } from './room-screens';

const { createInvitation, updateCurrentReadiness } = vi.hoisted(() => ({
  createInvitation: vi.fn(),
  updateCurrentReadiness: vi.fn(),
}));
vi.mock('@/features/session/session-client', () => ({
  createInvitation,
  updateCurrentReadiness,
  SessionClientError: class SessionClientError extends Error {},
}));

const host = {
  ...fixtures.lobbyRoom,
  currentParticipantId: fixtures.lobbyRoom.participants[0]!.id,
  hostControls: { canStartVoting: true, canCancelSession: false },
};
const guest = {
  ...fixtures.lobbyRoom,
  currentParticipantId: fixtures.lobbyRoom.participants[1]!.id,
};

describe('LobbyScreen invitation and readiness controls', () => {
  beforeEach(() => {
    createInvitation.mockReset();
    updateCurrentReadiness.mockReset();
  });

  it('keeps sharing host-only and lets a participant update only their own readiness', async () => {
    createInvitation.mockResolvedValue({
      invitation: {
        id: '550e8400-e29b-41d4-a716-446655440020',
        sessionId: host.session.id,
        inviteUrl: 'https://app.example.test/join?invite=share-token',
        expiresAt: '2026-07-28T00:00:00.000Z',
        status: 'ACTIVE',
      },
    });
    updateCurrentReadiness.mockResolvedValue({
      participant: { ...host.participants[0], readiness: 'WAITING' },
    });
    render(<LobbyScreen room={host} isHost />);
    fireEvent.click(screen.getByRole('button', { name: /create share link/i }));
    await screen.findByDisplayValue(/invite=share-token/);
    expect(createInvitation).toHaveBeenCalledWith(host.session.id);
    fireEvent.click(screen.getByRole('button', { name: /i need more time/i }));
    await waitFor(() =>
      expect(updateCurrentReadiness).toHaveBeenCalledWith(host.session.id, 'WAITING'),
    );
    expect(screen.getAllByText('Waiting')).toHaveLength(2);
  });

  it('does not offer host invitation controls to a guest', () => {
    render(<LobbyScreen room={guest} isHost={false} />);
    expect(screen.queryByRole('button', { name: /create share link/i })).toBeNull();
  });
});
