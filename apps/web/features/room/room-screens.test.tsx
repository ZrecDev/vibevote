import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { fixtures } from '@vibevote/contracts';
import { LobbyScreen } from './room-screens';

const {
  createInvitation,
  startLobbyVoting,
  updateCurrentReadiness,
  submitPrivateBallot,
  finalizeDecision,
} = vi.hoisted(() => ({
  createInvitation: vi.fn(),
  startLobbyVoting: vi.fn(),
  updateCurrentReadiness: vi.fn(),
  submitPrivateBallot: vi.fn(),
  finalizeDecision: vi.fn(),
}));
vi.mock('@/features/session/session-client', () => ({
  createInvitation,
  startLobbyVoting,
  updateCurrentReadiness,
  submitPrivateBallot,
  finalizeDecision,
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
    startLobbyVoting.mockReset();
    updateCurrentReadiness.mockReset();
    submitPrivateBallot.mockReset();
    finalizeDecision.mockReset();
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

  it('lets a ready host request the guarded server transition and refresh the room', async () => {
    startLobbyVoting.mockResolvedValue({
      session: { ...host, session: { ...host.session, status: 'VOTING' } },
    });
    const onRefresh = vi.fn();
    render(<LobbyScreen room={host} isHost onRefresh={onRefresh} />);
    fireEvent.click(screen.getByRole('button', { name: /^start voting$/i }));
    await waitFor(() => expect(startLobbyVoting).toHaveBeenCalledWith(host.session.id));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('submits a complete private ballot and lets only the host finalize the server result', async () => {
    const votingHost = { ...host, session: { ...host.session, status: 'VOTING' as const } };
    submitPrivateBallot.mockResolvedValue({
      progress: { participantCount: 2, finishedParticipantCount: 1 },
    });
    finalizeDecision.mockResolvedValue({
      result: {
        id: '550e8400-e29b-41d4-a716-446655440099',
        sessionId: host.session.id,
        winnerOptionId: host.session.options[0]!.id,
        method: 'BEST_FIT',
        explanation:
          'Selected from aggregate private preferences; individual ballots are never revealed.',
        finalizedAt: '2026-07-28T00:00:00.000Z',
      },
    });
    render(<LobbyScreen room={votingHost} isHost />);
    fireEvent.change(screen.getByLabelText(`${host.session.options[0]!.label} vote`), {
      target: { value: 'LOVE' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit private ballot/i }));
    await waitFor(() =>
      expect(submitPrivateBallot).toHaveBeenCalledWith(
        host.session.id,
        expect.objectContaining({ ballots: expect.any(Array) }),
      ),
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 of 2 people have finished.');
    fireEvent.click(screen.getByRole('button', { name: /finalize decision/i }));
    await screen.findByText('Decision locked');
    expect(screen.getByRole('heading', { name: host.session.options[0]!.label })).toBeVisible();
    expect(screen.queryByRole('button', { name: /submit private ballot/i })).toBeNull();

    const { unmount } = render(
      <LobbyScreen
        room={{ ...votingHost, currentParticipantId: guest.currentParticipantId }}
        isHost={false}
      />,
    );
    expect(screen.queryByRole('button', { name: /finalize decision/i })).toBeNull();
    unmount();
  });
});
