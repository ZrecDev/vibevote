import 'server-only';

export const GUEST_COOKIE_NAME = 'vibevote_guest_v1';
export function guestCookie(token: string) {
  return {
    name: GUEST_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test',
      path: '/api/v1/sessions',
    },
  };
}
