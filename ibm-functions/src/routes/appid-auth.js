/**
 * IBM App ID Authentication — IBM Cloud Function (Node.js 20 / Express)
 * Ported from supabase/functions/appid-auth/index.ts
 *
 * POST /api/appid-auth
 * Body: { action, ...params }
 *
 * Handles OIDC flows: sign_in, sign_up, exchange_code, refresh,
 * user_info, forgot_password, change_password, get_authorization_url.
 */
import { Router } from 'express';

const router = Router();

// ── Helpers ──

function getEnv(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

function getAppIdConfig() {
  return {
    tenantId: getEnv('IBM_APPID_TENANT_ID'),
    clientId: getEnv('IBM_APPID_CLIENT_ID'),
    secret: getEnv('IBM_APPID_SECRET'),
    oauthServerUrl: getEnv('IBM_APPID_OAUTH_SERVER_URL'),
  };
}

function getMgmtUrl(cfg) {
  const url = cfg.oauthServerUrl;
  const region = url.includes('us-south') ? 'us-south'
    : url.includes('us-east') ? 'us-east'
    : url.includes('eu-gb') ? 'eu-gb'
    : url.includes('eu-de') ? 'eu-de'
    : url.includes('au-syd') ? 'au-syd'
    : url.includes('jp-tok') ? 'jp-tok'
    : 'us-south';
  return `https://${region}.appid.cloud.ibm.com/management/v4/${cfg.tenantId}`;
}

async function getIAMToken() {
  const apiKey = process.env.IBM_CLOUD_API_KEY;
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

// ── Token exchange (authorization_code → tokens) ──
async function exchangeCode(cfg, code, redirectUri) {
  const res = await fetch(`${cfg.oauthServerUrl}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${cfg.clientId}:${cfg.secret}`).toString('base64')}`,
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
async function signInWithPassword(cfg, email, password) {
  const res = await fetch(`${cfg.oauthServerUrl}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${cfg.clientId}:${cfg.secret}`).toString('base64')}`,
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
async function refreshToken(cfg, token) {
  const res = await fetch(`${cfg.oauthServerUrl}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${cfg.clientId}:${cfg.secret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    return { error: `Token refresh failed: ${err}`, status: res.status };
  }
  return { data: await res.json() };
}

// ── User info from access token ──
async function getUserInfo(cfg, accessToken) {
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
async function signUp(cfg, email, password) {
  const mgmtUrl = getMgmtUrl(cfg);
  const iamToken = await getIAMToken();

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
async function forgotPassword(cfg, email) {
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
async function changePassword(cfg, accessToken, newPassword) {
  const mgmtUrl = getMgmtUrl(cfg);
  const iamToken = await getIAMToken();

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

// ── Build OAuth authorization URL ──
function getAuthorizationUrl(cfg, provider, redirectUri, state) {
  const providerMap = {
    google: 'google',
    apple: 'apple',
    azure: 'saml',
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

// ── Route handler ──
router.post('/', async (req, res) => {
  try {
    const cfg = getAppIdConfig();
    const { action, ...params } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action' });
    }

    switch (action) {
      case 'sign_in': {
        const result = await signInWithPassword(cfg, params.email, params.password);
        if (result.error) return res.status(result.status || 401).json({ error: result.error });

        const userInfo = await getUserInfo(cfg, result.data.access_token);
        return res.json({
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
        if (result.error) return res.status(result.status || 400).json({ error: result.error });
        return res.json({ data: result.data });
      }

      case 'exchange_code': {
        const result = await exchangeCode(cfg, params.code, params.redirect_uri);
        if (result.error) return res.status(result.status || 400).json({ error: result.error });
        const userInfo = await getUserInfo(cfg, result.data.access_token);
        return res.json({
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
        if (result.error) return res.status(result.status || 401).json({ error: result.error });
        return res.json({ session: result.data });
      }

      case 'user_info': {
        const result = await getUserInfo(cfg, params.access_token);
        if (result.error) return res.status(result.status || 401).json({ error: result.error });
        return res.json({ user: result.data });
      }

      case 'forgot_password': {
        const result = await forgotPassword(cfg, params.email);
        if (result.error) return res.status(result.status || 400).json({ error: result.error });
        return res.json({ data: result.data });
      }

      case 'change_password': {
        const result = await changePassword(cfg, params.access_token, params.new_password);
        if (result.error) return res.status(result.status || 400).json({ error: result.error });
        return res.json({ data: result.data });
      }

      case 'get_authorization_url': {
        const url = getAuthorizationUrl(cfg, params.provider, params.redirect_uri, params.state || '');
        return res.json({ url });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('appid-auth error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

export default router;
