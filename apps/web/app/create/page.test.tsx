import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { fixtures } from '@vibevote/contracts';
import CreatePage from './page';

const { push, createSession } = vi.hoisted(() => ({ push: vi.fn(), createSession: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/features/session/session-client', () => ({
  createSession,
  SessionClientError: class SessionClientError extends Error {},
}));

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Alex' } });
  fireEvent.change(screen.getByLabelText('What are you deciding?'), {
    target: { value: 'Dinner' },
  });
  fireEvent.change(screen.getByLabelText('Option 1'), { target: { value: 'North Star Cafe' } });
  fireEvent.change(screen.getByLabelText('Option 2'), { target: { value: 'Green Bowl' } });
}

describe('CreatePage', () => {
  beforeEach(() => {
    push.mockReset();
    createSession.mockReset();
  });
  it('validates required fields accessibly and preserves deterministic options', () => {
    render(<CreatePage />);
    fireEvent.click(screen.getByRole('button', { name: /create room/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/complete your name/i);
    fireEvent.click(screen.getByRole('button', { name: /add option/i }));
    expect(screen.getByLabelText('Option 3')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]!);
    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Your name')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Your name')).toHaveAttribute('aria-describedby', 'create-error');
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent(
      'EATDOWATCHCUSTOM',
    );
    expect(screen.getByRole('combobox', { name: 'Decision mode' })).toHaveTextContent(
      'INSTANT_MATCHBEST_FITCHAOS',
    );
  });

  it('enforces the twelve-option limit while retaining the two-option minimum', () => {
    render(<CreatePage />);
    for (let index = 3; index <= 12; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: /add option/i }));
      expect(screen.getByLabelText(`Option ${index}`)).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: /add option/i })).toBeNull();
    for (let index = 0; index < 10; index += 1) {
      fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]!);
    }
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull();
    expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
  });
  it('submits the contract payload once and navigates with the returned ID', async () => {
    createSession.mockResolvedValue({ session: { session: fixtures.lobbyRoom.session } });
    render(<CreatePage />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'EAT' } });
    fireEvent.change(screen.getByLabelText('Decision mode'), { target: { value: 'CHAOS' } });
    fireEvent.click(screen.getByRole('button', { name: /create room/i }));
    await waitFor(() => expect(createSession).toHaveBeenCalledTimes(1));
    expect(createSession).toHaveBeenCalledWith({
      hostDisplayName: 'Alex',
      title: 'Dinner',
      category: 'EAT',
      mode: 'CHAOS',
      options: [{ label: 'North Star Cafe' }, { label: 'Green Bowl' }],
    });
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(`/room/${fixtures.lobbyRoom.session.id}`),
    );
  });
  it('prevents repeated submit events before React rerenders', async () => {
    let resolveCreate!: (value: {
      session: { session: typeof fixtures.lobbyRoom.session };
    }) => void;
    createSession.mockReturnValue(new Promise((resolve) => (resolveCreate = resolve)));
    render(<CreatePage />);
    fillValidForm();
    const form = screen.getByRole('button', { name: /create room/i }).closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(createSession).toHaveBeenCalledTimes(1);
    resolveCreate({ session: { session: fixtures.lobbyRoom.session } });
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
  });
  it('keeps input and exposes safe recoverable failures', async () => {
    createSession.mockRejectedValue(new Error('internal secret'));
    render(<CreatePage />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /create room/i }));
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i),
    );
    expect(screen.getByLabelText('Your name')).toHaveValue('Alex');
    expect(screen.queryByText(/internal secret/i)).not.toBeInTheDocument();
  });
});
