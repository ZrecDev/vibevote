import 'server-only';

export const PARTICIPANT_COOKIE_NAME = 'vibevote_participant_v1';
const sessionIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function participantCookie(sessionId: string, token: string) {
  if (!sessionIdPattern.test(sessionId)) throw new Error('Session ID must be a UUID.');
  return {
    name: PARTICIPANT_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test',
      path: `/api/v1/sessions/${sessionId}`,
    },
  };
}
