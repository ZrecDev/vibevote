import type { PublicRoomState } from '@vibevote/contracts';
import { Button, Card } from '@/components/ui';
import { ParticipantList } from './room-components';

export function LobbyScreen({ room, isHost }: { room: PublicRoomState; isHost: boolean }) {
  return (
    <div className="stack">
      <section className="hero-card card">
        <span className="status-pill">Room lobby</span>
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
          <ParticipantList participants={room.participants} />
        </Card>
      </div>
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
      <div className="row">{isHost && <Button disabled>Start voting (coming soon)</Button>}</div>
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
