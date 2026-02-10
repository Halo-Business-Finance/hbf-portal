/**
 * Supabase implementation of AuthProviderAPI.
 * Wraps @supabase/supabase-js auth calls into the provider interface.
 */
import { supabase } from '@/integrations/supabase/client';
import type {
  AuthProviderAPI,
  AuthUser,
  AuthSession,
  AuthEvent,
  AuthResult,
  MFAFactor,
  MFAEnrollResult,
  MFAAssuranceLevel,
  OAuthProvider,
} from './types';
import type { AuthChangeEvent } from '@supabase/supabase-js';

// --- Mappers ---

function mapUser(u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null): AuthUser | null {
  if (!u) return null;
  return { id: u.id, email: u.email, user_metadata: u.user_metadata };
}

function mapSession(s: { access_token: string; refresh_token?: string; expires_at?: number; user: any } | null): AuthSession | null {
  if (!s) return null;
  return {
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_at: s.expires_at,
    user: mapUser(s.user)!,
  };
}

const EVENT_MAP: Record<string, AuthEvent> = {
  SIGNED_IN: 'SIGNED_IN',
  SIGNED_OUT: 'SIGNED_OUT',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  USER_UPDATED: 'USER_UPDATED',
  PASSWORD_RECOVERY: 'PASSWORD_RECOVERY',
  MFA_CHALLENGE_VERIFIED: 'MFA_CHALLENGE_VERIFIED',
  INITIAL_SESSION: 'INITIAL_SESSION',
};

function mapEvent(e: AuthChangeEvent): AuthEvent {
  return EVENT_MAP[e] ?? 'SIGNED_IN';
}

// --- Provider ---

export const supabaseAuthProvider: AuthProviderAPI = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { error: { message: error.message } };
    return { data: { session: mapSession(data.session) } };
  },

  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(mapEvent(event), mapSession(session));
    });
    return { unsubscribe: () => subscription.unsubscribe() };
  },

  async signInWithPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: { message: error.message, status: error.status } };
    return { data: { session: mapSession(data.session)! } };
  },

  async signUp(email, password, options) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: options?.emailRedirectTo ? { emailRedirectTo: options.emailRedirectTo } : undefined,
    });
    if (error) return { error: { message: error.message } };
    return {};
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: { message: error.message } };
    return {};
  },

  async resetPasswordForEmail(email, options) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, options);
    if (error) return { error: { message: error.message } };
    return {};
  },

  async updateUser(attributes) {
    const { error } = await supabase.auth.updateUser(attributes);
    if (error) return { error: { message: error.message } };
    return {};
  },

  async signInWithOAuth(provider, options) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: options?.redirectTo ? { redirectTo: options.redirectTo } : undefined,
    });
    if (error) return { error: { message: error.message } };
    return {};
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) return { error: { message: error.message } };
    return { data: { user: mapUser(data.user) } };
  },

  mfa: {
    async listFactors() {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) return { error: { message: error.message } };
      const totp: MFAFactor[] = (data?.totp ?? []).map((f) => ({
        id: f.id,
        friendly_name: f.friendly_name ?? undefined,
        factor_type: 'totp' as const,
        status: f.status as 'verified' | 'unverified',
      }));
      return { data: { totp } };
    },

    async enroll(options) {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: options.factorType,
        friendlyName: options.friendlyName,
      });
      if (error) return { error: { message: error.message } };
      return {
        data: {
          id: data.id,
          totp: { qr_code: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri },
        } as MFAEnrollResult,
      };
    },

    async challengeAndVerify(options) {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: options.factorId,
        code: options.code,
      });
      if (error) return { error: { message: error.message } };
      return {};
    },

    async challenge(options) {
      const { data, error } = await supabase.auth.mfa.challenge({ factorId: options.factorId });
      if (error) return { error: { message: error.message } };
      return { data: { id: data.id } };
    },

    async verify(options) {
      const { error } = await supabase.auth.mfa.verify({
        factorId: options.factorId,
        challengeId: options.challengeId,
        code: options.code,
      });
      if (error) return { error: { message: error.message } };
      return {};
    },

    async unenroll(options) {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: options.factorId });
      if (error) return { error: { message: error.message } };
      return {};
    },

    async getAuthenticatorAssuranceLevel() {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) return { error: { message: error.message } };
      return {
        data: {
          currentLevel: data.currentLevel as 'aal1' | 'aal2',
          nextLevel: data.nextLevel as 'aal1' | 'aal2',
        } as MFAAssuranceLevel,
      };
    },
  },
};
