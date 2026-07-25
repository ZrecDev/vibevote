import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { fixtures } from '@vibevote/contracts';
import { RoomBootstrap } from './room-bootstrap';

const { bootstrapSession } = vi.hoisted(() => ({ bootstrapSession: vi.fn() }));
vi.mock('@/features/session/session-client', () => ({
  bootstrapSession,
  SessionClientError: class SessionClientError extends Error {},
}));

const host = {
  kind: 'HOST' as const,
  session: {
    ...fixtures.lobbyRoom,
    currentParticipantId: fixtures.lobbyRoom.participants[0]!.id,
    hostControls: { canStartVoting: true, canCancelSession: false },
  },
};
const guest = {
  kind: 'GUEST' as const,
  session: { ...fixtures.lobbyRoom, currentParticipantId: fixtures.lobbyRoom.participants[1]!.id },
};

describe('RoomBootstrap', () => {
  beforeEach(() => bootstrapSession.mockReset());

  it('loads the route ID and renders host controls only for a HOST response', async () => {
    bootstrapSession.mockResolvedValue(host);
    render(<RoomBootstrap sessionId={host.session.session.id} />);
    expect(screen.getByRole('status')).toHaveTextContent(/getting your room ready/i);
    await waitFor(() => expect(bootstrapSession).toHaveBeenCalledWith(host.session.session.id));
    expect(await screen.findByRole('button', { name: /start voting/i })).toBeDisabled();
  });

  it('removes prior host controls after a GUEST route response', async () => {
    bootstrapSession.mockResolvedValueOnce(host).mockResolvedValueOnce(guest);
    const { rerender } = render(<RoomBootstrap sessionId="host-session" />);
    await screen.findByRole('button', { name: /start voting/i });
    rerender(<RoomBootstrap sessionId="guest-session" />);
    await waitFor(() => expect(bootstrapSession).toHaveBeenLastCalledWith('guest-session'));
    await waitFor(() => expect(screen.queryByRole('button', { name: /start voting/i })).toBeNull());
  });

  it('shows safe errors and retries with a fresh request that replaces failure state', async () => {
    bootstrapSession
      .mockRejectedValueOnce(new Error('internal database error'))
      .mockResolvedValueOnce(guest);
    render(<RoomBootstrap sessionId="not-a-secret" />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i);
    expect(screen.queryByText(/database/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(bootstrapSession).toHaveBeenCalledTimes(2));
    await screen.findByText(guest.session.session.title);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
