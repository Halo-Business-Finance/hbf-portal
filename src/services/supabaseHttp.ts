/**
 * Direct HTTP helpers for calling Supabase Edge Functions and REST API
 * without importing @supabase/supabase-js.
 *
 * This module centralises the base URL and anon key so every service
 * can be decoupled from the Supabase client library.
 */

import { authProvider } from '@/services/auth';
import { SUPABASE_URL as BASE_URL, SUPABASE_ANON_KEY as ANON_KEY } from '@/config/supabase';

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
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data?.error) {
    throw new Error(data?.error || `Edge function ${functionName} error (${res.status})`);
  }
  return data as T;
}

// ── REST API (PostgREST) caller ──

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
    // HEAD-like count query: parse content-range
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
