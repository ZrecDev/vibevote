'use client';

import { useState } from 'react';
import type {
  HostRoomState,
  ParticipantReadiness,
  ParticipantRoomState,
} from '@vibevote/contracts';
import {
  CheckIcon,
  CopyIcon,
  LockIcon,
  RefreshIcon,
  ShareIcon,
  SparkIcon,
  UsersIcon,
  VoteIcon,
} from '@/components/icons';
import { Button, Card } from '@/components/ui';
import {
  createInvitation,
  SessionClientError,
  startLobbyVoting,
  submitPrivateBallot,
  finalizeDecision,
  updateOptionEligibility,
  updateCurrentReadiness,
} from '@/features/session/session-client';
import { ParticipantList } from './room-components';

type LobbyRoom = HostRoomState | ParticipantRoomState;

const modeLabel = {
  INSTANT_MATCH: 'Instant Match',
  BEST_FIT: 'Best Fit',
  CHAOS: 'Chaos Pick',
} as const;

const statusLabel = {
  DRAFT: 'Setting up',
  LOBBY: 'Lobby open',
  VOTING: 'Voting now',
  TIEBREAK: 'Resolving the choice',
  DECIDED: 'Decision made',
  COMPLETED: 'Decision made',
  EXPIRED: 'Room expired',
  FINALIZED: 'Decision made',
  CANCELLED: 'Room closed',
} as const;

export function LobbyScreen({
  room,
  isHost,
  onRefresh,
}: {
  room: LobbyRoom;
  isHost: boolean;
  onRefresh?: () => void;
}) {
  const participants = room.participants;
  const options = room.session.options;
  const [inviteUrl, setInviteUrl] = useState<string>();
  const [pending, setPending] = useState<'invite' | 'readiness' | undefined>();
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState<string>();
  const [votes, setVotes] = useState<Record<string, 'LOVE' | 'FINE' | 'PASS' | 'VETO'>>({});
  const [submitting, setSubmitting] = useState(false);
  const result = room.result;
  const [optionPendingId, setOptionPendingId] = useState<string>();
  const vetoCount = Object.values(votes).filter((value) => value === 'VETO').length;
  const currentParticipant = participants.find(
    (participant) => participant.id === room.currentParticipantId,
  );
  const everyoneReady =
    participants.length >= 2 &&
    participants.every((participant) => participant.readiness === 'READY');

  async function changeReadiness(readiness: ParticipantReadiness) {
    setPending('readiness');
    setMessage(undefined);
    try {
      await updateCurrentReadiness(room.session.id, readiness);
      onRefresh?.();
    } catch (reason) {
      setMessage(
        reason instanceof SessionClientError ? reason.message : 'We could not update readiness.',
      );
    } finally {
      setPending(undefined);
    }
  }

  async function shareInvitation() {
    setPending('invite');
    setMessage(undefined);
    try {
      const response = await createInvitation(room.session.id);
      setInviteUrl(response.invitation.inviteUrl);
    } catch (reason) {
      setMessage(
        reason instanceof SessionClientError
          ? reason.message
          : 'We could not create an invitation.',
      );
    } finally {
      setPending(undefined);
    }
  }

  async function copyInvitation() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setMessage('Invitation link copied.');
    } catch {
      setMessage('Select and copy the invitation link below.');
    }
  }

  async function startVoting() {
    setStarting(true);
    setMessage(undefined);
    try {
      await startLobbyVoting(room.session.id);
      onRefresh?.();
    } catch (reason) {
      setMessage(
        reason instanceof SessionClientError ? reason.message : 'We could not start voting.',
      );
    } finally {
      setStarting(false);
    }
  }

  async function changeEligibility(optionId: string, eligible: boolean) {
    setOptionPendingId(optionId);
    setMessage(undefined);
    try {
      await updateOptionEligibility(room.session.id, optionId, eligible);
      onRefresh?.();
    } catch (reason) {
      setMessage(
        reason instanceof SessionClientError
          ? reason.message
          : 'We could not update this constraint.',
      );
    } finally {
      setOptionPendingId(undefined);
    }
  }

  async function submitVotes() {
    setSubmitting(true);
    setMessage(undefined);
    try {
      const progress = await submitPrivateBallot(room.session.id, {
        ballots: options.map((option) => ({
          optionId: option.id,
          value: votes[option.id] ?? 'PASS',
        })),
      });
      setMessage(
        `${progress.progress.finishedParticipantCount} of ${progress.progress.participantCount} people have finished.`,
      );
    } catch (reason) {
      setMessage(
        reason instanceof SessionClientError ? reason.message : 'We could not submit your ballot.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function finalize() {
    setSubmitting(true);
    setMessage(undefined);
    try {
      await finalizeDecision(room.session.id);
      onRefresh?.();
    } catch (reason) {
      setMessage(
        reason instanceof SessionClientError
          ? reason.message
          : 'We could not finalize this decision.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const lobby = room.session.status === 'LOBBY';
  const voting = room.session.status === 'VOTING' && !result;

  return (
    <div className="room-page">
      <section className="room-hero">
        <div className="room-hero__status">
          <span className="status-pill status-pill--inverted">
            <span className="status-dot" />
            {statusLabel[room.session.status]}
          </span>
          {isHost && <span className="host-badge">You’re hosting</span>}
        </div>
        <h1 className="room-title">{room.session.title}</h1>
        <p>Find the choice the whole group can genuinely get behind.</p>
        <div className="room-meta">
          <span>
            <VoteIcon width="16" height="16" />
            {modeLabel[room.session.mode]}
          </span>
          <span>{options.length} options</span>
          <span>{participants.length} people</span>
        </div>
      </section>

      {result && (
        <section className="winner-card" aria-labelledby="winner-title">
          <span className="winner-spark" aria-hidden="true">
            <SparkIcon width="28" height="28" />
          </span>
          <div>
            <p className="eyebrow">Decision locked</p>
            <h2 id="winner-title">
              {options.find((option) => option.id === result.winnerOptionId)?.label ??
                'Your result'}
            </h2>
            <p>{result.explanation}</p>
          </div>
          <div className="winner-private">
            <LockIcon width="17" height="17" />
            Individual ballots stayed private
          </div>
        </section>
      )}

      <div className="room-layout">
        <div className="stack room-main">
          {voting && (
            <Card className="ballot-card">
              <div className="card-heading">
                <span className="card-icon">
                  <LockIcon />
                </span>
                <div>
                  <p className="eyebrow">Private ballot</p>
                  <h2>How do these options feel?</h2>
                  <p className="muted">
                    {room.session.mode === 'INSTANT_MATCH'
                      ? 'A match needs every person to mark it Love or Fine.'
                      : room.session.mode === 'CHAOS'
                        ? 'Chaos picks fairly from the eligible options the group accepts.'
                        : 'Best Fit balances the group’s aggregate preferences.'}{' '}
                    You have one veto.
                  </p>
                </div>
              </div>
              <div className="ballot-list">
                {options.map((option) => (
                  <div
                    className={`ballot-option ${!option.eligible ? 'is-excluded' : ''}`}
                    key={option.id}
                  >
                    <div className="ballot-option__copy">
                      <strong>{option.label}</strong>
                      {!option.eligible && <span>Excluded by a hard constraint</span>}
                    </div>
                    <select
                      className="select vote-select"
                      aria-label={`${option.label} vote`}
                      value={votes[option.id] ?? 'PASS'}
                      disabled={!option.eligible}
                      onChange={(event) => {
                        const value = event.target.value as 'LOVE' | 'FINE' | 'PASS' | 'VETO';
                        if (value === 'VETO' && votes[option.id] !== 'VETO' && vetoCount >= 1) {
                          setMessage(
                            'You can use one veto. Change your current veto before choosing another.',
                          );
                          return;
                        }
                        setMessage(undefined);
                        setVotes((current) => ({ ...current, [option.id]: value }));
                      }}
                    >
                      <option value="LOVE">Love</option>
                      <option value="FINE">Fine</option>
                      <option value="PASS">Pass</option>
                      <option value="VETO">Veto</option>
                    </select>
                  </div>
                ))}
              </div>
              <div className="ballot-actions">
                <div className="privacy-inline">
                  <LockIcon width="16" height="16" />
                  Only completion progress is shared
                </div>
                <Button disabled={submitting} onClick={() => void submitVotes()}>
                  {submitting ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <CheckIcon width="18" height="18" />
                      Submit private ballot
                    </>
                  )}
                </Button>
                {isHost && (
                  <Button variant="secondary" disabled={submitting} onClick={() => void finalize()}>
                    Finalize decision
                  </Button>
                )}
              </div>
            </Card>
          )}

          <Card className="options-card">
            <div className="card-heading card-heading--split">
              <div>
                <p className="eyebrow">The short list</p>
                <h2>Options everyone considers</h2>
                <p className="muted">The list is shared. Each person’s opinion is not.</p>
              </div>
              <span className="count-pill">
                {options.filter((option) => option.eligible).length} active
              </span>
            </div>
            <div className="room-option-list">
              {options.map((option) => (
                <div
                  className={`room-option ${!option.eligible ? 'is-excluded' : ''}`}
                  key={option.id}
                >
                  <span className="option-number">{String(option.order + 1).padStart(2, '0')}</span>
                  <div className="room-option__label">
                    <strong>{option.label}</strong>
                    {!option.eligible && <span>Excluded</span>}
                  </div>
                  {isHost && lobby && (
                    <Button
                      className="constraint-button"
                      variant="quiet"
                      disabled={optionPendingId === option.id}
                      onClick={() => void changeEligibility(option.id, !option.eligible)}
                    >
                      {optionPendingId === option.id
                        ? 'Saving…'
                        : option.eligible
                          ? 'Exclude'
                          : 'Include'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {isHost && lobby && (
              <p className="constraint-note">
                Exclude anything that fails a hard constraint. At least one option must stay active.
              </p>
            )}
          </Card>
        </div>

        <aside className="stack room-sidebar">
          <Card className="people-card">
            <div className="card-heading card-heading--split">
              <div>
                <p className="eyebrow">In the room</p>
                <h2>
                  {participants.length === 1
                    ? 'Just you, for now'
                    : `${participants.length} people`}
                </h2>
              </div>
              <span className="card-icon card-icon--small">
                <UsersIcon width="18" height="18" />
              </span>
            </div>
            <ParticipantList
              participants={participants}
              currentParticipantId={room.currentParticipantId}
            />
            {currentParticipant && lobby && (
              <Button
                className={`readiness-button ${
                  currentParticipant.readiness === 'READY' ? 'readiness-button--ready' : ''
                }`}
                variant={currentParticipant.readiness === 'READY' ? 'secondary' : 'primary'}
                disabled={pending === 'readiness'}
                onClick={() =>
                  void changeReadiness(
                    currentParticipant.readiness === 'READY' ? 'WAITING' : 'READY',
                  )
                }
              >
                {currentParticipant.readiness === 'READY' ? (
                  <>
                    <CheckIcon width="18" height="18" /> I need more time
                  </>
                ) : (
                  <>
                    <CheckIcon width="18" height="18" /> I am ready
                  </>
                )}
              </Button>
            )}
          </Card>

          {isHost && lobby && (
            <Card className="invite-card">
              <div className="card-heading">
                <span className="card-icon">
                  <ShareIcon />
                </span>
                <div>
                  <p className="eyebrow">Invite the group</p>
                  <h2>Share one secure link</h2>
                  <p className="muted">Creating a new link replaces the previous one.</p>
                </div>
              </div>
              {inviteUrl ? (
                <div className="stack invite-content">
                  <label className="form-label" htmlFor="active-invitation">
                    <span>Active invitation</span>
                    <input
                      id="active-invitation"
                      className="input invite-input"
                      value={inviteUrl}
                      readOnly
                    />
                  </label>
                  <Button variant="secondary" onClick={() => void copyInvitation()}>
                    <CopyIcon width="18" height="18" />
                    Copy invitation link
                  </Button>
                  <Button
                    className="replace-link"
                    variant="quiet"
                    disabled={pending === 'invite'}
                    onClick={() => void shareInvitation()}
                  >
                    Replace this link
                  </Button>
                </div>
              ) : (
                <Button
                  className="button--full"
                  disabled={pending === 'invite'}
                  onClick={() => void shareInvitation()}
                >
                  {pending === 'invite' ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Creating invite…
                    </>
                  ) : (
                    <>
                      <ShareIcon width="18" height="18" />
                      Create share link
                    </>
                  )}
                </Button>
              )}
            </Card>
          )}
        </aside>
      </div>

      {message && (
        <div className="toast-message" role="status">
          <span className="status-dot" />
          {message}
        </div>
      )}

      {isHost && lobby && participants.length >= 2 && (
        <div className="room-action-dock">
          <div>
            <strong>{everyoneReady ? 'Everyone is ready.' : 'Waiting for the room.'}</strong>
            <span>
              {everyoneReady
                ? 'You can start private voting.'
                : `${participants.filter((participant) => participant.readiness === 'READY').length} of ${participants.length} ready`}
            </span>
          </div>
          <Button disabled={starting || !everyoneReady} onClick={() => void startVoting()}>
            {starting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Starting…
              </>
            ) : (
              <>
                <VoteIcon width="18" height="18" />
                Start voting
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export function RoomState({
  kind,
  onRetry,
}: {
  kind: 'loading' | 'error' | 'disconnected' | 'empty';
  onRetry?: () => void;
}) {
  const content = {
    loading: ['Getting your room ready', 'Just a moment while the room takes shape.'],
    error: [
      'We could not load this room',
      'Nothing was changed. Check your connection and try again.',
    ],
    disconnected: [
      'Reconnecting to your room',
      'Shared readiness and progress will refresh when the connection returns.',
    ],
    empty: ['No options yet', 'Add at least two options before inviting the group.'],
  }[kind];

  return (
    <Card className="state-panel">
      <div>
        {kind === 'loading' ? (
          <div className="state-loader" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <div className="state-icon" aria-hidden="true">
            {kind === 'error' ? (
              '!'
            ) : kind === 'empty' ? (
              '+'
            ) : (
              <RefreshIcon width="24" height="24" />
            )}
          </div>
        )}
        <p className="eyebrow">{kind === 'disconnected' ? 'Connection paused' : 'Room status'}</p>
        <h1 className="state-title" role={kind === 'loading' ? 'status' : undefined}>
          {content[0]}
        </h1>
        <p className="muted">{content[1]}</p>
        {kind !== 'loading' && (
          <Button onClick={kind === 'empty' ? undefined : onRetry}>
            {kind === 'empty' ? 'Add an option' : 'Try again'}
          </Button>
        )}
      </div>
    </Card>
  );
}
