import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { useMFAStatus } from '@/hooks/useMFAStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[]; // New: allow specific roles
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'user',
  allowedRoles,
  redirectTo = '/'
}) => {
  const { authenticated, loading: authLoading } = useAuth();
  const { hasRole, hasSpecificRole, isSuperAdmin, canAccessAdminPanel, loading: roleLoading } = useUserRole();
  const { mfaEnabled, currentLevel, loading: mfaLoading } = useMFAStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [mfaChecked, setMfaChecked] = useState(false);

  // Check if user has access based on either requiredRole or allowedRoles
  const hasAccess = (): boolean => {
    // If specific roles are allowed, check if user has any of them
    if (allowedRoles && allowedRoles.length > 0) {
      return allowedRoles.some(role => hasSpecificRole(role)) || isSuperAdmin();
    }
    // Otherwise use role hierarchy
    return hasRole(requiredRole);
  };

  // Determine if this is an admin-level route
  const isAdminRoute = requiredRole === 'admin' || requiredRole === 'super_admin' || 
    (allowedRoles && allowedRoles.some(r => ['admin', 'super_admin', 'underwriter', 'customer_service'].includes(r)));

  useEffect(() => {
    if (!authLoading && !authenticated) {
      navigate(redirectTo);
    }
  }, [authenticated, authLoading, navigate, redirectTo]);

  // Handle MFA requirement for admin routes
  useEffect(() => {
    if (authLoading || roleLoading || mfaLoading || mfaChecked) return;
    
    // Only enforce MFA for admin-level routes
    if (isAdminRoute && canAccessAdminPanel()) {
      // Admin-level user trying to access admin route
      if (mfaEnabled && currentLevel !== 'aal2') {
        // MFA is enabled but not verified in this session - redirect to verify
        navigate('/mfa-verify', { 
          state: { returnTo: location.pathname },
          replace: true 
        });
        return;
      }
      
      if (!mfaEnabled) {
        // Admin without MFA enrolled - redirect to setup
        navigate('/two-factor-auth', { 
          state: { returnTo: location.pathname, requireSetup: true },
          replace: true 
        });
        return;
      }
    }
    
    setMfaChecked(true);
  }, [authLoading, roleLoading, mfaLoading, isAdminRoute, canAccessAdminPanel, mfaEnabled, currentLevel, navigate, location.pathname, mfaChecked]);

  if (authLoading || roleLoading || (isAdminRoute && mfaLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect via useEffect
  }

  if (!hasAccess()) {
    const displayRoles = allowedRoles ? allowedRoles.join(', ') : requiredRole;
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this page. Please contact an administrator if you believe this is an error.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              Required role: {displayRoles}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For admin routes, show loading until MFA check is complete
  if (isAdminRoute && !mfaChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying security...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
