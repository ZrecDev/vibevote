'use client';

import { useState } from 'react';
import type { Participant, VoteValue } from '@vibevote/contracts';
import { Button, Card } from '@/components/ui';
import { mockInvite, mockRoom } from './mock-room';

export function ParticipantList({ participants = mockRoom.participants }: { participants?: Participant[] }) {
  return <div aria-label="Participants">{participants.map((participant) => { const isHost = participant.role === 'HOST'; const isReady = participant.readiness === 'READY'; return <div className="participant" key={participant.id}><div className="row"><div className="avatar" aria-hidden="true">{participant.displayName[0]}</div><div><strong>{participant.displayName} {isHost && <span className="muted">(host)</span>}</strong><div className="muted" style={{ fontSize: '.8rem' }}>{isHost ? 'Started this decision' : 'In the room'}</div></div></div><span className={isReady ? 'ready' : 'waiting'}>{isReady ? 'Ready' : 'Waiting'}</span></div>; })}</div>;
}

export function InviteCard() {
  const [copied, setCopied] = useState(false);
  return <Card><div className="split"><div><h2>Invite the group</h2><p className="muted">Anyone with this mock link can join with a display name.</p></div><div className="qr" aria-label="QR code placeholder">QR<br />preview</div></div><div className="invite"><div className="invite-code">{mockInvite}</div><Button variant="secondary" onClick={() => setCopied(true)}>{copied ? 'Copied' : 'Copy link'}</Button></div></Card>;
}

const voteLabels: Array<{ value: VoteValue; label: string; description: string }> = [
  { value: 'LOVE', label: 'Love It', description: 'Top choice' }, { value: 'FINE', label: 'Fine With It', description: 'Works for me' },
  { value: 'PASS', label: 'Pass', description: 'Rather not' }, { value: 'VETO', label: 'Veto', description: 'Cannot do' },
];

export function PrivateBallot() {
  const [votes, setVotes] = useState<Record<string, VoteValue>>({});
  const [submitted, setSubmitted] = useState(false);
  const complete = Object.keys(votes).length === mockRoom.session.options.length;
  if (submitted) return <Card><span className="status-pill"><span className="status-dot" />Vote saved</span><h2>Thanks — your ballot is private.</h2><p className="muted">The room only sees that you have finished. Your individual choices and any veto stay private.</p></Card>;
  return <div className="stack"><Card><p className="eyebrow">Private ballot</p><h1 className="room-title">Your voice, privately.</h1><p className="privacy-note">No one else can see your individual votes or whether you used a veto. The room will only see a finished count.</p></Card>{mockRoom.session.options.map((option) => <Card className="vote-option" key={option.id}><h2>{option.label}</h2><div className="vote-controls" role="group" aria-label={`Vote for ${option.label}`}>{voteLabels.map((vote) => <Button key={vote.value} variant="secondary" className={votes[option.id] === vote.value ? 'vote-choice' : ''} aria-pressed={votes[option.id] === vote.value} aria-label={`${vote.label}: ${vote.description}`} onClick={() => setVotes((current) => ({ ...current, [option.id]: vote.value }))}>{vote.label}</Button>)}</div></Card>)}<Button disabled={!complete} onClick={() => setSubmitted(true)}>Submit private votes</Button>{!complete && <p className="muted" role="status">Choose a visible button for each option to submit your ballot.</p>}</div>;
}

export function VotingProgress({ finished = mockRoom.finishedParticipantCount, total = mockRoom.participants.length }: { finished?: number; total?: number }) {
  const percentage = Math.round((finished / total) * 100);
  return <Card><div className="split"><div><h2>Voting in progress</h2><p className="progress-copy" aria-live="polite">{finished} of {total} participants have finished.</p></div><span className="status-pill">Private</span></div><div className="progress-track" role="progressbar" aria-label="Voting progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={finished}><div className="progress-bar" style={{ width: `${percentage}%` }} /></div><p className="muted" style={{ fontSize: '.8rem' }}>Individual choices are never shown here.</p></Card>;
}
