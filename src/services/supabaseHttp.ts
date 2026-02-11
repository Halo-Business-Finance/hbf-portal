/**
 * Direct HTTP helpers for calling backend REST API and Edge Functions.
 *
 * When IBM_FUNCTIONS_URL is configured, restQuery and callRpc are routed
 * through the IBM Cloud Functions Express server instead of Supabase PostgREST.
 */

import { authProvider } from '@/services/auth';
import {
  SUPABASE_URL as BASE_URL,
  SUPABASE_ANON_KEY as ANON_KEY,
  functionUrl,
  isIbmRouted,
  IBM_FUNCTIONS_URL,
} from '@/config/supabase';

// ── Helpers ──

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await authProvider.getSession();
  const token = data?.session?.access_token;
  return {
    'Content-Type': 'application/json',
    apikey: ANON_KEY,
    Authorization: `Bearer ${token || ANON_KEY}`,
  };
}

// ── Edge Function caller ──

export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: unknown,
): Promise<T> {
  const ibm = isIbmRouted(functionName);
  const headers = await getAuthHeaders();

  // IBM Code Engine doesn't use the Supabase apikey header
  if (ibm) {
    delete headers['apikey'];
  }

  const url = functionUrl(functionName);
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data?.error) {
    throw new Error(data?.error || `${ibm ? 'IBM' : 'Edge'} function ${functionName} error (${res.status})`);
  }
  return data as T;
}

// ── REST API (PostgREST-compatible) caller ──

interface RestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Extra query params appended to the URL */
  params?: URLSearchParams;
  /** If true, adds Prefer: return=representation */
  returnData?: boolean;
  /** Adds Prefer: count=exact and returns { data, count } */
  countOnly?: boolean;
  /** Single-row mode (adds Accept: application/vnd.pgrst.object+json) */
  single?: boolean;
}

export async function restQuery<T = any>(
  table: string,
  options: RestOptions = {},
): Promise<{ data: T; count?: number }> {
  // Route through IBM if configured
  if (IBM_FUNCTIONS_URL) {
    return restQueryViaIbm<T>(table, options);
  }
  return restQueryViaSupabase<T>(table, options);
}

/** Route through IBM Cloud Functions rest-query proxy */
async function restQueryViaIbm<T>(
  table: string,
  options: RestOptions,
): Promise<{ data: T; count?: number }> {
  const { method = 'GET', body, params, returnData, countOnly, single } = options;
  const headers = await getAuthHeaders();
  delete headers['apikey']; // IBM doesn't use Supabase apikey

  // Convert URLSearchParams to plain object for JSON body
  const paramsObj: Record<string, string> = {};
  if (params) {
    params.forEach((v, k) => { paramsObj[k] = v; });
  }

  const res = await fetch(`${IBM_FUNCTIONS_URL}/api/rest-query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ table, method, params: paramsObj, body, returnData, countOnly, single }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error || `REST ${method} ${table} failed (${res.status})`);
  }

  const result = await res.json();
  return { data: result.data as T, count: result.count };
}

/** Original Supabase PostgREST path (fallback) */
async function restQueryViaSupabase<T>(
  table: string,
  options: RestOptions,
): Promise<{ data: T; count?: number }> {
  const { method = 'GET', body, params, returnData, countOnly, single } = options;
  const headers = await getAuthHeaders();

  const preferParts: string[] = [];
  if (returnData) preferParts.push('return=representation');
  if (countOnly) preferParts.push('count=exact');
  if (preferParts.length) headers['Prefer'] = preferParts.join(', ');
  if (single) headers['Accept'] = 'application/vnd.pgrst.object+json';

  const url = new URL(`${BASE_URL}/rest/v1/${table}`);
  if (params) {
    params.forEach((v, k) => url.searchParams.append(k, v));
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err?.message || `REST ${method} ${table} failed (${res.status})`);
  }

  if (countOnly && method === 'GET' && res.headers.get('content-range')) {
    const range = res.headers.get('content-range') || '';
    const total = parseInt(range.split('/').pop() || '0', 10);
    return { data: [] as unknown as T, count: total };
  }

  const data = await res.json();
  const count = res.headers.get('content-range')
    ? parseInt((res.headers.get('content-range') || '').split('/').pop() || '0', 10)
    : undefined;

  return { data, count };
}

// ── RPC caller ──

export async function callRpc<T = any>(
  functionName: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  // Route through IBM if configured
  if (IBM_FUNCTIONS_URL) {
    return callRpcViaIbm<T>(functionName, params);
  }
  return callRpcViaSupabase<T>(functionName, params);
}

/** Route RPC through IBM Cloud Functions */
async function callRpcViaIbm<T>(
  functionName: string,
  params: Record<string, unknown>,
): Promise<T> {
  const headers = await getAuthHeaders();
  delete headers['apikey'];

  const res = await fetch(`${IBM_FUNCTIONS_URL}/api/rpc/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err?.message || err?.error || `RPC ${functionName} failed (${res.status})`);
  }
  return res.json();
}

/** Original Supabase PostgREST RPC path (fallback) */
async function callRpcViaSupabase<T>(
  functionName: string,
  params: Record<string, unknown>,
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err?.message || `RPC ${functionName} failed (${res.status})`);
  }
  return res.json();
}

// ── Storage helpers ──

async function getStorageHeaders(contentType?: string): Promise<Record<string, string>> {
  const { data } = await authProvider.getSession();
  const token = data?.session?.access_token;
  const headers: Record<string, string> = {
    apikey: ANON_KEY,
    Authorization: `Bearer ${token || ANON_KEY}`,
  };
  if (contentType) headers['Content-Type'] = contentType;
  return headers;
}

export async function storageUpload(
  bucket: string,
  path: string,
  file: File,
  options?: { cacheControl?: string; upsert?: boolean },
): Promise<{ key: string }> {
  const headers = await getStorageHeaders();
  if (options?.cacheControl) headers['cache-control'] = options.cacheControl;
  if (options?.upsert) headers['x-upsert'] = 'true';

  const formData = new FormData();
  formData.append('', file);

  const res = await fetch(`${BASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err?.error || err?.message || `Storage upload failed (${res.status})`);
  }
  return res.json();
}

export async function storageCreateSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number,
): Promise<string> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/storage/v1/object/sign/${bucket}/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ expiresIn }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err?.error || err?.message || `Signed URL failed (${res.status})`);
  }
  const data = await res.json();
  return `${BASE_URL}/storage/v1${data.signedURL}`;
}

export async function storageRemove(
  bucket: string,
  paths: string[],
): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/storage/v1/object/${bucket}`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ prefixes: paths }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err?.error || err?.message || `Storage delete failed (${res.status})`);
  }
}
