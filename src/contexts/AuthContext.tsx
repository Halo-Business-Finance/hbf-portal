import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authenticated: boolean;
  loading: boolean;
  formState: number;
  setFormState: (state: number) => void;
  username: string | null;
  setUsername: (username: string | null) => void;
  phone: string | null;
  setPhone: (phone: string | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};

const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Update username from user metadata
        if (session?.user) {
          setUsername(session.user.user_metadata?.name || session.user.email);
        } else {
          setUsername(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setUsername(session.user.user_metadata?.name || session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    // Get safe redirect URL - only allow known production/preview domains
    const getSafeRedirectUrl = (): string => {
      const origin = window.location.origin;
      const allowedPatterns = [
        /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
        /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
      ];
      
      if (allowedPatterns.some(pattern => pattern.test(origin))) {
        return `${origin}/`;
      }
      if (origin.startsWith('https://')) {
        return `${origin}/`;
      }
      return '';
    };
    
    const redirectUrl = getSafeRedirectUrl();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: redirectUrl ? {
        emailRedirectTo: redirectUrl
      } : undefined
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUsername(null);
    setPhone(null);
  };

  const authenticated = !!session?.user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        authenticated,
        loading,
        formState,
        setFormState,
        username,
        setUsername,
        phone,
        setPhone,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;