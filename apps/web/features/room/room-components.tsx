import type { Participant } from '@vibevote/contracts';

export function ParticipantList({ participants }: { participants: Participant[] }) {
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
