import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Rate limiting configuration for MFA
const MFA_RATE_LIMIT = { maxAttempts: 5, windowMs: 60000, lockoutMs: 900000 }; // 15 min lockout

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lockedUntil?: number;
}

const MFAVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [remainingAttempts, setRemainingAttempts] = useState(MFA_RATE_LIMIT.maxAttempts);
  
  // Rate limiting
  const rateLimitRef = useRef<RateLimitEntry | null>(null);

  const returnTo = (location.state as any)?.returnTo || '/my-account';

  const formatTimeRemaining = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const checkRateLimit = useCallback((): { allowed: boolean; message?: string } => {
    const now = Date.now();
    const current = rateLimitRef.current;

    // Check if currently locked out
    if (current?.lockedUntil && now < current.lockedUntil) {
      const remainingTime = current.lockedUntil - now;
      return {
        allowed: false,
        message: `Too many verification attempts. Please wait ${formatTimeRemaining(remainingTime)} before trying again.`
      };
    }

    // Clean up expired entries
    if (current && now > current.resetTime) {
      rateLimitRef.current = null;
    }

    const entry = rateLimitRef.current;

    if (!entry) {
      rateLimitRef.current = { count: 1, resetTime: now + MFA_RATE_LIMIT.windowMs };
      setRemainingAttempts(MFA_RATE_LIMIT.maxAttempts - 1);
      return { allowed: true };
    }

    if (entry.count >= MFA_RATE_LIMIT.maxAttempts) {
      rateLimitRef.current = {
        ...entry,
        lockedUntil: now + MFA_RATE_LIMIT.lockoutMs,
        resetTime: now + MFA_RATE_LIMIT.lockoutMs
      };
      setRemainingAttempts(0);
      return {
        allowed: false,
        message: `Too many verification attempts. Account temporarily locked for ${formatTimeRemaining(MFA_RATE_LIMIT.lockoutMs)}.`
      };
    }

    rateLimitRef.current = { ...entry, count: entry.count + 1 };
    setRemainingAttempts(MFA_RATE_LIMIT.maxAttempts - entry.count - 1);
    return { allowed: true };
  }, []);

  useEffect(() => {
    initiateMFAChallenge();
  }, []);

  const initiateMFAChallenge = async () => {
    try {
      // Get enrolled factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) throw factorsError;

      const verifiedFactors = factorsData?.totp?.filter(f => f.status === 'verified') || [];
      
      if (verifiedFactors.length === 0) {
        // No MFA enrolled, redirect to enrollment
        toast({
          title: "MFA Required",
          description: "Please set up two-factor authentication first",
        });
        navigate('/two-factor-auth', { state: { returnTo } });
        return;
      }

      // Use the first verified factor
      const factor = verifiedFactors[0];
      setFactorId(factor.id);

      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id
      });

      if (challengeError) throw challengeError;

      setChallengeId(challengeData.id);
    } catch (error: any) {
      console.error('Error initiating MFA challenge:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to initiate MFA verification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyMFA = async () => {
    if (!factorId || !challengeId || verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive"
      });
      return;
    }

    // Check rate limit
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Too Many Attempts",
        description: rateLimitCheck.message,
        variant: "destructive"
      });
      return;
    }

    setVerifying(true);
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verificationCode
      });

      if (error) throw error;

      // Reset rate limit on success
      rateLimitRef.current = null;
      setRemainingAttempts(MFA_RATE_LIMIT.maxAttempts);

      toast({
        title: "Success",
        description: "MFA verification successful",
      });

      // Navigate to the intended destination
      navigate(returnTo, { replace: true });
    } catch (error: any) {
      console.error('Error verifying MFA:', error);
      toast({
        title: "Invalid Code",
        description: remainingAttempts > 0 
          ? `The verification code is incorrect. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
          : "The verification code is incorrect.",
        variant: "destructive"
      });
      setVerificationCode('');
      
      // Create a new challenge after failed attempt
      const { data: newChallenge } = await supabase.auth.mfa.challenge({
        factorId
      });
      if (newChallenge) {
        setChallengeId(newChallenge.id);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length === 6) {
      verifyMFA();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Preparing verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              Admin access requires MFA verification for enhanced security.
              {remainingAttempts < MFA_RATE_LIMIT.maxAttempts && remainingAttempts > 0 && (
                <span className="block mt-1 text-amber-600 font-medium">
                  {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                </span>
              )}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={handleKeyDown}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono h-14"
              autoFocus
            />

            <Button
              onClick={verifyMFA}
              disabled={verifying || verificationCode.length !== 6}
              className="w-full"
            >
              {verifying ? "Verifying..." : "Verify"}
            </Button>

            <div className="flex flex-col gap-2 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => initiateMFAChallenge()}
                className="w-full"
              >
                Request New Code
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MFAVerification;
