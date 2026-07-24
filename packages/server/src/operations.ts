import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateSessionResponse, JoinSessionResponse } from '@vibevote/contracts';

export type ServerSupabaseClient = SupabaseClient;

/** Server-only result for a future HttpOnly-cookie adapter. */
export type InternalCreateSessionResult = {
  response: CreateSessionResponse;
  participantAccessToken: string;
};

export type InternalJoinSessionResult = {
  response: JoinSessionResponse;
  participantAccessToken: string;
};
