// lib/rate-limit.ts

export interface RateLimitConfig {
  limit: number;     // max requests
  windowMs: number;  // time window in ms
}

// In-memory store (Note: In a multi-instance/serverless environment, this is instance-specific. Use Redis for global state.)
const rateLimiters = new Map<string, { count: number; expiresAt: number }>();

/**
 * Basic in-memory rate limiter.
 */
export function rateLimit(identifier: string, config: RateLimitConfig): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const entry = rateLimiters.get(identifier);

  if (!entry || entry.expiresAt < now) {
    // New entry or expired
    const newEntry = { count: 1, expiresAt: now + config.windowMs };
    rateLimiters.set(identifier, newEntry);
    return { success: true, limit: config.limit, remaining: config.limit - 1, reset: newEntry.expiresAt };
  }

  // Active entry
  if (entry.count >= config.limit) {
    return { success: false, limit: config.limit, remaining: 0, reset: entry.expiresAt };
  }

  entry.count += 1;
  return { success: true, limit: config.limit, remaining: config.limit - entry.count, reset: entry.expiresAt };
}
