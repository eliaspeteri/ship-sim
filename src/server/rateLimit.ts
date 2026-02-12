export type RateLimitConfig = {
  windowMs: number;
  max: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
};

export const createRateLimiter = (config: RateLimitConfig) => {
  const buckets = new Map<string, RateLimitState>();

  const check = (key: string, now: number = Date.now()): RateLimitResult => {
    const entry = buckets.get(key);
    if (!entry || entry.resetAt <= now) {
      const resetAt = now + config.windowMs;
      buckets.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: Math.max(0, config.max - 1),
        resetAt,
        retryAfterMs: 0,
      };
    }

    const nextCount = entry.count + 1;
    buckets.set(key, { count: nextCount, resetAt: entry.resetAt });

    if (nextCount > config.max) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfterMs: Math.max(0, entry.resetAt - now),
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.max - nextCount),
      resetAt: entry.resetAt,
      retryAfterMs: 0,
    };
  };

  const reset = (key: string) => {
    buckets.delete(key);
  };

  return { check, reset };
};
