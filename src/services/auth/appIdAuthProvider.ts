/**
 * IBM App ID implementation of AuthProviderAPI.
 * Communicates with the HBF API auth endpoints — secrets never touch the browser.
 */
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

import { SUPABASE_ANON_KEY as ANON_KEY, IBM_FUNCTIONS_URL, IBM_API_PREFIX } from '@/config/supabase';

// ── Auth endpoint — the deployed HBF API uses /api/v1/auth/sign-in ──
const AUTH_ENDPOINT = `${IBM_FUNCTIONS_URL}${IBM_API_PREFIX}/auth/sign-in`;

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

// ── Auth diagnostics (exported for admin widget) ──
export interface AuthDiagnostics {
  activeEndpoint: string | null;
  configuredEndpoints: string[];
  lastAction: string | null;
  lastActionTime: string | null;
  lastError: string | null;
  lastErrorTime: string | null;
  failoverAttempts: number;
  totalCalls: number;
  totalFailures: number;
  endpointStats: Record<string, { attempts: number; successes: number; failures: number }>;
}

const _diag: AuthDiagnostics = {
  activeEndpoint: null,
  configuredEndpoints: [AUTH_ENDPOINT],
  lastAction: null,
  lastActionTime: null,
  lastError: null,
  lastErrorTime: null,
  failoverAttempts: 0,
  totalCalls: 0,
  totalFailures: 0,
  endpointStats: { [AUTH_ENDPOINT]: { attempts: 0, successes: 0, failures: 0 } },
};

/** Read-only snapshot of auth diagnostics for admin UI. */
export function getAuthDiagnostics(): AuthDiagnostics {
  return { ..._diag, endpointStats: JSON.parse(JSON.stringify(_diag.endpointStats)) };
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

/**
 * Call the HBF API auth endpoint.
 * The deployed API requires one of: Authorization header, x-session-token, or x-api-key.
 */
async function callEdge(action: string, params: Record<string, unknown> = {}) {
  _diag.totalCalls++;
  _diag.lastAction = action;
  _diag.lastActionTime = new Date().toISOString();

  const epStats = _diag.endpointStats[AUTH_ENDPOINT] || { attempts: 0, successes: 0, failures: 0 };
  epStats.attempts++;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': ANON_KEY,
  };

  // If we have a stored session, also send the bearer token
  const stored = loadSession();
  if (stored?.access_token) {
    headers['Authorization'] = `Bearer ${stored.access_token}`;
  }

  let res: Response;
  try {
    res = await fetch(AUTH_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, ...params }),
    });
  } catch (err) {
    const networkErr = err instanceof Error ? err : new Error('Network error');
    epStats.failures++;
    _diag.endpointStats[AUTH_ENDPOINT] = epStats;
    _diag.totalFailures++;
    _diag.lastError = networkErr.message;
    _diag.lastErrorTime = new Date().toISOString();
    throw new Error(`Unable to reach IBM auth service at ${AUTH_ENDPOINT}: ${networkErr.message}`);
  }

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : { error: await res.text() };

  if (!res.ok || data?.error) {
    epStats.failures++;
    _diag.endpointStats[AUTH_ENDPOINT] = epStats;
    _diag.totalFailures++;
    const rawError = data?.error;
    const errMsg =
      typeof rawError === 'string'
        ? rawError
        : (rawError as { message?: string })?.message || `Auth function error (${res.status})`;
    _diag.lastError = errMsg;
    _diag.lastErrorTime = new Date().toISOString();
    throw new Error(errMsg);
  }

  epStats.successes++;
  _diag.endpointStats[AUTH_ENDPOINT] = epStats;
  _diag.activeEndpoint = AUTH_ENDPOINT;
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
    if (attributes.email) {
      return { error: { message: 'Email change not supported via App ID' } };
    }
    return {};
  },

  async signInWithOAuth(provider, options) {
    try {
      const redirectUri = options?.redirectTo || `${window.location.origin}/auth/callback`;
      const state = crypto.randomUUID();
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

  // MFA stubs — not supported by App ID Cloud Directory
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

// ── OAuth callback handler ──
export async function handleAppIdOAuthCallback(): Promise<AuthResult<{ session: AuthSession }>> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');

  if (!code) return { error: { message: 'No authorization code in callback' } };

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