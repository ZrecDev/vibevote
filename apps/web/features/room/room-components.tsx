import type { Participant } from '@vibevote/contracts';

export function ParticipantList({
  participants,
  currentParticipantId,
}: {
  participants: Participant[];
  currentParticipantId?: string;
}) {
  return (
    <div className="participant-list" aria-label="Participants">
      {participants.map((participant) => {
        const isHost = participant.role === 'HOST';
        const isReady = participant.readiness === 'READY';
        return (
          <div className="participant" key={participant.id}>
            <div className="participant__identity">
              <div className="avatar" aria-hidden="true">
                {participant.displayName[0]?.toUpperCase()}
              </div>
              <div className="participant__copy">
                <strong>
                  {participant.displayName}
                  {participant.id === currentParticipantId && (
                    <span className="you-label">you</span>
                  )}
                </strong>
                <span>{isHost ? 'Host' : 'Participant'}</span>
              </div>
            </div>
            <span className={isReady ? 'ready' : 'waiting'}>{isReady ? 'Ready' : 'Waiting'}</span>
          </div>
        );
      })}
    </div>
  );
}
