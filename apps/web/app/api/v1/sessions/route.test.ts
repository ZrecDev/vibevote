import { fixtures } from '@vibevote/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { postSession } from './route';

const { createSession } = vi.hoisted(() => ({ createSession: vi.fn() }));
vi.mock('@vibevote/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@vibevote/server')>()),
  createSession,
}));

const originalEnv = { ...process.env };
const input = {
  title: 'Friday dinner',
  category: 'CUSTOM',
  mode: 'BEST_FIT',
  options: [{ label: 'North Star' }, { label: 'Green Bowl' }],
  hostDisplayName: 'Alex',
};
const request = (body: string, headers: HeadersInit = {}) =>
  new Request('https://app.example.test/api/v1/sessions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });

afterEach(() => {
  process.env = { ...originalEnv, VIBEVOTE_APP_ORIGIN: 'https://app.example.test' };
  createSession.mockReset();
});

describe('POST /api/v1/sessions', () => {
  it('returns only the validated response contract with a trusted invitation URL', async () => {
    const data = {
      session: {
        ...fixtures.lobbyRoom,
        currentParticipantId: fixtures.lobbyRoom.participants[0]!.id,
        hostControls: { canStartVoting: true, canCancelSession: true },
      },
      invitation: {
        sessionId: fixtures.lobbyRoom.session.id,
        inviteUrl: 'https://app.example.test/join?invite=secret',
        expiresAt: null,
      },
    };
    createSession.mockResolvedValue({ response: data, participantAccessToken: 'host-token' });
    const response = await postSession(request(JSON.stringify(input)), {
      rateLimit: async () => 'allowed',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data });
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({ hostDisplayName: 'Alex' }),
      { invitationBaseUrl: 'https://app.example.test/join' },
    );
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(response.headers.get('set-cookie')).toContain('vibevote_participant_v1=host-token');
    expect(response.headers.get('set-cookie')).toContain(
      `Path=/api/v1/sessions/${data.invitation.sessionId}`,
    );
  });

  it('accepts a JSON charset', async () => {
    createSession.mockResolvedValue({
      participantAccessToken: 'host-token',
      response: {
        session: {
          ...fixtures.lobbyRoom,
          currentParticipantId: fixtures.lobbyRoom.participants[0]!.id,
          hostControls: { canStartVoting: true, canCancelSession: true },
        },
        invitation: {
          sessionId: fixtures.lobbyRoom.session.id,
          inviteUrl: 'https://app.example.test/join?invite=secret',
          expiresAt: null,
        },
      },
    });
    expect(
      (
        await postSession(
          request(JSON.stringify(input), { 'content-type': 'application/json; charset=utf-8' }),
          { rateLimit: async () => 'allowed' },
        )
      ).status,
    ).toBe(200);
  });

  it.each([
    ['invalid request', request(JSON.stringify({ ...input, hostDisplayName: ' ' })), 400],
    ['unknown fields', request(JSON.stringify({ ...input, extra: true })), 400],
    ['malformed JSON', request('{'), 400],
    ['unsupported content type', request('{}', { 'content-type': 'text/plain' }), 415],
    ['oversized body', request('x'.repeat(16 * 1024 + 1)), 413],
    [
      'untrusted origin',
      request(JSON.stringify(input), { origin: 'https://evil.example.test' }),
      403,
    ],
  ])('rejects %s safely', async (_name, rejectedRequest, status) => {
    const response = await postSession(rejectedRequest, { rateLimit: async () => 'allowed' });
    expect(response.status).toBe(status);
    expect((await response.json()).ok).toBe(false);
  });

  it('maps limiter and internal failures without exposing internals', async () => {
    let calls = 0;
    const denied = await postSession(request(JSON.stringify(input)), {
      rateLimit: async () => {
        calls += 1;
        return 'denied';
      },
    });
    expect(calls).toBe(1);
    expect(denied.status).toBe(429);
    expect((await denied.json()).error.code).toBe('RATE_LIMITED');
    const unavailable = await postSession(request(JSON.stringify(input)), {
      rateLimit: async () => 'unavailable',
    });
    expect(unavailable.status).toBe(503);
    createSession.mockRejectedValue(new Error('database password leaked'));
    const failed = await postSession(request(JSON.stringify(input)), {
      rateLimit: async () => 'allowed',
    });
    expect(failed.status).toBe(500);
    expect(await failed.text()).not.toContain('database password leaked');
  });

  it('fails closed with the default limiter when deployed provider configuration is absent', async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      VIBEVOTE_APP_ORIGIN: 'https://app.example.test',
    };
    const response = await postSession(request(JSON.stringify(input)));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('SUPABASE');
    expect(createSession).not.toHaveBeenCalled();
  });
});
