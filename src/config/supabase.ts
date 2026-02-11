/**
 * Centralised Supabase / backend configuration.
 * Every service file imports from here instead of duplicating constants.
 */

export const SUPABASE_URL = 'https://zosgzkpfgaaadadezpxo.supabase.co';

export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvc2d6a3BmZ2FhYWRhZGV6cHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzAxMjgsImV4cCI6MjA2OTE0NjEyOH0.r2puMuMTlbLkXqceD7MfC630q_W0K-9GbI632BtFJOY';

/** Helper to build an edge function URL */
export function edgeFunctionUrl(functionName: string): string {
  return `${SUPABASE_URL}/functions/v1/${functionName}`;
}

/** Storage key prefix for auth tokens */
export const AUTH_STORAGE_PREFIX = 'sb-zosgzkpfgaaadadezpxo';
