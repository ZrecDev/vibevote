import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { createSession } from './create-session';
import { joinSession } from './join-session';
import { bootstrapSession } from './bootstrap-session';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const runLive = Boolean(url && serviceRoleKey);

describe.runIf(runLive)('live session operations', () => {
  it('creates, joins, and bootstraps only safe participant room state', async () => {
    const client = createClient(url!, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const created = await createSession(
      {
        title: 'Integration dinner',
        category: 'EAT',
        mode: 'BEST_FIT',
        options: [{ label: 'A' }, { label: 'B' }],
        hostDisplayName: 'Host',
      },
      { invitationBaseUrl: 'https://vibevote.test/join', client },
    );
    const invitationToken = new URL(created.response.invitation.inviteUrl).searchParams.get(
      'invite',
    );
    expect(invitationToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(JSON.stringify(created.response.session)).not.toMatch(/token|hash|seed/i);

    const joined = await joinSession(
      { inviteToken: invitationToken, displayName: 'Guest' },
      { client },
    );
    expect(joined.response.session.currentParticipantId).toMatch(/^[0-9a-f-]{36}$/);
    expect(joined.participantAccessToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(JSON.stringify(joined.response)).not.toContain(joined.participantAccessToken);

    const hostBootstrap = await bootstrapSession(
      created.response.invitation.sessionId,
      created.participantAccessToken,
      { client },
    );
    expect(hostBootstrap.kind).toBe('HOST');
    if (hostBootstrap.kind === 'HOST') expect(hostBootstrap.session.hostControls).toBeDefined();
    const guestBootstrap = await bootstrapSession(
      created.response.invitation.sessionId,
      joined.participantAccessToken,
      { client },
    );
    expect(guestBootstrap.kind).toBe('GUEST');
    expect(JSON.stringify([hostBootstrap, guestBootstrap])).not.toMatch(/token|hash|seed/i);

    const other = await createSession(
      {
        title: 'Other integration session',
        category: 'DO',
        mode: 'BEST_FIT',
        options: [{ label: 'A' }, { label: 'B' }],
        hostDisplayName: 'Other host',
      },
      { invitationBaseUrl: 'https://vibevote.test/join', client },
    );
    await expect(
      bootstrapSession(other.response.invitation.sessionId, joined.participantAccessToken, {
        client,
      }),
    ).rejects.toEqual(expect.objectContaining({ code: 'UNAUTHORIZED' }));
    await expect(
      bootstrapSession('not-a-uuid', created.participantAccessToken, { client }),
    ).rejects.toEqual(expect.objectContaining({ code: 'INVALID_REQUEST' }));
  });
});
