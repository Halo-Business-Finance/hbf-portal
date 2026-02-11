/**
 * IBM App ID authentication proxy edge function.
 * Handles OIDC flows: token exchange, user info, password operations.
 * The frontend never touches App ID secrets directly.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getEnv(key: string): string {
  const v = Deno.env.get(key);
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

interface AppIdConfig {
  tenantId: string;
  clientId: string;
  secret: string;
  oauthServerUrl: string;
}

function getAppIdConfig(): AppIdConfig {
  return {
    tenantId: getEnv('IBM_APPID_TENANT_ID'),
    clientId: getEnv('IBM_APPID_CLIENT_ID'),
    secret: getEnv('IBM_APPID_SECRET'),
    oauthServerUrl: getEnv('IBM_APPID_OAUTH_SERVER_URL'),
  };
}

// ── Token exchange (authorization_code → tokens) ──
async function exchangeCode(cfg: AppIdConfig, code: string, redirectUri: string) {
  const res = await fetch(`${cfg.oauthServerUrl}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${cfg.clientId}:${cfg.secret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    return { error: `Token exchange failed: ${err}`, status: res.status };
  }
  return { data: await res.json() };
}

// ── Resource Owner Password (direct sign-in) ──
async function signInWithPassword(cfg: AppIdConfig, email: string, password: string) {
  const res = await fetch(`${cfg.oauthServerUrl}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${cfg.clientId}:${cfg.secret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: email,
      password,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    return { error: `Sign in failed: ${err}`, status: res.status };
  }
  return { data: await res.json() };
}

// ── Refresh token ──
async function refreshToken(cfg: AppIdConfig, refreshToken: string) {
  const res = await fetch(`${cfg.oauthServerUrl}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${cfg.clientId}:${cfg.secret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    return { error: `Token refresh failed: ${err}`, status: res.status };
  }
  return { data: await res.json() };
}

// ── User info from access token ──
async function getUserInfo(cfg: AppIdConfig, accessToken: string) {
  const res = await fetch(`${cfg.oauthServerUrl}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    return { error: `User info failed: ${err}`, status: res.status };
  }
  return { data: await res.json() };
}

// ── Cloud Directory: Sign up (SCIM Users endpoint) ──
async function signUp(cfg: AppIdConfig, email: string, password: string) {
  const mgmtUrl = getMgmtUrl(cfg);
  const iamToken = await getIAMToken();
  
  // Try SCIM Users endpoint first
  const res = await fetch(`${mgmtUrl}/cloud_directory/Users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${iamToken}`,
    },
    body: JSON.stringify({
      displayName: email.split('@')[0],
      userName: email,
      password,
      active: true,
      emails: [{ value: email, primary: true }],
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('Sign up error:', err);
    return { error: `Sign up failed: ${err}`, status: res.status };
  }
  return { data: await res.json() };
}

// ── Cloud Directory: Forgot password ──
async function forgotPassword(cfg: AppIdConfig, email: string) {
  const mgmtUrl = getMgmtUrl(cfg);
  const iamToken = await getIAMToken();
  
  const res = await fetch(`${mgmtUrl}/cloud_directory/forgot_password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${iamToken}`,
    },
    body: JSON.stringify({ user: email }),
  });
  if (!res.ok) {
    const err = await res.text();
    return { error: `Forgot password failed: ${err}`, status: res.status };
  }
  return { data: await res.json() };
}

// ── Cloud Directory: Change password ──
async function changePassword(cfg: AppIdConfig, accessToken: string, newPassword: string) {
  const mgmtUrl = getMgmtUrl(cfg);
  const iamToken = await getIAMToken();
  
  // First get user info to find the Cloud Directory user ID
  const userInfo = await getUserInfo(cfg, accessToken);
  if (userInfo.error) return userInfo;
  
  const res = await fetch(`${mgmtUrl}/cloud_directory/change_password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${iamToken}`,
    },
    body: JSON.stringify({
      uuid: userInfo.data.sub,
      newPassword,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    return { error: `Change password failed: ${err}`, status: res.status };
  }
  return { data: await res.json() };
}

// ── Helpers ──
function getMgmtUrl(cfg: AppIdConfig): string {
  const region = cfg.oauthServerUrl.includes('us-south') ? 'us-south'
    : cfg.oauthServerUrl.includes('us-east') ? 'us-east'
    : cfg.oauthServerUrl.includes('eu-gb') ? 'eu-gb'
    : cfg.oauthServerUrl.includes('eu-de') ? 'eu-de'
    : cfg.oauthServerUrl.includes('au-syd') ? 'au-syd'
    : cfg.oauthServerUrl.includes('jp-tok') ? 'jp-tok'
    : 'us-south';
  return `https://${region}.appid.cloud.ibm.com/management/v4/${cfg.tenantId}`;
}

async function getIAMToken(): Promise<string> {
  const apiKey = Deno.env.get('IBM_CLOUD_API_KEY');
  if (!apiKey) throw new Error('Missing IBM_CLOUD_API_KEY for management operations');
  
  const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: apiKey,
    }),
  });
  if (!res.ok) throw new Error('Failed to obtain IAM token');
  const data = await res.json();
  return data.access_token;
}

// ── Build OAuth authorization URL ──
function getAuthorizationUrl(cfg: AppIdConfig, provider: string, redirectUri: string, state: string) {
  const providerMap: Record<string, string> = {
    google: 'google',
    apple: 'apple',
    azure: 'saml', // or configure as OIDC enterprise IDP
    linkedin_oidc: 'linkedin',
  };

  const idp = providerMap[provider] || provider;
  const url = new URL(`${cfg.oauthServerUrl}/authorization`);
  url.searchParams.set('client_id', cfg.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'openid profile email');
  url.searchParams.set('state', state);
  if (idp !== 'cloud_directory') {
    url.searchParams.set('idp', idp);
  }
  return url.toString();
}

// ── Main handler ──
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cfg = getAppIdConfig();
    const { action, ...params } = await req.json();

    switch (action) {
      case 'sign_in': {
        const result = await signInWithPassword(cfg, params.email, params.password);
        if (result.error) return json({ error: result.error }, result.status || 401);
        
        // Get user info for the session
        const userInfo = await getUserInfo(cfg, result.data.access_token);
        return json({
          session: {
            access_token: result.data.access_token,
            refresh_token: result.data.refresh_token,
            expires_in: result.data.expires_in,
            id_token: result.data.id_token,
          },
          user: userInfo.data || null,
        });
      }

      case 'sign_up': {
        const result = await signUp(cfg, params.email, params.password);
        if (result.error) return json({ error: result.error }, result.status || 400);
        return json({ data: result.data });
      }

      case 'exchange_code': {
        const result = await exchangeCode(cfg, params.code, params.redirect_uri);
        if (result.error) return json({ error: result.error }, result.status || 400);
        const userInfo = await getUserInfo(cfg, result.data.access_token);
        return json({
          session: {
            access_token: result.data.access_token,
            refresh_token: result.data.refresh_token,
            expires_in: result.data.expires_in,
            id_token: result.data.id_token,
          },
          user: userInfo.data || null,
        });
      }

      case 'refresh': {
        const result = await refreshToken(cfg, params.refresh_token);
        if (result.error) return json({ error: result.error }, result.status || 401);
        return json({ session: result.data });
      }

      case 'user_info': {
        const result = await getUserInfo(cfg, params.access_token);
        if (result.error) return json({ error: result.error }, result.status || 401);
        return json({ user: result.data });
      }

      case 'forgot_password': {
        const result = await forgotPassword(cfg, params.email);
        if (result.error) return json({ error: result.error }, result.status || 400);
        return json({ data: result.data });
      }

      case 'change_password': {
        const result = await changePassword(cfg, params.access_token, params.new_password);
        if (result.error) return json({ error: result.error }, result.status || 400);
        return json({ data: result.data });
      }

      case 'get_authorization_url': {
        const url = getAuthorizationUrl(cfg, params.provider, params.redirect_uri, params.state || '');
        return json({ url });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error('appid-auth error:', err);
    return json({ error: err.message || 'Internal error' }, 500);
  }
});
