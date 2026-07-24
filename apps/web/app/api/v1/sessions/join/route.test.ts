import { fixtures } from '@vibevote/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { postJoinSession } from './route';

const { joinSession } = vi.hoisted(() => ({ joinSession: vi.fn() }));
vi.mock('@vibevote/server', () => ({ joinSession }));
const originalEnv = { ...process.env };
const input = { inviteToken: 'invite-secret', displayName: 'Sam' };
const request = (body: string, headers: HeadersInit = {}) =>
  new Request('https://app.example.test/api/v1/sessions/join', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });

afterEach(() => {
  process.env = { ...originalEnv, VIBEVOTE_APP_ORIGIN: 'https://app.example.test' };
  joinSession.mockReset();
});

describe('POST /api/v1/sessions/join', () => {
  it('returns the public response and sets, but never serializes, the guest credential', async () => {
    const responseData = {
      session: {
        ...fixtures.lobbyRoom,
        currentParticipantId: fixtures.lobbyRoom.participants[1]!.id,
      },
    };
    joinSession.mockResolvedValue({ response: responseData, guestAccessToken: 'guest-secret' });
    const response = await postJoinSession(request(JSON.stringify(input)), {
      rateLimit: async () => 'allowed',
    });
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain('guest-secret');
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toContain('vibevote_guest_v1=guest-secret');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/api/v1/sessions');
    expect(cookie).not.toMatch(/Max-Age|Expires/);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('accepts a JSON charset', async () => {
    joinSession.mockResolvedValue({
      response: {
        session: {
          ...fixtures.lobbyRoom,
          currentParticipantId: fixtures.lobbyRoom.participants[1]!.id,
        },
      },
      guestAccessToken: 'guest-secret',
    });
    expect(
      (
        await postJoinSession(
          request(JSON.stringify(input), { 'content-type': 'application/json; charset=utf-8' }),
          { rateLimit: async () => 'allowed' },
        )
      ).status,
    ).toBe(200);
  });

  it.each([
    ['invalid invitation', request(JSON.stringify({ ...input, inviteToken: '' })), 400],
    ['invalid display name', request(JSON.stringify({ ...input, displayName: ' ' })), 400],
    ['unknown fields', request(JSON.stringify({ ...input, extra: true })), 400],
    ['malformed JSON', request('{'), 400],
    ['unsupported content type', request('{}', { 'content-type': 'text/plain' }), 415],
    ['oversized body', request('x'.repeat(16 * 1024 + 1)), 413],
    [
      'untrusted origin',
      request(JSON.stringify(input), { origin: 'https://evil.example.test' }),
      403,
    ],
  ])('rejects %s without issuing a cookie', async (_name, rejectedRequest, status) => {
    const response = await postJoinSession(rejectedRequest, { rateLimit: async () => 'allowed' });
    expect(response.status).toBe(status);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('maps denied and unavailable limiter results safely', async () => {
    const denied = await postJoinSession(request(JSON.stringify(input)), {
      rateLimit: async () => 'denied',
    });
    expect(denied.status).toBe(429);
    const unavailable = await postJoinSession(request(JSON.stringify(input)), {
      rateLimit: async () => 'unavailable',
    });
    expect(unavailable.status).toBe(503);
  });
});
