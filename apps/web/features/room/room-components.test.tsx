import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrivateBallot, VotingProgress, ParticipantList } from './room-components';
import { MockResultScreen } from './mock-result-screen';
import { RoomState } from './room-screens';

describe('mock room experience', () => {
  it('renders contract-backed participant role and readiness states', () => {
    render(<ParticipantList />);
    expect(screen.getAllByText('Ready')).toHaveLength(2);
    expect(screen.getByText('Waiting')).toBeInTheDocument();
  });

  it('presents private voting without exposing individual choices in progress', () => {
    render(
      <>
        <PrivateBallot />
        <VotingProgress />
      </>,
    );
    expect(screen.getByText(/only progress is shared/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    expect(screen.getByText(/2 of 3 people have finished/i)).toBeInTheDocument();
    expect(screen.queryByText('Maya voted Love It')).not.toBeInTheDocument();
  });

  it('supports keyboard focus and presents a veto control', () => {
    render(<PrivateBallot />);
    const veto = screen.getAllByRole('button', { name: /veto: cannot do/i })[0]!;
    veto.focus();
    expect(veto).toHaveFocus();
    fireEvent.click(veto);
    expect(veto).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders winner explanation and backup option', () => {
    render(<MockResultScreen />);
    expect(screen.getByRole('heading', { name: /why this won/i })).toBeInTheDocument();
    expect(screen.getByText(/strongest eligible option/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /backup option/i })).toBeInTheDocument();
  });

  it.each(['loading', 'error'] as const)('renders the %s state', (kind) => {
    render(<RoomState kind={kind} />);
    expect(
      screen.getByText(
        kind === 'loading' ? /getting your room ready/i : /could not load this room/i,
      ),
    ).toBeInTheDocument();
  });

  it('includes a compact viewport layout for 390px screens', () => {
    const styles = readFileSync(resolve(process.cwd(), 'apps/web/app/globals.css'), 'utf8');
    expect(styles).toContain('@media (max-width: 390px)');
    expect(styles).toContain('.invite-layout {\n    grid-template-columns: 1fr;\n  }');
  });
});
