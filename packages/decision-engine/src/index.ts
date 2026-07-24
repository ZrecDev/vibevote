import type { DecisionMode, DecisionOption } from '@vibevote/contracts';
/** Interfaces only: server-authoritative algorithms arrive in a later contract-approved batch. */
export interface EligibleOptionFilter {
  filter(options: readonly DecisionOption[]): readonly DecisionOption[];
}
export interface ResultExplanation {
  summary: string;
  reasons: readonly string[];
}
export interface FinalizationReceipt {
  sessionId: string;
  winnerOptionId: string;
  mode: DecisionMode;
  explanation: ResultExplanation;
}
export interface InstantMatchStrategy {
  finalize(input: unknown): Promise<FinalizationReceipt>;
}
export interface BestFitStrategy {
  finalize(input: unknown): Promise<FinalizationReceipt>;
}
export interface ChaosModeStrategy {
  finalize(input: unknown): Promise<FinalizationReceipt>;
}
