'use client';

import { useState } from 'react';
import type {
  HostRoomState,
  ParticipantReadiness,
  ParticipantRoomState,
} from '@vibevote/contracts';
import { Button, Card } from '@/components/ui';
import {
  createInvitation,
  SessionClientError,
  startLobbyVoting,
  submitPrivateBallot,
  finalizeDecision,
  updateCurrentReadiness,
} from '@/features/session/session-client';
import { ParticipantList } from './room-components';

type LobbyRoom = HostRoomState | ParticipantRoomState;

export function LobbyScreen({
  room,
  isHost,
  onRefresh,
}: {
  room: LobbyRoom;
  isHost: boolean;
  onRefresh?: () => void;
}) {
  const [participants, setParticipants] = useState(room.participants);
  const [inviteUrl, setInviteUrl] = useState<string>();
  const [pending, setPending] = useState<'invite' | 'readiness' | undefined>();
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState<string>();
  const [votes, setVotes] = useState<Record<string, 'LOVE' | 'FINE' | 'PASS' | 'VETO'>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(room.result);
  const currentParticipant = participants.find(
    (participant) => participant.id === room.currentParticipantId,
  );

  async function changeReadiness(readiness: ParticipantReadiness) {
    setPending('readiness');
    setMessage(undefined);
    try {
      const response = await updateCurrentReadiness(room.session.id, readiness);
      setParticipants((current) =>
        current.map((participant) =>
          participant.id === response.participant.id ? response.participant : participant,
        ),
      );
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
      setMessage('Copy the invitation link from the field below.');
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
  async function submitVotes() {
    setSubmitting(true);
    setMessage(undefined);
    try {
      const progress = await submitPrivateBallot(room.session.id, {
        ballots: room.session.options.map((option) => ({
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
    try {
      setResult((await finalizeDecision(room.session.id)).result);
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

  return (
    <div className="stack">
      <section className="hero-card card">
        <span className="status-pill">{room.session.status.toLowerCase()}</span>
        <h1 className="room-title">{room.session.title}</h1>
        <p className="lede">Find the choice the group can genuinely get behind.</p>
        <div className="room-meta">
          <span>Best Fit</span>
          <span>{room.session.options.length} options</span>
          <span>{room.participants.length} people</span>
        </div>
      </section>
      <div className="stack stack--two">
        <Card>
          <div className="section-heading">
            <div>
              <p className="eyebrow">People in the room</p>
              <h2>Readiness is shared.</h2>
              <p className="muted">Votes are never visible.</p>
            </div>
            <span className="status-pill">{room.participants.length}</span>
          </div>
          <ParticipantList participants={participants} />
          {currentParticipant && room.session.status === 'LOBBY' && (
            <div className="row">
              <Button
                disabled={pending === 'readiness'}
                onClick={() =>
                  void changeReadiness(
                    currentParticipant.readiness === 'READY' ? 'WAITING' : 'READY',
                  )
                }
              >
                {currentParticipant.readiness === 'READY' ? 'I need more time' : 'I am ready'}
              </Button>
            </div>
          )}
        </Card>
      </div>
      {isHost && room.session.status === 'LOBBY' && (
        <Card>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Invite the group</p>
              <h2>Share one active invitation.</h2>
            </div>
            <Button disabled={pending === 'invite'} onClick={() => void shareInvitation()}>
              {pending === 'invite' ? 'Creating invite…' : 'Create share link'}
            </Button>
          </div>
          {inviteUrl && (
            <div className="stack">
              <label htmlFor="active-invitation">Active invitation</label>
              <input id="active-invitation" className="input" value={inviteUrl} readOnly />
              <div className="row">
                <Button variant="secondary" onClick={() => void copyInvitation()}>
                  Copy invitation link
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
      <Card>
        <div className="section-heading">
          <div>
            <p className="eyebrow">The short list</p>
            <h2>Everyone considers the same options.</h2>
          </div>
        </div>
        {room.session.options.map((option) => (
          <div className="option-line" key={option.id}>
            <span className="option-number">{option.order + 1}</span>
            <strong>{option.label}</strong>
          </div>
        ))}
      </Card>
      {room.session.status === 'VOTING' && !result && (
        <Card>
          <p className="eyebrow">Private ballot</p>
          <h2>Your preferences stay private.</h2>
          {room.session.options.map((option) => (
            <div className="option-line" key={`vote-${option.id}`}>
              <strong>{option.label}</strong>
              <select
                aria-label={`${option.label} vote`}
                value={votes[option.id] ?? 'PASS'}
                onChange={(event) =>
                  setVotes((current) => ({
                    ...current,
                    [option.id]: event.target.value as 'LOVE' | 'FINE' | 'PASS' | 'VETO',
                  }))
                }
              >
                <option value="LOVE">Love</option>
                <option value="FINE">Fine</option>
                <option value="PASS">Pass</option>
                <option value="VETO">Veto</option>
              </select>
            </div>
          ))}
          <Button disabled={submitting} onClick={() => void submitVotes()}>
            {submitting ? 'Submitting…' : 'Submit private ballot'}
          </Button>
          {isHost && (
            <Button variant="secondary" disabled={submitting} onClick={() => void finalize()}>
              Finalize decision
            </Button>
          )}
        </Card>
      )}
      {result && (
        <Card>
          <p className="eyebrow">Decision locked</p>
          <h2>
            {room.session.options.find((option) => option.id === result.winnerOptionId)?.label ??
              'Your result'}
          </h2>
          <p>{result.explanation}</p>
        </Card>
      )}
      {message && <p role="status">{message}</p>}
      <div className="row">
        {isHost && room.session.status === 'LOBBY' && (
          <Button disabled={starting} onClick={() => void startVoting()}>
            {starting ? 'Starting voting…' : 'Start voting'}
          </Button>
        )}
      </div>
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
    loading: ['⌛', 'Getting your room ready', 'Just a moment while the room takes shape.'],
    error: [
      '!',
      'We could not load this room',
      'Nothing was changed. Try again when you are ready.',
    ],
    disconnected: [
      '↻',
      'Reconnecting to your room',
      'We will refresh shared readiness and progress when the connection returns.',
    ],
    empty: ['+', 'No options yet', 'Add at least two options before inviting the group.'],
  }[kind];
  return (
    <Card className="state-panel">
      <div>
        {kind === 'loading' ? (
          <div className="skeleton" aria-hidden="true" />
        ) : (
          <div className="state-icon" aria-hidden="true">
            {content[0]}
          </div>
        )}
        <p className="eyebrow">{kind === 'disconnected' ? 'Connection paused' : 'Room status'}</p>
        <h1 className="room-title" role={kind === 'loading' ? 'status' : undefined}>
          {content[1]}
        </h1>
        <p className="muted">{content[2]}</p>
        {kind !== 'loading' && (
          <Button onClick={kind === 'empty' ? undefined : onRetry}>
            {kind === 'empty' ? 'Add an option' : 'Try again'}
          </Button>
        )}
      </div>
    </Card>
  );
}
