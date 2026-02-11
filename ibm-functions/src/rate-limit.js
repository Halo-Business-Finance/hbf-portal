/**
 * Server-side rate limiting backed by the rate_limit_tracking table.
 */
import { query } from './db.js';

/**
 * Check rate limit for an identifier + endpoint combo.
 * Returns { allowed, remaining_requests, reset_at, current_count }.
 */
export async function checkRateLimit(identifier, endpoint, maxRequests, windowSeconds) {
  try {
    const result = await query(
      'SELECT * FROM check_rate_limit($1, $2, $3, $4)',
      [endpoint, identifier, maxRequests, windowSeconds]
    );
    const row = result.rows?.[0] || {
      allowed: true,
      remaining_requests: 1,
      reset_at: new Date().toISOString(),
      current_count: 0,
    };
    return row;
  } catch (err) {
    console.error('Rate limit check error:', err);
    // Fail open
    return { allowed: true, remaining_requests: 1, reset_at: new Date().toISOString(), current_count: 0 };
  }
}

/**
 * Adds X-RateLimit-* headers to a response.
 */
export function rateLimitHeaders(limit, result) {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(result.remaining_requests),
    'X-RateLimit-Reset': result.reset_at,
  };
}
