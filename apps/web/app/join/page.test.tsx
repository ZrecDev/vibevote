import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { fixtures } from '@vibevote/contracts';
import JoinPage from './page';

const { push, get, joinSession } = vi.hoisted(() => ({
  push: vi.fn(),
  get: vi.fn(),
  joinSession: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => ({ get }),
}));
vi.mock('@/features/session/session-client', () => ({
  joinSession,
  SessionClientError: class SessionClientError extends Error {},
}));

describe('JoinPage', () => {
  beforeEach(() => {
    push.mockReset();
    get.mockReset();
    get.mockReturnValue('public-invitation');
    joinSession.mockReset();
  });

  it('handles a missing invitation safely', () => {
    get.mockReturnValue(null);
    render(<JoinPage />);
    fireEvent.click(screen.getByRole('button', { name: /join room/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/missing or invalid/i);
    expect(joinSession).not.toHaveBeenCalled();
  });

  it('validates a display name and submits the exact public payload once', async () => {
    joinSession.mockResolvedValue({ session: { session: fixtures.lobbyRoom.session } });
    render(<JoinPage />);
    fireEvent.click(screen.getByRole('button', { name: /join room/i }));
    expect(screen.getByLabelText('Your name')).toHaveAttribute('aria-invalid', 'true');
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Sam' } });
    fireEvent.click(screen.getByRole('button', { name: /join room/i }));
    await waitFor(() =>
      expect(joinSession).toHaveBeenCalledWith({
        inviteToken: 'public-invitation',
        displayName: 'Sam',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: /joining/i }));
    expect(joinSession).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(`/room/${fixtures.lobbyRoom.session.id}`),
    );
  });

  it('renders invalid invitation and network failures without raw server text or persistence', async () => {
    joinSession.mockRejectedValue(new Error('database password'));
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    render(<JoinPage />);
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Sam' } });
    fireEvent.click(screen.getByRole('button', { name: /join room/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i),
    );
    expect(screen.queryByText(/database password/i)).not.toBeInTheDocument();
    expect(storage).not.toHaveBeenCalled();
  });
});
