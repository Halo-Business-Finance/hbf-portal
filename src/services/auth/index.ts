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

export const authProvider = supabaseAuthProvider;
