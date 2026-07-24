import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { createSession } from './create-session';
import { joinSession } from './join-session';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const runLive = Boolean(url && serviceRoleKey);

describe.runIf(runLive)('live session operations', () => {
  it('creates a safe invitation response and keeps the guest token internal', async () => {
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
    const invitationToken = new URL(created.invitation.inviteUrl).searchParams.get('invite');
    expect(invitationToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(JSON.stringify(created.session)).not.toMatch(/token|hash|seed/i);

    const joined = await joinSession(
      { inviteToken: invitationToken, displayName: 'Guest' },
      { client },
    );
    expect(joined.response.session.currentParticipantId).toMatch(/^[0-9a-f-]{36}$/);
    expect(joined.guestAccessToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(JSON.stringify(joined.response)).not.toContain(joined.guestAccessToken);
  });
});
