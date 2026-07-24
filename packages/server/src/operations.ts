import type { SupabaseClient } from '@supabase/supabase-js';
import type { JoinSessionResponse } from '@vibevote/contracts';

export type ServerSupabaseClient = SupabaseClient;

/** Server-only result for a future HttpOnly-cookie adapter. */
export type InternalJoinSessionResult = {
  response: JoinSessionResponse;
  guestAccessToken: string;
};
