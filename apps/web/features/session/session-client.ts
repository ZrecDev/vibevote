'use client';

import {
  apiErrorSchema,
  apiSuccessSchema,
  bootstrapSessionResponseSchema,
  createInvitationResponseSchema,
  hostRoomStateSchema,
  finalResultResponseSchema,
  submitPrivateBallotRequestSchema,
  submitPrivateBallotResponseSchema,
  updateOptionEligibilityRequestSchema,
  updateOptionEligibilityResponseSchema,
  createSessionRequestSchema,
  createSessionResponseSchema,
  joinSessionRequestSchema,
  joinSessionResponseSchema,
  updateReadinessRequestSchema,
  updateReadinessResponseSchema,
  type BootstrapSessionResponse,
  type CreateSessionRequest,
  type CreateSessionResponse,
  type JoinSessionRequest,
  type JoinSessionResponse,
  type CreateInvitationResponse,
  type ParticipantReadiness,
  type UpdateReadinessResponse,
  type HostRoomState,
  type SubmitPrivateBallotRequest,
} from '@vibevote/contracts';
import { z } from 'zod';

export class SessionClientError extends Error {
  constructor(
    public readonly kind: 'network' | 'malformed' | 'server',
    public readonly status?: number,
    message = 'Something went wrong. Please try again.',
  ) {
    super(message);
  }
}

async function request<T>(
  url: string,
  responseSchema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { credentials: 'same-origin', ...init });
  } catch {
    throw new SessionClientError(
      'network',
      undefined,
      'We could not reach VibeVote. Check your connection and try again.',
    );
  }
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const safe = apiErrorSchema.safeParse(body);
    throw new SessionClientError(
      'server',
      response.status,
      safe.success ? safe.data.error.message : 'Something went wrong. Please try again.',
    );
  }
  const parsed = apiSuccessSchema(responseSchema).safeParse(body);
  if (!parsed.success)
    throw new SessionClientError(
      'malformed',
      response.status,
      'We could not verify the room response. Please try again.',
    );
  return parsed.data.data;
}

export function createSession(input: CreateSessionRequest): Promise<CreateSessionResponse> {
  const payload = createSessionRequestSchema.parse(input);
  return request('/api/v1/sessions', createSessionResponseSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function joinSession(input: JoinSessionRequest): Promise<JoinSessionResponse> {
  const payload = joinSessionRequestSchema.parse(input);
  return request('/api/v1/sessions/join', joinSessionResponseSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function bootstrapSession(sessionId: string): Promise<BootstrapSessionResponse> {
  return request(
    `/api/v1/sessions/${encodeURIComponent(sessionId)}`,
    bootstrapSessionResponseSchema,
    { method: 'GET' },
  );
}

/** Host-only. The raw share URL is returned only for this immediate UI action. */
export function createInvitation(sessionId: string): Promise<CreateInvitationResponse> {
  return request(
    `/api/v1/sessions/${encodeURIComponent(sessionId)}/invitation`,
    createInvitationResponseSchema,
    { method: 'POST' },
  );
}

/** Updates the authenticated current participant only; no participant identifier is sent. */
export function updateCurrentReadiness(
  sessionId: string,
  readiness: ParticipantReadiness,
): Promise<UpdateReadinessResponse> {
  const payload = updateReadinessRequestSchema.parse({ readiness });
  return request(
    `/api/v1/sessions/${encodeURIComponent(sessionId)}/readiness`,
    updateReadinessResponseSchema,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

export function startLobbyVoting(sessionId: string): Promise<{ session: HostRoomState }> {
  return request(
    `/api/v1/sessions/${encodeURIComponent(sessionId)}/start`,
    z.object({ session: hostRoomStateSchema }).strict(),
    { method: 'POST' },
  );
}

export function submitPrivateBallot(sessionId: string, input: SubmitPrivateBallotRequest) {
  return request(
    `/api/v1/sessions/${encodeURIComponent(sessionId)}/ballot`,
    submitPrivateBallotResponseSchema,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitPrivateBallotRequestSchema.parse(input)),
    },
  );
}

export function finalizeDecision(sessionId: string) {
  return request(
    `/api/v1/sessions/${encodeURIComponent(sessionId)}/finalize`,
    finalResultResponseSchema,
    { method: 'POST' },
  );
}

export function updateOptionEligibility(sessionId: string, optionId: string, eligible: boolean) {
  return request(
    `/api/v1/sessions/${encodeURIComponent(sessionId)}/options/${encodeURIComponent(optionId)}/eligibility`,
    updateOptionEligibilityResponseSchema,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateOptionEligibilityRequestSchema.parse({ eligible })),
    },
  );
}
