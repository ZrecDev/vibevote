import { fixtures } from '@vibevote/contracts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { bootstrapSession, createSession, joinSession, SessionClientError } from './session-client';

const host = {
  kind: 'HOST' as const,
  session: {
    ...fixtures.lobbyRoom,
    currentParticipantId: fixtures.lobbyRoom.participants[0]!.id,
    hostControls: { canStartVoting: true, canCancelSession: false },
  },
};
const guest = {
  kind: 'GUEST' as const,
  session: { ...fixtures.lobbyRoom, currentParticipantId: fixtures.lobbyRoom.participants[1]!.id },
};
const createInput = {
  hostDisplayName: 'Alex',
  title: 'Friday dinner',
  category: 'CUSTOM' as const,
  mode: 'BEST_FIT' as const,
  options: [{ label: 'North Star Cafe' }, { label: 'Green Bowl' }],
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('session client', () => {
  afterEach(() => vi.restoreAllMocks());

  it('posts the strict create request using same-origin credentials', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respond({
        ok: true,
        data: {
          session: host.session,
          invitation: {
            sessionId: host.session.session.id,
            inviteUrl: 'http://localhost:3000/join?invite=safe',
            expiresAt: null,
          },
        },
      }),
    );
    await expect(createSession(createInput)).resolves.toMatchObject({ session: host.session });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/sessions',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)).toEqual(createInput);
  });

  it('posts the strict join request without retaining invitation data', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(respond({ ok: true, data: { session: guest.session } }));
    await expect(joinSession({ inviteToken: 'invite-token', displayName: 'Sam' })).resolves.toEqual(
      { session: guest.session },
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/sessions/join',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({ inviteToken: 'invite-token', displayName: 'Sam' }),
      }),
    );
  });

  it('gets session paths with no body or authorization header and parses both variants', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(respond({ ok: true, data: host }))
      .mockResolvedValueOnce(respond({ ok: true, data: guest }));
    await expect(bootstrapSession(host.session.session.id)).resolves.toEqual(host);
    await expect(bootstrapSession(host.session.session.id)).resolves.toEqual(guest);
    expect(fetchMock).toHaveBeenLastCalledWith(
      `/api/v1/sessions/${host.session.session.id}`,
      expect.objectContaining({ method: 'GET', credentials: 'same-origin' }),
    );
    expect(fetchMock.mock.calls.at(-1)![1]).not.toHaveProperty('body');
    expect(fetchMock.mock.calls.at(-1)![1]).not.toHaveProperty('headers');
  });

  it.each([400, 401, 403, 429, 503])(
    'maps safe server errors for %i without raw response data',
    async (status) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        respond(
          {
            ok: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'This session is not available.',
              retryable: false,
            },
          },
          status,
        ),
      );
      await expect(bootstrapSession(host.session.session.id)).rejects.toMatchObject({
        kind: 'server',
        status,
        message: 'This session is not available.',
      });
    },
  );

  it('safely rejects malformed and non-JSON responses', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(respond({ ok: true, data: { secret: 'nope' } }))
      .mockResolvedValueOnce(new Response('upstream failure', { status: 503 }));
    await expect(createSession(createInput)).rejects.toMatchObject({ kind: 'malformed' });
    await expect(joinSession({ inviteToken: 'invite', displayName: 'Sam' })).rejects.toMatchObject({
      kind: 'server',
      message: 'Something went wrong. Please try again.',
    });
  });

  it('maps network failures safely without mock fallback', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await expect(bootstrapSession(host.session.session.id)).rejects.toMatchObject({
      kind: 'network',
      message: expect.stringMatching(/could not reach/i),
    });
  });

  it('keeps credential, cookie, storage, and mock boundaries out of the public adapter', () => {
    const source = readFileSync(resolve(__dirname, 'session-client.ts'), 'utf8');
    expect(source).not.toMatch(
      /document\.cookie|localStorage|sessionStorage|Authorization|participantAccessToken|participant_access_token_hash|mockRoom/,
    );
  });
});
