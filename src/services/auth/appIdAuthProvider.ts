/**
 * IBM App ID implementation of AuthProviderAPI.
 * Communicates with the appid-auth edge function — secrets never touch the browser.
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

import { functionUrl, SUPABASE_ANON_KEY as ANON_KEY, SUPABASE_URL, isIbmRouted, IBM_FUNCTIONS_URL } from '@/config/supabase';

// ── Edge function endpoint ──
const EDGE_FUNCTION_URL = functionUrl('appid-auth');
const SUPABASE_APPID_AUTH_URL = `${SUPABASE_URL}/functions/v1/appid-auth`;
const NORMALIZED_IBM_BASE_URL = IBM_FUNCTIONS_URL.replace(/\/+$/, '');
const API_DOMAIN_BASE_URL = 'https://api.halobusinessfinance.com';

// Build all candidate endpoints — the failover loop tries each in order
const AUTH_ENDPOINTS = Array.from(
  new Set([
    // Primary: configured IBM endpoint
    EDGE_FUNCTION_URL,
    // v1 API routes on IBM domain (deployed version uses /api/v1/)
    `${NORMALIZED_IBM_BASE_URL}/api/v1/auth/sign-in`,
    `${NORMALIZED_IBM_BASE_URL}/api/v1/auth/appid`,
    `${NORMALIZED_IBM_BASE_URL}/api/v1/appid-auth`,
    `${NORMALIZED_IBM_BASE_URL}/api/v1/auth/appid-auth`,
    // Production custom domain
    `${API_DOMAIN_BASE_URL}/api/v1/auth/sign-in`,
    `${API_DOMAIN_BASE_URL}/api/v1/auth/appid`,
    `${API_DOMAIN_BASE_URL}/api/appid-auth`,
    `${API_DOMAIN_BASE_URL}/api/v1/appid-auth`,
    // Legacy/fallback
    'https://hbf-api.23oqh4gja5d5.us-south.codeengine.appdomain.cloud/api/appid-auth',
    SUPABASE_APPID_AUTH_URL,
  ])
);

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
  configuredEndpoints: [...AUTH_ENDPOINTS],
  lastAction: null,
  lastActionTime: null,
  lastError: null,
  lastErrorTime: null,
  failoverAttempts: 0,
  totalCalls: 0,
  totalFailures: 0,
  endpointStats: Object.fromEntries(AUTH_ENDPOINTS.map(ep => [ep, { attempts: 0, successes: 0, failures: 0 }])),
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

async function callEdge(action: string, params: Record<string, unknown> = {}) {
  _diag.totalCalls++;
  _diag.lastAction = action;
  _diag.lastActionTime = new Date().toISOString();

  const ibm = isIbmRouted('appid-auth');
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ANON_KEY}`,
  };

  let lastNetworkError: Error | null = null;
  let attemptIndex = 0;

  for (const endpoint of AUTH_ENDPOINTS) {
    attemptIndex++;
    const epStats = _diag.endpointStats[endpoint] || { attempts: 0, successes: 0, failures: 0 };
    epStats.attempts++;

    const isSupabaseEndpoint = endpoint.includes('/functions/v1/');
    const isIbmApiEndpoint = endpoint.includes('codeengine.appdomain.cloud') || endpoint.includes('api.halobusinessfinance.com');

    const endpointHeaders: Record<string, string> = {
      ...baseHeaders,
      ...(isSupabaseEndpoint || !ibm ? { apikey: ANON_KEY } : {}),
      ...(isIbmApiEndpoint ? { 'x-api-key': ANON_KEY } : {}),
    };

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: endpointHeaders,
        body: JSON.stringify({ action, ...params }),
      });
    } catch (err) {
      lastNetworkError = err instanceof Error ? err : new Error('Network error');
      epStats.failures++;
      _diag.endpointStats[endpoint] = epStats;
      if (attemptIndex > 1) _diag.failoverAttempts++;
      continue;
    }

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await res.json()
      : { error: await res.text() };

    if (!res.ok || data?.error) {
      epStats.failures++;
      _diag.endpointStats[endpoint] = epStats;
      _diag.totalFailures++;
      const rawError = data?.error;
      const errMsg =
        typeof rawError === 'string'
          ? rawError
          : (rawError as { message?: string })?.message || `Auth function error (${res.status})`;
      _diag.lastError = errMsg;
      _diag.lastErrorTime = new Date().toISOString();

      const lowerErr = String(errMsg).toLowerCase();
      const shouldFailover =
        res.status === 404 ||
        res.status === 405 ||
        res.status >= 500 ||
        lowerErr.includes('endpoint not found') ||
        lowerErr.includes('not found');

      if (shouldFailover) {
        lastNetworkError = new Error(errMsg);
        if (attemptIndex < AUTH_ENDPOINTS.length) _diag.failoverAttempts++;
        continue;
      }

      throw new Error(errMsg);
    }

    epStats.successes++;
    _diag.endpointStats[endpoint] = epStats;
    _diag.activeEndpoint = endpoint;
    return data;
  }

  _diag.totalFailures++;
  const errMsg = `Unable to reach IBM auth service. Checked: ${AUTH_ENDPOINTS.join(', ')}${lastNetworkError ? ` (${lastNetworkError.message})` : ''}`;
  _diag.lastError = errMsg;
  _diag.lastErrorTime = new Date().toISOString();
  throw new Error(errMsg);
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
