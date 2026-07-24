import { describe, expect, it } from 'vitest';
import { mapOperationError } from './errors';

describe('safe operation errors', () => {
  it('maps invalid invitations to a stable safe error', () => {
    const error = mapOperationError({ code: '22023', message: 'invitation hash details' });

    expect(error.code).toBe('INVALID_INVITE');
    expect(error.message).toBe('This invitation is not valid.');
    expect(error.message).not.toContain('hash');
  });

  it('does not expose unknown database failure details', () => {
    const error = mapOperationError(new Error('password=not-for-clients'));

    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.message).not.toContain('password');
  });
});
