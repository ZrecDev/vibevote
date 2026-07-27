import { ZodError } from 'zod';
import type { ApiErrorCode } from '@vibevote/contracts';

const safeErrorMessages: Record<ApiErrorCode, { message: string; retryable: boolean }> = {
  INVALID_REQUEST: { message: 'The request is not valid.', retryable: false },
  INVALID_SESSION_STATUS: {
    message: 'This session is not available for that action.',
    retryable: false,
  },
  SESSION_NOT_FOUND: { message: 'This session is not available.', retryable: false },
  SESSION_EXPIRED: { message: 'This session has expired.', retryable: false },
  INVALID_INVITE: { message: 'This invitation is not valid.', retryable: false },
  DISPLAY_NAME_INVALID: { message: 'Choose a valid display name.', retryable: false },
  OPTION_COUNT_INVALID: { message: 'Provide between two and twelve options.', retryable: false },
  UNAUTHORIZED: { message: 'You are not authorized to do that.', retryable: false },
  CONFLICT: { message: 'This session changed. Try again.', retryable: true },
  RATE_LIMITED: { message: 'Too many attempts. Try again later.', retryable: true },
  INTERNAL_ERROR: { message: 'Something went wrong. Try again.', retryable: true },
};

export class SafeOperationError extends Error {
  readonly code: ApiErrorCode;
  readonly retryable: boolean;

  constructor(code: ApiErrorCode) {
    super(safeErrorMessages[code].message);
    this.name = 'SafeOperationError';
    this.code = code;
    this.retryable = safeErrorMessages[code].retryable;
  }
}

type PostgrestError = { code?: string };

export function mapOperationError(error: unknown): SafeOperationError {
  if (error instanceof SafeOperationError) return error;
  if (error instanceof ZodError) return new SafeOperationError('INVALID_REQUEST');

  const code =
    typeof error === 'object' && error !== null ? (error as PostgrestError).code : undefined;
  if (code === '22023') return new SafeOperationError('INVALID_INVITE');
  if (code === '42501') return new SafeOperationError('UNAUTHORIZED');
  if (code === '55000') return new SafeOperationError('INVALID_SESSION_STATUS');
  if (code === '23514') return new SafeOperationError('INVALID_REQUEST');
  if (code === '23505') return new SafeOperationError('CONFLICT');
  return new SafeOperationError('INTERNAL_ERROR');
}
