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
    hostDisplayName: z.string().trim().min(1).max(60),
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

/** Client-safe invitation state for the host's sharing surface. */
export const invitationShareStateSchema = z
  .object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    inviteUrl: z.string().url(),
    expiresAt: z.string().datetime().nullable(),
    status: z.enum(['ACTIVE', 'REVOKED', 'EXPIRED']),
  })
  .strict();

/** A host may request a fresh shareable invitation; expiry policy remains server-owned. */
export const createInvitationRequestSchema = z.object({}).strict();

export const createInvitationResponseSchema = z
  .object({ invitation: invitationShareStateSchema })
  .strict();

export const updateReadinessRequestSchema = z
  .object({ readiness: participantReadinessSchema })
  .strict();

export const updateReadinessResponseSchema = z
  .object({ participant: sessionParticipantSchema })
  .strict();

/** Host-only hard-constraint control. At least one option remains eligible. */
export const updateOptionEligibilityRequestSchema = z
  .object({ eligible: z.boolean() })
  .strict();
export const updateOptionEligibilityResponseSchema = z.object({ option: decisionOptionSchema }).strict();

/** One private preference per option. This shape is never part of room state or realtime data. */
export const privateBallotEntrySchema = z
  .object({ optionId: z.string().uuid(), value: voteValueSchema })
  .strict();

export const submitPrivateBallotRequestSchema = z
  .object({ ballots: z.array(privateBallotEntrySchema).min(2).max(12) })
  .strict()
  .superRefine(({ ballots }, context) => {
    const optionIds = new Set<string>();
    for (const [index, ballot] of ballots.entries()) {
      if (optionIds.has(ballot.optionId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Each option may appear only once in a ballot.',
          path: ['ballots', index, 'optionId'],
        });
      }
      optionIds.add(ballot.optionId);
    }
  });

/** Safe aggregate-only voting progress. It never identifies who has finished. */
export const aggregateProgressSchema = z
  .object({
    participantCount: z.number().int().positive(),
    finishedParticipantCount: z.number().int().nonnegative(),
  })
  .strict()
  .refine(
    ({ participantCount, finishedParticipantCount }) =>
      finishedParticipantCount <= participantCount,
    {
      message: 'Finished participants cannot exceed total participants.',
      path: ['finishedParticipantCount'],
    },
  );

export const submitPrivateBallotResponseSchema = z
  .object({ progress: aggregateProgressSchema })
  .strict();

export const aggregateProgressResponseSchema = z
  .object({ progress: aggregateProgressSchema })
  .strict();

/** A final, client-safe receipt. Immutability is enforced by the server and database. */
export const resultReceiptSchema = z
  .object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    winnerOptionId: z.string().uuid(),
    method: decisionModeSchema,
    explanation: z.string().trim().min(1).max(500),
    finalizedAt: z.string().datetime(),
  })
  .strict();

export const finalResultResponseSchema = z.object({ result: resultReceiptSchema }).strict();

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

/** Safe authenticated bootstrap response; credential material is never public. */
export const bootstrapSessionResponseSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('HOST'), session: hostRoomStateSchema }).strict(),
  z.object({ kind: z.literal('GUEST'), session: participantRoomStateSchema }).strict(),
]);

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
export type InvitationShareState = z.infer<typeof invitationShareStateSchema>;
export type CreateInvitationRequest = z.infer<typeof createInvitationRequestSchema>;
export type CreateInvitationResponse = z.infer<typeof createInvitationResponseSchema>;
export type UpdateReadinessRequest = z.infer<typeof updateReadinessRequestSchema>;
export type UpdateReadinessResponse = z.infer<typeof updateReadinessResponseSchema>;
export type UpdateOptionEligibilityResponse = z.infer<typeof updateOptionEligibilityResponseSchema>;
export type PrivateBallotEntry = z.infer<typeof privateBallotEntrySchema>;
export type SubmitPrivateBallotRequest = z.infer<typeof submitPrivateBallotRequestSchema>;
export type AggregateProgress = z.infer<typeof aggregateProgressSchema>;
export type SubmitPrivateBallotResponse = z.infer<typeof submitPrivateBallotResponseSchema>;
export type AggregateProgressResponse = z.infer<typeof aggregateProgressResponseSchema>;
export type ResultReceipt = z.infer<typeof resultReceiptSchema>;
export type FinalResultResponse = z.infer<typeof finalResultResponseSchema>;
export type PublicRoomState = z.infer<typeof publicRoomStateSchema>;
export type ParticipantRoomState = z.infer<typeof participantRoomStateSchema>;
export type HostRoomState = z.infer<typeof hostRoomStateSchema>;
export type ServerSessionState = z.infer<typeof serverSessionStateSchema>;
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;
export type JoinSessionRequest = z.infer<typeof joinSessionRequestSchema>;
export type JoinSessionResponse = z.infer<typeof joinSessionResponseSchema>;
export type BootstrapSessionResponse = z.infer<typeof bootstrapSessionResponseSchema>;
export type SessionTransition = z.infer<typeof sessionTransitionSchema>;
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiSuccess<T extends z.ZodType> = z.infer<ReturnType<typeof apiSuccessSchema<T>>>;

export { fixtures } from './fixtures';
