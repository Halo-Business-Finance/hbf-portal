import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Shield, Smartphone, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useUserRole } from '@/hooks/useUserRole';

// Rate limiting configuration for MFA enrollment
const MFA_RATE_LIMIT = { maxAttempts: 5, windowMs: 60000, lockoutMs: 600000 }; // 10 min lockout

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lockedUntil?: number;
}

const TwoFactorAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [enrolledFactors, setEnrolledFactors] = useState<any[]>([]);
  const [hasEnrolledFactor, setHasEnrolledFactor] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(MFA_RATE_LIMIT.maxAttempts);

  // Rate limiting
  const rateLimitRef = useRef<RateLimitEntry | null>(null);

  const returnTo = (location.state as any)?.returnTo;
  const requireSetup = (location.state as any)?.requireSetup;

  const formatTimeRemaining = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const checkRateLimit = useCallback((): { allowed: boolean; message?: string } => {
    const now = Date.now();
    const current = rateLimitRef.current;

    if (current?.lockedUntil && now < current.lockedUntil) {
      const remainingTime = current.lockedUntil - now;
      return {
        allowed: false,
        message: `Too many verification attempts. Please wait ${formatTimeRemaining(remainingTime)} before trying again.`
      };
    }

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
        message: `Too many verification attempts. Please wait ${formatTimeRemaining(MFA_RATE_LIMIT.lockoutMs)} before trying again.`
      };
    }

    rateLimitRef.current = { ...entry, count: entry.count + 1 };
    setRemainingAttempts(MFA_RATE_LIMIT.maxAttempts - entry.count - 1);
    return { allowed: true };
  }, []);

  useEffect(() => {
    checkEnrollmentStatus();
  }, []);

  const checkEnrollmentStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;

      const verified = data?.all?.filter(f => f.status === 'verified') || [];
      setEnrolledFactors(verified);
      setHasEnrolledFactor(verified.length > 0);
    } catch (error: any) {
      console.error('Error checking MFA status:', error);
      toast({
        title: "Error",
        description: "Failed to check 2FA status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startEnrollment = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      
      toast({
        title: "Success",
        description: "Scan the QR code with your authenticator app",
      });
    } catch (error: any) {
      console.error('Error enrolling MFA:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to start 2FA setup",
        variant: "destructive"
      });
      setEnrolling(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!factorId || !verificationCode) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
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
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode
      });

      if (error) throw error;

      // Reset rate limit on success
      rateLimitRef.current = null;
      setRemainingAttempts(MFA_RATE_LIMIT.maxAttempts);

      toast({
        title: "Success",
        description: "Two-factor authentication has been enabled successfully!",
      });

      // Reset enrollment state
      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      setVerificationCode('');
      setEnrolling(false);
      
      // Redirect to intended destination if this was a required setup
      if (returnTo) {
        navigate(returnTo, { replace: true });
        return;
      }
      
      // Refresh status
      checkEnrollmentStatus();
    } catch (error: any) {
      console.error('Error verifying MFA:', error);
      toast({
        title: "Error",
        description: remainingAttempts > 0 
          ? `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
          : "Invalid verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const unenrollFactor = async (factorIdToRemove: string) => {
    // Prevent admins from disabling MFA
    if (isAdmin()) {
      toast({
        title: "Cannot Disable MFA",
        description: "Admin accounts are required to have two-factor authentication enabled for security.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factorIdToRemove });
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "Two-factor authentication has been disabled",
      });

      checkEnrollmentStatus();
    } catch (error: any) {
      console.error('Error unenrolling MFA:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to disable 2FA",
        variant: "destructive"
      });
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast({
        title: "Copied",
        description: "Secret key copied to clipboard",
      });
    }
  };

  const cancelEnrollment = () => {
    setEnrolling(false);
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    setVerificationCode('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/my-account?tab=account')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Account
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Admin Requirement Alert */}
            {requireSetup && isAdmin() && (
              <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                <Shield className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800 dark:text-orange-200">MFA Required for Admin Access</AlertTitle>
                <AlertDescription className="text-orange-700 dark:text-orange-300">
                  As an administrator, you must enable two-factor authentication to access admin features. This helps protect sensitive data and operations.
                </AlertDescription>
              </Alert>
            )}

            {/* Information Alert */}
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertTitle>What is 2FA?</AlertTitle>
              <AlertDescription>
                Two-factor authentication (2FA) adds an extra layer of security by requiring a verification code from your phone in addition to your password.
              </AlertDescription>
            </Alert>

            {/* Current Status */}
            {hasEnrolledFactor && !enrolling && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-200">2FA Enabled</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Your account is protected with two-factor authentication
                </AlertDescription>
              </Alert>
            )}

            {/* Enrollment Flow */}
            {enrolling && qrCode && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Step 1: Scan QR Code</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code:
                    </p>
                    <div className="flex justify-center p-6 bg-white rounded-lg">
                      <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                    </div>
                  </div>

                  {secret && (
                    <div>
                      <Label>Or enter this code manually:</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={secret}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={copySecret}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Step 2: Verify Code</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter the 6-digit code from your authenticator app:
                    </p>
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="text-center text-2xl tracking-widest font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={verifyEnrollment}
                      disabled={verifying || verificationCode.length !== 6}
                      className="flex-1"
                    >
                      {verifying ? "Verifying..." : "Verify & Enable 2FA"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelEnrollment}
                      disabled={verifying}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {!enrolling && (
              <div className="space-y-4">
                {!hasEnrolledFactor ? (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Recommended</AlertTitle>
                      <AlertDescription>
                        Enable 2FA to significantly improve your account security. You'll need an authenticator app like Google Authenticator or Authy.
                      </AlertDescription>
                    </Alert>
                    <Button onClick={startEnrollment} className="w-full">
                      <Shield className="w-4 h-4 mr-2" />
                      Enable Two-Factor Authentication
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isAdmin() && (
                      <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-700 dark:text-blue-300">
                          Admin accounts cannot disable two-factor authentication for security reasons.
                        </AlertDescription>
                      </Alert>
                    )}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Enrolled Authenticators</h3>
                      {enrolledFactors.map((factor) => (
                        <div key={factor.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{factor.friendly_name || 'Authenticator App'}</p>
                              <p className="text-xs text-muted-foreground">
                                Added on {new Date(factor.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {!isAdmin() && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => unenrollFactor(factor.id)}
                            >
                              Disable
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TwoFactorAuth;
