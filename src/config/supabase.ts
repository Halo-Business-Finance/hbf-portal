/**
 * Centralised Supabase / backend configuration.
 * Every service file imports from here instead of duplicating constants.
 *
 * When IBM_FUNCTIONS_URL is set, the three ported edge functions
 * (audit-logger, notification-service, loan-application-processor)
 * are routed to the IBM Code Engine API instead of Supabase Edge Functions.
 */

export const SUPABASE_URL = 'https://zosgzkpfgaaadadezpxo.supabase.co';

export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvc2d6a3BmZ2FhYWRhZGV6cHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzAxMjgsImV4cCI6MjA2OTE0NjEyOH0.r2puMuMTlbLkXqceD7MfC630q_W0K-9GbI632BtFJOY';

/**
 * IBM Code Engine Functions API base URL.
 *
 * Resolution order:
 * 1) VITE_IBM_FUNCTIONS_URL (recommended)
 * 2) Current origin when app is served from *.codeengine.appdomain.cloud
 * 3) undefined (falls back to Supabase routes)
 */
const ENV_IBM_FUNCTIONS_URL = import.meta.env.VITE_IBM_FUNCTIONS_URL?.trim();
const RUNTIME_IBM_FUNCTIONS_URL =
  typeof window !== 'undefined' && window.location.hostname.endsWith('codeengine.appdomain.cloud')
    ? window.location.origin
    : undefined;

export const IBM_FUNCTIONS_URL: string | undefined = ENV_IBM_FUNCTIONS_URL || RUNTIME_IBM_FUNCTIONS_URL;

/**
 * Functions that have been ported to the IBM Code Engine API.
 * When IBM_FUNCTIONS_URL is configured, calls to these functions
 * are routed to `${IBM_FUNCTIONS_URL}/api/${functionName}` instead
 * of the Supabase edge function URL.
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
 * If the function has been ported and IBM_FUNCTIONS_URL is configured,
 * returns the IBM Code Engine endpoint; otherwise falls back to Supabase.
 */
export function functionUrl(functionName: string): string {
  if (IBM_FUNCTIONS_URL && IBM_PORTED_FUNCTIONS.has(functionName)) {
    return `${IBM_FUNCTIONS_URL}/api/${functionName}`;
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
