import 'server-only';

export function trustedOrigin(request: Request): {
  origin?: string;
  error?: 'unavailable' | 'rejected';
} {
  const configured = process.env.VIBEVOTE_APP_ORIGIN;
  const development = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  let origin: string;
  try {
    origin = configured
      ? new URL(configured).origin
      : development
        ? new URL(request.url).origin
        : '';
  } catch {
    return { error: 'unavailable' };
  }
  if (!origin) return { error: 'unavailable' };
  const supplied = request.headers.get('origin');
  if (supplied && supplied !== origin) return { error: 'rejected' };
  return { origin };
}
