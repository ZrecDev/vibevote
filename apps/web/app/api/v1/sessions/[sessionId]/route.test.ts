import { fixtures } from '@vibevote/contracts';
import { SafeOperationError } from '@vibevote/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSession } from './route';

const sessionId = fixtures.lobbyRoom.session.id;
const originalEnv = { ...process.env };
const request = (id = sessionId, headers: HeadersInit = {}) =>
  new Request(`https://app.example.test/api/v1/sessions/${id}?token=query-secret`, {
    headers: { cookie: 'vibevote_participant_v1=participant-secret', ...headers },
  });
const params = (id = sessionId) => ({ params: Promise.resolve({ sessionId: id }) });

afterEach(() => {
  process.env = { ...originalEnv, VIBEVOTE_APP_ORIGIN: 'https://app.example.test' };
});

describe('GET /api/v1/sessions/[sessionId]', () => {
  it('returns the host variant only for an authenticated host cookie', async () => {
    const bootstrap = vi.fn().mockResolvedValue({
      kind: 'HOST',
      session: {
        ...fixtures.lobbyRoom,
        currentParticipantId: fixtures.lobbyRoom.participants[0]!.id,
        hostControls: { canStartVoting: true, canCancelSession: true },
      },
    });
    const response = await getSession(request(), params(), {
      rateLimit: async () => 'allowed',
      bootstrap,
    });
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.kind).toBe('HOST');
    expect(payload.data.session.hostControls).toBeDefined();
    expect(bootstrap).toHaveBeenCalledWith(sessionId, 'participant-secret');
    expect(JSON.stringify(payload)).not.toContain('participant-secret');
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('returns a guest variant without host controls', async () => {
    const response = await getSession(request(), params(), {
      rateLimit: async () => 'allowed',
      bootstrap: async () => ({
        kind: 'GUEST',
        session: {
          ...fixtures.lobbyRoom,
          currentParticipantId: fixtures.lobbyRoom.participants[1]!.id,
        },
      }),
    });
    const payload = await response.json();
    expect(payload.data.kind).toBe('GUEST');
    expect(payload.data.session.hostControls).toBeUndefined();
  });

  it.each([
    [
      'missing cookie',
      new Request(`https://app.example.test/api/v1/sessions/${sessionId}`),
      sessionId,
      401,
    ],
    ['empty cookie', request(sessionId, { cookie: 'vibevote_participant_v1=' }), sessionId, 401],
    ['invalid session id', request('not-a-uuid'), 'not-a-uuid', 400],
  ])('fails safely for %s', async (_name, input, id, status) => {
    const bootstrap = vi.fn();
    const response = await getSession(input, params(id), {
      rateLimit: async () => 'allowed',
      bootstrap,
    });
    expect(response.status).toBe(status);
    expect((await response.json()).ok).toBe(false);
    expect(bootstrap).not.toHaveBeenCalled();
  });

  it('ignores query, authorization, and body credentials', async () => {
    const bootstrap = vi.fn().mockRejectedValue(new SafeOperationError('UNAUTHORIZED'));
    const response = await getSession(
      request(sessionId, {
        cookie: 'vibevote_participant_v1=wrong-cookie',
        authorization: 'Bearer header-secret',
      }),
      params(),
      { rateLimit: async () => 'allowed', bootstrap },
    );
    expect(response.status).toBe(401);
    expect(bootstrap).toHaveBeenCalledWith(sessionId, 'wrong-cookie');
    expect(await response.text()).not.toContain('header-secret');
  });

  it('preserves trusted-origin and fail-closed limiter behavior without CORS', async () => {
    const rejected = await getSession(
      request(sessionId, { origin: 'https://evil.example.test' }),
      params(),
      {
        rateLimit: async () => 'allowed',
        bootstrap: vi.fn(),
      },
    );
    expect(rejected.status).toBe(403);
    const limited = await getSession(request(), params(), {
      rateLimit: async () => 'unavailable',
      bootstrap: vi.fn(),
    });
    expect(limited.status).toBe(503);
    expect(limited.headers.get('access-control-allow-origin')).toBeNull();
  });
});
