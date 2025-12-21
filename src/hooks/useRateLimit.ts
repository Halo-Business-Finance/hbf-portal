import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lockedUntil?: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutMs?: number; // Optional lockout after exceeding limit
  showToast?: boolean;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60000, // 1 minute
  lockoutMs: 300000, // 5 minute lockout
  showToast: true,
};

// Predefined configurations for different sensitive actions
export const RATE_LIMIT_CONFIGS = {
  // Authentication - strict limits
  login: { maxAttempts: 5, windowMs: 60000, lockoutMs: 300000, showToast: true },
  signup: { maxAttempts: 3, windowMs: 60000, lockoutMs: 600000, showToast: true },
  passwordReset: { maxAttempts: 3, windowMs: 60000, lockoutMs: 600000, showToast: true },
  
  // MFA - very strict to prevent brute force
  mfaVerify: { maxAttempts: 5, windowMs: 60000, lockoutMs: 900000, showToast: true },
  mfaChallenge: { maxAttempts: 10, windowMs: 60000, lockoutMs: 300000, showToast: true },
  
  // Account changes - moderate limits
  changeEmail: { maxAttempts: 3, windowMs: 300000, lockoutMs: 600000, showToast: true },
  changePassword: { maxAttempts: 3, windowMs: 300000, lockoutMs: 600000, showToast: true },
  
  // OAuth - prevent rapid attempts
  oauthSignIn: { maxAttempts: 5, windowMs: 60000, lockoutMs: 120000, showToast: true },
  
  // API calls - general rate limiting
  apiCall: { maxAttempts: 30, windowMs: 60000, lockoutMs: 60000, showToast: true },
  
  // Search - prevent abuse
  search: { maxAttempts: 20, windowMs: 60000, lockoutMs: 30000, showToast: false },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMIT_CONFIGS;

/**
 * Rate limiting hook to prevent brute force attacks on sensitive operations.
 * Uses in-memory storage with automatic cleanup.
 */
export const useRateLimit = () => {
  const rateLimitsRef = useRef<Record<string, RateLimitEntry>>({});
  const [, forceUpdate] = useState({});
  const { toast } = useToast();

  const formatTimeRemaining = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  /**
   * Check if an action is allowed based on rate limiting.
   * Returns true if allowed, false if rate limited.
   */
  const checkRateLimit = useCallback((
    action: RateLimitAction | string,
    customConfig?: Partial<RateLimitConfig>
  ): boolean => {
    const now = Date.now();
    const key = action;
    
    // Get config - use predefined or custom
    const predefinedConfig = RATE_LIMIT_CONFIGS[action as RateLimitAction];
    const config: RateLimitConfig = {
      ...DEFAULT_CONFIG,
      ...(predefinedConfig || {}),
      ...(customConfig || {}),
    };

    const current = rateLimitsRef.current[key];

    // Check if currently locked out
    if (current?.lockedUntil && now < current.lockedUntil) {
      const remainingTime = current.lockedUntil - now;
      if (config.showToast) {
        toast({
          title: "Account Temporarily Locked",
          description: `Too many attempts. Please wait ${formatTimeRemaining(remainingTime)} before trying again.`,
          variant: "destructive"
        });
      }
      return false;
    }

    // Clean up expired entries
    if (current && now > current.resetTime) {
      delete rateLimitsRef.current[key];
    }

    const entry = rateLimitsRef.current[key];

    if (!entry) {
      // First attempt
      rateLimitsRef.current[key] = {
        count: 1,
        resetTime: now + config.windowMs
      };
      forceUpdate({});
      return true;
    }

    if (entry.count >= config.maxAttempts) {
      // Apply lockout
      if (config.lockoutMs) {
        rateLimitsRef.current[key] = {
          ...entry,
          lockedUntil: now + config.lockoutMs,
          resetTime: now + config.lockoutMs
        };
      }
      
      const lockoutTime = config.lockoutMs || config.windowMs;
      if (config.showToast) {
        toast({
          title: "Rate Limit Exceeded",
          description: `Too many attempts. Please wait ${formatTimeRemaining(lockoutTime)} before trying again.`,
          variant: "destructive"
        });
      }
      forceUpdate({});
      return false;
    }

    // Increment counter
    rateLimitsRef.current[key] = {
      ...entry,
      count: entry.count + 1
    };
    forceUpdate({});
    return true;
  }, [toast]);

  /**
   * Reset the rate limit for a specific action.
   * Useful after successful authentication to clear failed attempts.
   */
  const resetRateLimit = useCallback((action: RateLimitAction | string) => {
    delete rateLimitsRef.current[action];
    forceUpdate({});
  }, []);

  /**
   * Get remaining attempts for an action.
   */
  const getRemainingAttempts = useCallback((action: RateLimitAction | string): number => {
    const now = Date.now();
    const entry = rateLimitsRef.current[action];
    const config = RATE_LIMIT_CONFIGS[action as RateLimitAction] || DEFAULT_CONFIG;

    if (!entry || now > entry.resetTime) {
      return config.maxAttempts;
    }

    return Math.max(0, config.maxAttempts - entry.count);
  }, []);

  /**
   * Check if an action is currently locked out.
   */
  const isLockedOut = useCallback((action: RateLimitAction | string): boolean => {
    const now = Date.now();
    const entry = rateLimitsRef.current[action];
    return !!(entry?.lockedUntil && now < entry.lockedUntil);
  }, []);

  /**
   * Get time remaining until lockout expires (in ms).
   */
  const getLockoutRemaining = useCallback((action: RateLimitAction | string): number => {
    const now = Date.now();
    const entry = rateLimitsRef.current[action];
    if (!entry?.lockedUntil || now >= entry.lockedUntil) {
      return 0;
    }
    return entry.lockedUntil - now;
  }, []);

  return {
    checkRateLimit,
    resetRateLimit,
    getRemainingAttempts,
    isLockedOut,
    getLockoutRemaining,
  };
};

export default useRateLimit;
