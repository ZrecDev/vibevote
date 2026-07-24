import { z } from 'zod';

/** Provisional v1 vocabulary. Product behavior beyond these shapes requires shared approval. */
export const decisionCategorySchema = z.enum(['EAT', 'DO', 'WATCH', 'CUSTOM']);
export const decisionModeSchema = z.enum(['INSTANT_MATCH', 'BEST_FIT', 'CHAOS']);
export const sessionStatusSchema = z.enum([
  'DRAFT',
  'LOBBY',
  'VOTING',
  'TIEBREAK',
  'DECIDED',
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
]);
export const participantRoleSchema = z.enum(['HOST', 'GUEST']);
/** Provisional replacement for the earlier boolean ready flag. */
export const participantReadinessSchema = z.enum(['WAITING', 'READY']);
export const voteValueSchema = z.enum(['LOVE', 'FINE', 'PASS', 'VETO']);

export const createDecisionOptionSchema = z
  .object({ label: z.string().trim().min(1).max(160) })
  .strict();

export const decisionOptionSchema = createDecisionOptionSchema
  .extend({
    id: z.string().uuid(),
    order: z.number().int().nonnegative(),
    eligible: z.boolean(),
  })
  .strict();

export const sessionParticipantSchema = z
  .object({
    id: z.string().uuid(),
    displayName: z.string().trim().min(1).max(60),
    role: participantRoleSchema,
    readiness: participantReadinessSchema,
  })
  .strict();

/** Backwards-compatible alias for the canonical session participant schema. */
export const participantSchema = sessionParticipantSchema;

export const decisionSessionSchema = z
  .object({
    id: z.string().uuid(),
    category: decisionCategorySchema,
    mode: decisionModeSchema,
    status: sessionStatusSchema,
    title: z.string().trim().min(1).max(120),
    options: z.array(decisionOptionSchema).min(2).max(12),
  })
  .strict();

export const resultSummarySchema = z
  .object({
    winnerOptionId: z.string().uuid(),
    method: decisionModeSchema,
    explanation: z.string().trim().min(1).max(500),
    finalizedAt: z.string().datetime(),
  })
  .strict();

export const createSessionRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    category: decisionCategorySchema,
    mode: decisionModeSchema,
    options: z.array(createDecisionOptionSchema).min(2).max(12),
  })
  .strict();

/** Safe to return to a client; it never contains the stored invitation-token hash. */
export const invitationResponseSchema = z
  .object({
    sessionId: z.string().uuid(),
    inviteUrl: z.string().url(),
    expiresAt: z.string().datetime().nullable(),
  })
  .strict();

export const publicRoomStateSchema = z
  .object({
    session: decisionSessionSchema,
    participants: z.array(sessionParticipantSchema),
    finishedParticipantCount: z.number().int().nonnegative(),
    result: resultSummarySchema.nullable(),
  })
  .strict();

/** Participant-only context; this does not reveal any other participant's ballot. */
export const participantRoomStateSchema = publicRoomStateSchema
  .extend({ currentParticipantId: z.string().uuid() })
  .strict();

/** Host controls are capability hints, not server-authoritative permissions. */
export const hostRoomStateSchema = participantRoomStateSchema
  .extend({
    hostControls: z.object({ canStartVoting: z.boolean(), canCancelSession: z.boolean() }).strict(),
  })
  .strict();

/**
 * Server-only boundary. Do not serialize this schema to browser clients,
 * realtime channels, logs, or fixtures.
 */
export const serverSessionStateSchema = z
  .object({
    session: decisionSessionSchema,
    invitationTokenHash: z.string().min(1),
    randomSeed: z.string().min(1),
  })
  .strict();

export const createSessionResponseSchema = z
  .object({ session: hostRoomStateSchema, invitation: invitationResponseSchema })
  .strict();

export const joinSessionRequestSchema = z
  .object({
    inviteToken: z.string().trim().min(1).max(512),
    displayName: z.string().trim().min(1).max(60),
  })
  .strict();

export const joinSessionResponseSchema = z.object({ session: participantRoomStateSchema }).strict();

/** Valid vocabulary only; persistence and enforcement remain server work. */
export const sessionTransitionSchema = z
  .object({ from: sessionStatusSchema, to: sessionStatusSchema })
  .strict();

export const apiErrorCodeSchema = z.enum([
  'INVALID_REQUEST',
  'INVALID_SESSION_STATUS',
  'SESSION_NOT_FOUND',
  'SESSION_EXPIRED',
  'INVALID_INVITE',
  'DISPLAY_NAME_INVALID',
  'OPTION_COUNT_INVALID',
  'UNAUTHORIZED',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
]);

export const apiSuccessSchema = <T extends z.ZodType>(data: T) =>
  z.object({ ok: z.literal(true), data }).strict();

/** Messages are safe client copy; never surface exception, SQL, or secret details. */
export const apiErrorSchema = z
  .object({
    ok: z.literal(false),
    error: z
      .object({
        code: apiErrorCodeSchema,
        message: z.string().trim().min(1).max(300),
        retryable: z.boolean(),
      })
      .strict(),
  })
  .strict();

export type DecisionCategory = z.infer<typeof decisionCategorySchema>;
export type DecisionMode = z.infer<typeof decisionModeSchema>;
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type ParticipantRole = z.infer<typeof participantRoleSchema>;
export type ParticipantReadiness = z.infer<typeof participantReadinessSchema>;
export type VoteValue = z.infer<typeof voteValueSchema>;
export type CreateDecisionOption = z.infer<typeof createDecisionOptionSchema>;
export type DecisionOption = z.infer<typeof decisionOptionSchema>;
export type SessionParticipant = z.infer<typeof sessionParticipantSchema>;
export type Participant = z.infer<typeof participantSchema>;
export type DecisionSession = z.infer<typeof decisionSessionSchema>;
export type ResultSummary = z.infer<typeof resultSummarySchema>;
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;
export type InvitationResponse = z.infer<typeof invitationResponseSchema>;
export type PublicRoomState = z.infer<typeof publicRoomStateSchema>;
export type ParticipantRoomState = z.infer<typeof participantRoomStateSchema>;
export type HostRoomState = z.infer<typeof hostRoomStateSchema>;
export type ServerSessionState = z.infer<typeof serverSessionStateSchema>;
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;
export type JoinSessionRequest = z.infer<typeof joinSessionRequestSchema>;
export type JoinSessionResponse = z.infer<typeof joinSessionResponseSchema>;
export type SessionTransition = z.infer<typeof sessionTransitionSchema>;
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiSuccess<T extends z.ZodType> = z.infer<ReturnType<typeof apiSuccessSchema<T>>>;

export { fixtures } from './fixtures';
