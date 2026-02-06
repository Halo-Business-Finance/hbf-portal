import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { telemetryService } from '@/services/telemetryService';
import { auditService } from '@/services/auditService';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  login: { maxAttempts: 5, windowMs: 60000, lockoutMs: 300000 },
  signup: { maxAttempts: 3, windowMs: 60000, lockoutMs: 600000 },
};

// Track consecutive failed login attempts for telemetry
const REPEATED_FAILURE_THRESHOLD = 3;

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lockedUntil?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authenticated: boolean;
  loading: boolean;
  formState: number;
  setFormState: (state: number) => void;
  username: string | null;
  setUsername: (username: string | null) => void;
  phone: string | null;
  setPhone: (phone: string | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: any; rateLimited?: boolean }>;
  signUp: (email: string, password: string) => Promise<{ error: any; rateLimited?: boolean }>;
  signOut: () => Promise<void>;
  resetAuthRateLimit: (action: 'login' | 'signup') => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};

const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Rate limiting state
  const rateLimitsRef = useRef<Record<string, RateLimitEntry>>({});

  const formatTimeRemaining = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const checkRateLimit = useCallback((action: 'login' | 'signup'): { allowed: boolean; message?: string } => {
    const now = Date.now();
    const config = RATE_LIMIT_CONFIG[action];
    const key = action;
    const current = rateLimitsRef.current[key];

    // Check if currently locked out
    if (current?.lockedUntil && now < current.lockedUntil) {
      const remainingTime = current.lockedUntil - now;
      return {
        allowed: false,
        message: `Too many ${action} attempts. Please wait ${formatTimeRemaining(remainingTime)} before trying again.`
      };
    }

    // Clean up expired entries
    if (current && now > current.resetTime) {
      delete rateLimitsRef.current[key];
    }

    const entry = rateLimitsRef.current[key];

    if (!entry) {
      rateLimitsRef.current[key] = { count: 1, resetTime: now + config.windowMs };
      return { allowed: true };
    }

    if (entry.count >= config.maxAttempts) {
      rateLimitsRef.current[key] = {
        ...entry,
        lockedUntil: now + config.lockoutMs,
        resetTime: now + config.lockoutMs
      };
      return {
        allowed: false,
        message: `Too many ${action} attempts. Please wait ${formatTimeRemaining(config.lockoutMs)} before trying again.`
      };
    }

    rateLimitsRef.current[key] = { ...entry, count: entry.count + 1 };
    return { allowed: true };
  }, []);

  const resetAuthRateLimit = useCallback((action: 'login' | 'signup') => {
    delete rateLimitsRef.current[action];
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Update username from user metadata
        if (session?.user) {
          setUsername(session.user.user_metadata?.name || session.user.email);
        } else {
          setUsername(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setUsername(session.user.user_metadata?.name || session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Check rate limit before attempting sign in
    const rateLimitCheck = checkRateLimit('login');
    if (!rateLimitCheck.allowed) {
      // Track rate limit triggered (anonymous telemetry)
      telemetryService.trackRateLimitTriggered();
      
      toast({
        title: "Too Many Attempts",
        description: rateLimitCheck.message,
        variant: "destructive"
      });
      return { error: { message: rateLimitCheck.message }, rateLimited: true };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      // Track failed login attempt (anonymous aggregate only)
      telemetryService.trackFailedLogin();
      
      // Check if this constitutes repeated failures (3+ in current session)
      const currentEntry = rateLimitsRef.current['login'];
      if (currentEntry && currentEntry.count >= REPEATED_FAILURE_THRESHOLD) {
        telemetryService.trackRepeatedFailedLogin();
        
        // Log audit event for security monitoring (with user context for investigation)
        // Note: We only have the email at this point, not user_id
        console.warn(`Security alert: ${REPEATED_FAILURE_THRESHOLD}+ failed login attempts for email`);
      }
    } else {
      // Reset rate limit on successful login
      resetAuthRateLimit('login');
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    // Check rate limit before attempting sign up
    const rateLimitCheck = checkRateLimit('signup');
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Too Many Attempts",
        description: rateLimitCheck.message,
        variant: "destructive"
      });
      return { error: { message: rateLimitCheck.message }, rateLimited: true };
    }

    // Get safe redirect URL - only allow known production/preview domains
    const getSafeRedirectUrl = (): string => {
      const origin = window.location.origin;
      const allowedPatterns = [
        /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
        /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
      ];
      
      if (allowedPatterns.some(pattern => pattern.test(origin))) {
        return `${origin}/`;
      }
      if (origin.startsWith('https://')) {
        return `${origin}/`;
      }
      return '';
    };
    
    const redirectUrl = getSafeRedirectUrl();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: redirectUrl ? {
        emailRedirectTo: redirectUrl
      } : undefined
    });
    
    // Reset rate limit on successful signup
    if (!error) {
      resetAuthRateLimit('signup');
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUsername(null);
    setPhone(null);
  };

  const authenticated = !!session?.user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        authenticated,
        loading,
        formState,
        setFormState,
        username,
        setUsername,
        phone,
        setPhone,
        signIn,
        signUp,
        signOut,
        resetAuthRateLimit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;