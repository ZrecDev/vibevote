'use client';

import { useState } from 'react';
import type { Participant, VoteValue } from '@vibevote/contracts';
import { Button, Card } from '@/components/ui';
import { mockInvite, mockRoom } from './mock-room';

export function ParticipantList({
  participants = mockRoom.participants,
}: {
  participants?: Participant[];
}) {
  return (
    <div aria-label="Participants">
      {participants.map((participant) => {
        const isHost = participant.role === 'HOST';
        const isReady = participant.readiness === 'READY';
        return (
          <div className="participant" key={participant.id}>
            <div className="row">
              <div className="avatar" aria-hidden="true">
                {participant.displayName[0]}
              </div>
              <div>
                <strong>
                  {participant.displayName} {isHost && <span className="muted">· host</span>}
                </strong>
                <div className="muted" style={{ fontSize: '.8rem' }}>
                  {isHost ? 'Started this room' : 'Here for the decision'}
                </div>
              </div>
            </div>
            <span className={isReady ? 'ready' : 'waiting'}>{isReady ? 'Ready' : 'Waiting'}</span>
          </div>
        );
      })}
    </div>
  );
}

export function InviteCard() {
  const [copied, setCopied] = useState(false);
  return (
    <Card>
      <div className="invite-layout">
        <div>
          <p className="eyebrow">Invite the group</p>
          <h2>One link. No accounts.</h2>
          <p className="muted">Share this mock room with anyone who should have a say.</p>
          <div className="invite-code">{mockInvite}</div>
          <div className="row" style={{ marginTop: '.65rem' }}>
            <Button variant="secondary" onClick={() => setCopied(true)}>
              {copied ? 'Link copied' : 'Copy invite link'}
            </Button>
            <span className="muted" style={{ fontSize: '.8rem' }}>
              Mock only
            </span>
          </div>
        </div>
        <div className="qr" aria-label="QR code placeholder">
          SCAN
          <br />
          TO JOIN
        </div>
      </div>
    </Card>
  );
}

const voteLabels: Array<{ value: VoteValue; label: string; description: string }> = [
  { value: 'LOVE', label: 'Love it', description: 'A top choice' },
  { value: 'FINE', label: 'Fine', description: 'Works for me' },
  { value: 'PASS', label: 'Pass', description: 'Rather not' },
  { value: 'VETO', label: 'Veto', description: 'Cannot do' },
];

export function PrivateBallot() {
  const [votes, setVotes] = useState<Record<string, VoteValue>>({});
  const [submitted, setSubmitted] = useState(false);
  const complete = Object.keys(votes).length === mockRoom.session.options.length;
  if (submitted)
    return (
      <Card className="state-panel">
        <div>
          <div className="state-icon" aria-hidden="true">
            ✓
          </div>
          <p className="eyebrow">Ballot saved</p>
          <h1 className="room-title">Your vote stays yours.</h1>
          <p className="muted">
            The room only sees that you have finished. Your choices and any veto remain private.
          </p>
        </div>
      </Card>
    );
  return (
    <div className="stack">
      <Card>
        <p className="eyebrow">Private ballot</p>
        <h1 className="room-title">Choose what works for you.</h1>
        <div className="privacy-note">
          <strong aria-hidden="true">⌁</strong>
          <span>
            <strong>Only progress is shared.</strong>
            <br />
            No one can see your individual votes or whether you used a veto.
          </span>
        </div>
      </Card>
      {mockRoom.session.options.map((option) => (
        <Card className="vote-option" key={option.id}>
          <h2>{option.label}</h2>
          <p className="muted" style={{ fontSize: '.84rem', marginBottom: 0 }}>
            How does this option feel?
          </p>
          <div className="vote-controls" role="group" aria-label={`Vote for ${option.label}`}>
            {voteLabels.map((vote) => (
              <Button
                key={vote.value}
                variant="secondary"
                className={`${votes[option.id] === vote.value ? 'vote-choice' : ''} ${vote.value === 'VETO' ? 'vote-veto' : ''}`}
                aria-pressed={votes[option.id] === vote.value}
                aria-label={`${vote.label}: ${vote.description}`}
                onClick={() => setVotes((current) => ({ ...current, [option.id]: vote.value }))}
              >
                {vote.label}
              </Button>
            ))}
          </div>
        </Card>
      ))}
      <Button disabled={!complete} onClick={() => setSubmitted(true)}>
        Submit private ballot
      </Button>
      {!complete && (
        <p className="muted" role="status">
          Choose one visible response for each option to submit.
        </p>
      )}
    </div>
  );
}

export function VotingProgress({
  finished = mockRoom.finishedParticipantCount,
  total = mockRoom.participants.length,
}: {
  finished?: number;
  total?: number;
}) {
  const percentage = Math.round((finished / total) * 100);
  return (
    <Card>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Room update</p>
          <h2>Votes are coming in</h2>
          <p className="progress-copy" aria-live="polite">
            {finished} of {total} people have finished.
          </p>
        </div>
        <span className="status-pill">Private</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Voting progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={finished}
      >
        <div className="progress-bar" style={{ width: `${percentage}%` }} />
      </div>
      <p className="muted" style={{ marginBottom: 0, fontSize: '.8rem' }}>
        We only show the group’s finished count—never individual ballots.
      </p>
    </Card>
  );
}
