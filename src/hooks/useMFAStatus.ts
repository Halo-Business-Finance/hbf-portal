import { useState, useEffect, useCallback } from 'react';
import { authProvider } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';

export type MFALevel = 'aal1' | 'aal2';

export const useMFAStatus = () => {
  const { user, authenticated } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<MFALevel>('aal1');
  const [loading, setLoading] = useState(true);

  const checkMFAStatus = useCallback(async () => {
    if (!authenticated || !user) {
      setMfaEnabled(false);
      setCurrentLevel('aal1');
      setLoading(false);
      return;
    }

    try {
      // Check current AAL (Authentication Assurance Level)
      const aalResult = await authProvider.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalResult.error) {
        console.error('Error getting AAL:', aalResult.error);
        setLoading(false);
        return;
      }

      setCurrentLevel(aalResult.data?.currentLevel || 'aal1');

      // Check if user has enrolled MFA factors
      const factorsResult = await authProvider.mfa.listFactors();
      
      if (factorsResult.error) {
        console.error('Error listing factors:', factorsResult.error);
        setLoading(false);
        return;
      }

      const verifiedFactors = factorsResult.data?.totp?.filter(f => f.status === 'verified') || [];
      setMfaEnabled(verifiedFactors.length > 0);
    } catch (error) {
      console.error('Error checking MFA status:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authenticated]);

  useEffect(() => {
    checkMFAStatus();
  }, [checkMFAStatus]);

  // Check if user needs to verify MFA (has MFA enabled but current session is only AAL1)
  const needsMFAVerification = mfaEnabled && currentLevel === 'aal1';

  // Check if user has achieved AAL2 (fully authenticated with MFA)
  const isFullyAuthenticated = currentLevel === 'aal2';

  return {
    mfaEnabled,
    currentLevel,
    loading,
    needsMFAVerification,
    isFullyAuthenticated,
    refreshStatus: checkMFAStatus
  };
};
