/**
 * Central auth API — single import for all components.
 *
 * To switch auth backends, change the provider import here.
 * e.g. swap `supabaseAuthProvider` → `appIdAuthProvider`
 */
export type {
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

import { supabaseAuthProvider } from './supabaseAuthProvider';
import { appIdAuthProvider, handleAppIdOAuthCallback } from './appIdAuthProvider';

/**
 * Switch auth backend by changing this line.
 * - supabaseAuthProvider  → Supabase Auth (current default)
 * - appIdAuthProvider     → IBM App ID (OIDC/Cloud Directory)
 */
export const authProvider = supabaseAuthProvider;

export { appIdAuthProvider, handleAppIdOAuthCallback };
