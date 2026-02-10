/**
 * Centralized auth types — backend-agnostic interfaces.
 * The AuthContext uses these; the concrete provider (Supabase / IBM App ID) implements them.
 */

/** Minimal user representation shared across providers */
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

/** Minimal session representation */
export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: AuthUser;
}

/** Auth state change events */
export type AuthEvent =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | 'MFA_CHALLENGE_VERIFIED'
  | 'INITIAL_SESSION';

/** MFA factor info */
export interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
}

/** MFA enrollment result */
export interface MFAEnrollResult {
  id: string;
  totp: { qr_code: string; secret: string; uri: string };
}

/** MFA assurance level */
export interface MFAAssuranceLevel {
  currentLevel: 'aal1' | 'aal2';
  nextLevel: 'aal1' | 'aal2';
}

/** OAuth / social login provider identifiers */
export type OAuthProvider = 'google' | 'apple' | 'azure' | 'linkedin_oidc';

/** Result wrapper for auth operations */
export interface AuthResult<T = void> {
  data?: T;
  error?: { message: string; status?: number } | null;
}

// --- Provider interface ---

export interface AuthProviderAPI {
  // Session lifecycle
  getSession(): Promise<AuthResult<{ session: AuthSession | null }>>;
  onAuthStateChange(
    callback: (event: AuthEvent, session: AuthSession | null) => void,
  ): { unsubscribe: () => void };

  // Email / password
  signInWithPassword(email: string, password: string): Promise<AuthResult<{ session: AuthSession }>>;
  signUp(email: string, password: string, options?: { emailRedirectTo?: string }): Promise<AuthResult>;
  signOut(): Promise<AuthResult>;

  // Password management
  resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Promise<AuthResult>;
  updateUser(attributes: { password?: string; email?: string }): Promise<AuthResult>;

  // OAuth / Social
  signInWithOAuth(provider: OAuthProvider, options?: { redirectTo?: string }): Promise<AuthResult>;

  // MFA
  mfa: {
    listFactors(): Promise<AuthResult<{ totp: MFAFactor[] }>>;
    enroll(options: { factorType: 'totp'; friendlyName?: string }): Promise<AuthResult<MFAEnrollResult>>;
    challengeAndVerify(options: { factorId: string; code: string }): Promise<AuthResult>;
    challenge(options: { factorId: string }): Promise<AuthResult<{ id: string }>>;
    verify(options: { factorId: string; challengeId: string; code: string }): Promise<AuthResult>;
    unenroll(options: { factorId: string }): Promise<AuthResult>;
    getAuthenticatorAssuranceLevel(): Promise<AuthResult<MFAAssuranceLevel>>;
  };

  // Utility — get current user (server-validated)
  getUser(): Promise<AuthResult<{ user: AuthUser | null }>>;
}
