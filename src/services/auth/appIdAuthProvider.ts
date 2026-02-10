/**
 * IBM App ID implementation of AuthProviderAPI.
 * Communicates with the appid-auth edge function — secrets never touch the browser.
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

// ── Storage keys ──
const TOKEN_KEY = 'appid_session';
const CALLBACK_KEY = 'appid_oauth_callback';

interface StoredSession {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_at?: number;
  user: AuthUser;
}

// ── Helpers ──

function storeSession(s: StoredSession) {
  try { localStorage.setItem(TOKEN_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearSession() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* noop */ }
}

function toAuthSession(s: StoredSession): AuthSession {
  return {
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_at: s.expires_at,
    user: s.user,
  };
}

function mapOIDCUser(info: Record<string, unknown>): AuthUser {
  return {
    id: (info.sub as string) || '',
    email: (info.email as string) || undefined,
    user_metadata: {
      name: info.name,
      given_name: info.given_name,
      family_name: info.family_name,
      picture: info.picture,
    },
  };
}

async function callEdge(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('appid-auth', {
    body: { action, ...params },
  });
  if (error) throw new Error(error.message || 'Edge function error');
  if (data?.error) throw new Error(data.error);
  return data;
}

// ── Auth state listener registry ──
type Listener = (event: AuthEvent, session: AuthSession | null) => void;
const listeners = new Set<Listener>();

function notify(event: AuthEvent, session: AuthSession | null) {
  listeners.forEach((cb) => {
    try { cb(event, session); } catch { /* swallow */ }
  });
}

// ── Provider implementation ──

export const appIdAuthProvider: AuthProviderAPI = {

  async getSession() {
    const stored = loadSession();
    if (!stored) return { data: { session: null } };

    // Check expiry — refresh if within 5 min
    if (stored.expires_at && Date.now() / 1000 > stored.expires_at - 300) {
      if (stored.refresh_token) {
        try {
          const res = await callEdge('refresh', { refresh_token: stored.refresh_token });
          const refreshed: StoredSession = {
            access_token: res.session.access_token,
            refresh_token: res.session.refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + (res.session.expires_in || 3600),
            user: stored.user,
          };
          storeSession(refreshed);
          return { data: { session: toAuthSession(refreshed) } };
        } catch {
          clearSession();
          return { data: { session: null } };
        }
      }
      clearSession();
      return { data: { session: null } };
    }

    return { data: { session: toAuthSession(stored) } };
  },

  onAuthStateChange(callback) {
    listeners.add(callback);

    // Fire initial session
    const stored = loadSession();
    if (stored) {
      queueMicrotask(() => callback('INITIAL_SESSION', toAuthSession(stored)));
    } else {
      queueMicrotask(() => callback('INITIAL_SESSION', null));
    }

    return { unsubscribe: () => { listeners.delete(callback); } };
  },

  async signInWithPassword(email, password) {
    try {
      const res = await callEdge('sign_in', { email, password });
      const user = mapOIDCUser(res.user || {});
      const session: StoredSession = {
        access_token: res.session.access_token,
        refresh_token: res.session.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + (res.session.expires_in || 3600),
        user,
      };
      storeSession(session);
      notify('SIGNED_IN', toAuthSession(session));
      return { data: { session: toAuthSession(session) } };
    } catch (err: any) {
      return { error: { message: err.message, status: 401 } };
    }
  },

  async signUp(email, password) {
    try {
      await callEdge('sign_up', { email, password });
      return {};
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  },

  async signOut() {
    clearSession();
    notify('SIGNED_OUT', null);
    return {};
  },

  async resetPasswordForEmail(email) {
    try {
      await callEdge('forgot_password', { email });
      return {};
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  },

  async updateUser(attributes) {
    if (attributes.password) {
      const stored = loadSession();
      if (!stored) return { error: { message: 'Not authenticated' } };
      try {
        await callEdge('change_password', {
          access_token: stored.access_token,
          new_password: attributes.password,
        });
        return {};
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    // Email change not supported via App ID Cloud Directory in this flow
    if (attributes.email) {
      return { error: { message: 'Email change not supported via App ID' } };
    }
    return {};
  },

  async signInWithOAuth(provider, options) {
    try {
      const redirectUri = options?.redirectTo || `${window.location.origin}/auth/callback`;
      const state = crypto.randomUUID();
      // Store state for CSRF verification
      sessionStorage.setItem(CALLBACK_KEY, JSON.stringify({ state, redirectUri }));

      const res = await callEdge('get_authorization_url', {
        provider,
        redirect_uri: redirectUri,
        state,
      });
      window.location.href = res.url;
      return {};
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  },

  async getUser() {
    const stored = loadSession();
    if (!stored) return { data: { user: null } };
    try {
      const res = await callEdge('user_info', { access_token: stored.access_token });
      const user = mapOIDCUser(res.user || {});
      return { data: { user } };
    } catch {
      return { data: { user: stored.user } };
    }
  },

  // MFA is not natively supported by App ID Cloud Directory.
  // These stubs allow the UI to function without errors.
  mfa: {
    async listFactors(): Promise<AuthResult<{ totp: MFAFactor[] }>> {
      return { data: { totp: [] } };
    },
    async enroll(): Promise<AuthResult<MFAEnrollResult>> {
      return { error: { message: 'MFA not supported by IBM App ID provider' } };
    },
    async challengeAndVerify(): Promise<AuthResult> {
      return { error: { message: 'MFA not supported by IBM App ID provider' } };
    },
    async challenge(): Promise<AuthResult<{ id: string }>> {
      return { error: { message: 'MFA not supported by IBM App ID provider' } };
    },
    async verify(): Promise<AuthResult> {
      return { error: { message: 'MFA not supported by IBM App ID provider' } };
    },
    async unenroll(): Promise<AuthResult> {
      return { error: { message: 'MFA not supported by IBM App ID provider' } };
    },
    async getAuthenticatorAssuranceLevel(): Promise<AuthResult<MFAAssuranceLevel>> {
      return { data: { currentLevel: 'aal1', nextLevel: 'aal1' } };
    },
  },
};

// ── OAuth callback handler (call from /auth/callback route) ──
export async function handleAppIdOAuthCallback(): Promise<AuthResult<{ session: AuthSession }>> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');

  if (!code) return { error: { message: 'No authorization code in callback' } };

  // Verify CSRF state
  const stored = sessionStorage.getItem(CALLBACK_KEY);
  if (stored) {
    const { state: expectedState, redirectUri } = JSON.parse(stored);
    if (state !== expectedState) {
      return { error: { message: 'State mismatch — possible CSRF attack' } };
    }
    sessionStorage.removeItem(CALLBACK_KEY);

    try {
      const res = await callEdge('exchange_code', { code, redirect_uri: redirectUri });
      const user = mapOIDCUser(res.user || {});
      const session: StoredSession = {
        access_token: res.session.access_token,
        refresh_token: res.session.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + (res.session.expires_in || 3600),
        user,
      };
      storeSession(session);
      notify('SIGNED_IN', toAuthSession(session));
      return { data: { session: toAuthSession(session) } };
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  }

  return { error: { message: 'Missing OAuth callback state' } };
}
