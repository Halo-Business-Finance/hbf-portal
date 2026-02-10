import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleAppIdOAuthCallback } from '@/services/auth';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const process = async () => {
      const result = await handleAppIdOAuthCallback();
      if (result.error) {
        setError(result.error.message);
        setTimeout(() => navigate('/', { replace: true }), 3000);
      } else {
        navigate('/my-account', { replace: true });
      }
    };
    process();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Authentication failed</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
};

export default AuthCallback;
