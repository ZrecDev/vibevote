import 'server-only';

export type RateLimitResult = 'allowed' | 'denied' | 'unavailable';
export type SessionRateLimiter = () => Promise<RateLimitResult>;

/** Production must replace this boundary with a durable serverless-compatible limiter. */
export const checkSessionRateLimit: SessionRateLimiter = async () => {
  return process.env.NODE_ENV === 'production' ? 'unavailable' : 'allowed';
};
