import {
  hostRoomStateSchema,
  participantRoomStateSchema,
  type HostRoomState,
  type ParticipantRoomState,
} from '@vibevote/contracts';

export type SafeSessionRow = {
  id: string;
  title: string;
  category: string;
  mode: string;
  status: string;
};

export type SafeOptionRow = {
  id: string;
  label: string;
  position: number;
  eligible: boolean;
};

export type SafeParticipantRow = {
  id: string;
  display_name: string;
  role: string;
  readiness: string;
};

export type SafeRoomRows = {
  session: SafeSessionRow;
  options: SafeOptionRow[];
  participants: SafeParticipantRow[];
  currentParticipantId: string;
};

export function projectParticipantRoom(rows: SafeRoomRows): ParticipantRoomState {
  return participantRoomStateSchema.parse({
    session: {
      id: rows.session.id,
      title: rows.session.title,
      category: rows.session.category,
      mode: rows.session.mode,
      status: rows.session.status,
      options: [...rows.options]
        .sort((left, right) => left.position - right.position)
        .map((option) => ({
          id: option.id,
          label: option.label,
          order: option.position,
          eligible: option.eligible,
        })),
    },
    participants: rows.participants.map((participant) => ({
      id: participant.id,
      displayName: participant.display_name,
      role: participant.role,
      readiness: participant.readiness,
    })),
    finishedParticipantCount: rows.participants.filter(
      (participant) => participant.readiness === 'READY',
    ).length,
    result: null,
    currentParticipantId: rows.currentParticipantId,
  });
}

export function projectHostRoom(rows: SafeRoomRows): HostRoomState {
  const participantRoom = projectParticipantRoom(rows);
  return hostRoomStateSchema.parse({
    ...participantRoom,
    hostControls: {
      canStartVoting: participantRoom.session.status === 'LOBBY',
      canCancelSession: ['LOBBY', 'VOTING', 'TIEBREAK'].includes(participantRoom.session.status),
    },
  });
}

export function projectRpcParticipantRoom(room: unknown): ParticipantRoomState {
  return participantRoomStateSchema.parse(room);
}

export function projectRpcHostRoom(room: unknown): HostRoomState {
  const participantRoom = projectRpcParticipantRoom(room);
  return hostRoomStateSchema.parse({
    ...participantRoom,
    hostControls: {
      canStartVoting: participantRoom.session.status === 'LOBBY',
      canCancelSession: ['LOBBY', 'VOTING', 'TIEBREAK'].includes(participantRoom.session.status),
    },
  });
}
