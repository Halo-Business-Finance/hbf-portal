/**
 * Centralised backend configuration.
 *
 * The HBF API (Code Engine) uses /api/v1/ as its route prefix.
 * All frontend services import from here for consistent routing.
 */

export const SUPABASE_URL = 'https://zosgzkpfgaaadadezpxo.supabase.co';

export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvc2d6a3BmZ2FhYWRhZGV6cHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzAxMjgsImV4cCI6MjA2OTE0NjEyOH0.r2puMuMTlbLkXqceD7MfC630q_W0K-9GbI632BtFJOY';

/**
 * IBM Code Engine API base URL.
 *
 * Resolution order:
 * 1) VITE_IBM_FUNCTIONS_URL (recommended for overrides)
 * 2) Current origin when app is served from Code Engine
 * 3) Hard-coded production URL
 */
const ENV_IBM_FUNCTIONS_URL = import.meta.env.VITE_IBM_FUNCTIONS_URL?.trim();
const RUNTIME_IBM_FUNCTIONS_URL =
  typeof window !== 'undefined' && window.location.hostname.endsWith('codeengine.appdomain.cloud')
    ? window.location.origin
    : undefined;

const DEFAULT_IBM_FUNCTIONS_URL = 'https://hbf-api.23oqh4gja5d5.us-south.codeengine.appdomain.cloud';

export const IBM_FUNCTIONS_URL: string = ENV_IBM_FUNCTIONS_URL || RUNTIME_IBM_FUNCTIONS_URL || DEFAULT_IBM_FUNCTIONS_URL;

/** The deployed HBF API uses /api/v1 as the base path */
export const IBM_API_PREFIX = '/api/v1';

/**
 * Functions that are handled by the IBM Code Engine API.
 */
export const IBM_PORTED_FUNCTIONS: ReadonlySet<string> = new Set([
  'audit-logger',
  'notification-service',
  'loan-application-processor',
  'appid-auth',
  'update-profile',
  'update_profile',
  'health-check',
  'security-telemetry',
  'send-document-email',
  'admin-dashboard',
]);

/**
 * Resolve the URL for a given function name.
 * IBM-ported functions use /api/v1/{functionName}.
 */
export function functionUrl(functionName: string): string {
  if (IBM_PORTED_FUNCTIONS.has(functionName)) {
    return `${IBM_FUNCTIONS_URL}${IBM_API_PREFIX}/${functionName}`;
  }
  return `${SUPABASE_URL}/functions/v1/${functionName}`;
}

/**
 * Returns true if the given function is routed to IBM Code Engine.
 */
export function isIbmRouted(functionName: string): boolean {
  return !!(IBM_FUNCTIONS_URL && IBM_PORTED_FUNCTIONS.has(functionName));
}

/** @deprecated Use functionUrl() instead */
export function edgeFunctionUrl(functionName: string): string {
  return functionUrl(functionName);
}

/** Storage key prefix for auth tokens */
export const AUTH_STORAGE_PREFIX = 'sb-zosgzkpfgaaadadezpxo';