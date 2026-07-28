import 'server-only';

function vercelOrigin(host: string | undefined) {
  if (!host || !/^[a-z0-9.-]+$/i.test(host) || !host.toLowerCase().endsWith('.vercel.app'))
    return undefined;
  try {
    return new URL(`https://${host}`).origin;
  } catch {
    return undefined;
  }
}

export function trustedOrigin(request: Request): {
  origin?: string;
  error?: 'unavailable' | 'rejected';
} {
  const configured = process.env.VIBEVOTE_APP_ORIGIN;
  const development = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  let origins: string[];
  try {
    if (configured) {
      origins = [new URL(configured).origin];
    } else if (development) {
      origins = [new URL(request.url).origin];
    } else if (process.env.VERCEL === '1') {
      const hosts =
        process.env.VERCEL_ENV === 'production'
          ? [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL]
          : [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL];
      origins = [
        ...new Set(hosts.map(vercelOrigin).filter((origin): origin is string => !!origin)),
      ];
    } else {
      origins = [];
    }
  } catch {
    return { error: 'unavailable' };
  }
  if (!origins.length) return { error: 'unavailable' };
  const supplied = request.headers.get('origin');
  if (supplied && !origins.includes(supplied)) return { error: 'rejected' };
  return { origin: supplied ?? origins[0]! };
}
