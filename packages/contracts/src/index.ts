import { z } from 'zod';
/** Provisional v0 vocabulary. Changes require shared approval before feature work. */
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
export const voteValueSchema = z.enum(['LOVE', 'FINE', 'PASS', 'VETO']);
export const participantSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1).max(60),
  isHost: z.boolean(),
  ready: z.boolean(),
});
export const decisionOptionSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(160),
  order: z.number().int().nonnegative(),
  eligible: z.boolean(),
});
export const decisionSessionSchema = z.object({
  id: z.string().uuid(),
  category: decisionCategorySchema,
  mode: decisionModeSchema,
  status: sessionStatusSchema,
  title: z.string().min(1).max(120),
  options: z.array(decisionOptionSchema).min(2).max(12),
});
/** Deliberately excludes private vote records, guest tokens, and server authorization data. */
export const publicRoomStateSchema = z.object({
  session: decisionSessionSchema,
  participants: z.array(participantSchema),
  finishedParticipantCount: z.number().int().nonnegative(),
});
export const resultSummarySchema = z.object({
  winnerOptionId: z.string().uuid(),
  method: decisionModeSchema,
  explanation: z.string().min(1),
  finalizedAt: z.string().datetime(),
});
export const apiSuccessSchema = <T extends z.ZodType>(data: T) =>
  z.object({ ok: z.literal(true), data });
export const apiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({ code: z.string(), message: z.string(), retryable: z.boolean() }),
});
export type DecisionCategory = z.infer<typeof decisionCategorySchema>;
export type DecisionMode = z.infer<typeof decisionModeSchema>;
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type VoteValue = z.infer<typeof voteValueSchema>;
export type Participant = z.infer<typeof participantSchema>;
export type DecisionOption = z.infer<typeof decisionOptionSchema>;
export type DecisionSession = z.infer<typeof decisionSessionSchema>;
export type PublicRoomState = z.infer<typeof publicRoomStateSchema>;
export type ResultSummary = z.infer<typeof resultSummarySchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
