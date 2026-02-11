/**
 * Supabase implementation of AuthProviderAPI.
 * Uses direct HTTP calls via supabaseHttp helpers (no SDK dependency).
 * This is a fallback provider — primary auth uses IBM App ID.
 */
import type {
  AuthProviderAPI,
  AuthUser,
  AuthSession,
  AuthEvent,
  MFAFactor,
  MFAEnrollResult,
  MFAAssuranceLevel,
} from './types';

import { SUPABASE_URL as BASE_URL, SUPABASE_ANON_KEY as ANON_KEY, AUTH_STORAGE_PREFIX } from '@/config/supabase';

function getStoredSession(): { access_token: string; refresh_token: string } | null {
  try {
    const raw = localStorage.getItem(`${AUTH_STORAGE_PREFIX}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch { return null; }
}

function storeSession(session: any) {
  localStorage.setItem(`${AUTH_STORAGE_PREFIX}-auth-token`, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(`${AUTH_STORAGE_PREFIX}-auth-token`);
}

function mapUser(u: any): AuthUser | null {
  if (!u) return null;
  return { id: u.id, email: u.email, user_metadata: u.user_metadata };
}

function mapSession(s: any): AuthSession | null {
  if (!s) return null;
  return {
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_at: s.expires_at,
    user: mapUser(s.user)!,
  };
}

async function authFetch(path: string, body?: any): Promise<any> {
  const stored = getStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: ANON_KEY,
    Authorization: `Bearer ${stored?.access_token || ANON_KEY}`,
  };
  const res = await fetch(`${BASE_URL}/auth/v1${path}`, {
    method: body ? 'POST' : 'GET',
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

export const supabaseAuthProvider: AuthProviderAPI = {
  async getSession() {
    const stored = getStoredSession();
    if (!stored?.access_token) return { data: { session: null } };
    // Validate with /auth/v1/user
    const user = await authFetch('/user');
    if (user?.id) {
      return { data: { session: mapSession({ ...stored, user }) } };
    }
    return { data: { session: null } };
  },

  onAuthStateChange(callback) {
    // Minimal implementation — no realtime, just fire initial
    setTimeout(async () => {
      const result = await supabaseAuthProvider.getSession();
      const session = result.data?.session;
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session ?? null);
    }, 0);
    return { unsubscribe: () => {} };
  },

  async signInWithPassword(email, password) {
    const data = await authFetch('/token?grant_type=password', { email, password });
    if (data.error) return { error: { message: data.error_description || data.msg || data.error, status: 400 } };
    storeSession(data);
    return { data: { session: mapSession(data)! } };
  },

  async signUp(email, password, options) {
    const body: any = { email, password };
    if (options?.emailRedirectTo) body.options = { emailRedirectTo: options.emailRedirectTo };
    const data = await authFetch('/signup', body);
    if (data.error) return { error: { message: data.error_description || data.msg || data.error } };
    return {};
  },

  async signOut() {
    await authFetch('/logout', {});
    clearSession();
    return {};
  },

  async resetPasswordForEmail(email, options) {
    const body: any = { email };
    if (options?.redirectTo) body.redirectTo = options.redirectTo;
    const data = await authFetch('/recover', body);
    if (data.error) return { error: { message: data.error } };
    return {};
  },

  async updateUser(attributes) {
    const stored = getStoredSession();
    const res = await fetch(`${BASE_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${stored?.access_token || ANON_KEY}`,
      },
      body: JSON.stringify(attributes),
    });
    const data = await res.json();
    if (data.error) return { error: { message: data.error } };
    return {};
  },

  async signInWithOAuth(_provider, _options) {
    return { error: { message: 'OAuth not supported in fallback provider' } };
  },

  async getUser() {
    const user = await authFetch('/user');
    if (user?.id) return { data: { user: mapUser(user) } };
    return { error: { message: 'Not authenticated' } };
  },

  mfa: {
    async listFactors() { return { data: { totp: [] } }; },
    async enroll(_options) { return { error: { message: 'MFA not supported in fallback' } }; },
    async challengeAndVerify(_options) { return { error: { message: 'MFA not supported in fallback' } }; },
    async challenge(_options) { return { error: { message: 'MFA not supported in fallback' } }; },
    async verify(_options) { return { error: { message: 'MFA not supported in fallback' } }; },
    async unenroll(_options) { return { error: { message: 'MFA not supported in fallback' } }; },
    async getAuthenticatorAssuranceLevel() {
      return { data: { currentLevel: 'aal1' as const, nextLevel: 'aal1' as const } as MFAAssuranceLevel };
    },
  },
};
