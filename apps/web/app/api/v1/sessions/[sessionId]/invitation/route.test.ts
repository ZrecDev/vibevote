import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const { replaceInvitation } = vi.hoisted(() => ({ replaceInvitation: vi.fn() }));
vi.mock('@vibevote/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@vibevote/server')>()),
  replaceInvitation,
}));

const originalEnv = { ...process.env };
const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const request = (origin = 'https://app.example.test') =>
  new Request(`http://internal.example.test/api/v1/sessions/${sessionId}/invitation`, {
    method: 'POST',
    headers: { origin, cookie: 'vibevote_participant_v1=secret' },
  });

beforeEach(() => {
  process.env = { ...originalEnv, VIBEVOTE_APP_ORIGIN: 'https://app.example.test' };
});

afterEach(() => {
  process.env = { ...originalEnv };
  replaceInvitation.mockReset();
});

describe('POST /api/v1/sessions/[sessionId]/invitation', () => {
  it('uses the validated public origin instead of the internal request host', async () => {
    replaceInvitation.mockResolvedValue({ invitation: { id: sessionId } });
    const response = await POST(request(), { params: Promise.resolve({ sessionId }) });
    expect(response.status).toBe(200);
    expect(replaceInvitation).toHaveBeenCalledWith(
      sessionId,
      'secret',
      'https://app.example.test/join',
    );
  });

  it('rejects a mismatched request origin before invoking the server operation', async () => {
    const response = await POST(request('https://evil.example.test'), {
      params: Promise.resolve({ sessionId }),
    });
    expect(response.status).toBe(403);
    expect(replaceInvitation).not.toHaveBeenCalled();
  });
});
