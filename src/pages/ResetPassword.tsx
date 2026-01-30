import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowRight, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useScrollBounce } from '@/hooks/useScrollBounce';

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Password requirements check
const getPasswordRequirements = (password: string) => [
  { met: password.length >= 8, label: 'At least 8 characters' },
  { met: /[a-z]/.test(password), label: 'One lowercase letter' },
  { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
  { met: /\d/.test(password), label: 'One number' },
  { met: /[^a-zA-Z0-9]/.test(password), label: 'One special character' },
];

// Password strength calculation
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  const requirements = getPasswordRequirements(password);
  const metCount = requirements.filter(r => r.met).length;
  
  if (metCount <= 2) return { score: metCount, label: 'Weak', color: 'bg-red-500' };
  if (metCount <= 4) return { score: metCount, label: 'Medium', color: 'bg-yellow-500' };
  return { score: metCount, label: 'Strong', color: 'bg-green-500' };
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { onScroll, bounceClass } = useScrollBounce();

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        toast({
          title: "Invalid or Expired Link",
          description: "This password reset link is invalid or has expired. Please request a new one.",
          variant: "destructive"
        });
      }
      setIsLoading(false);
    };

    // Listen for auth state changes (recovery token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setIsLoading(false);
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, [toast]);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your password has been reset successfully",
      });
      
      form.reset();
      setPasswordUpdated(true);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to reset password",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const newPassword = form.watch('newPassword');
  const hasNewPassword = newPassword.length > 0;

  const renderLoadingState = () => (
    <div className="w-full text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
      <p className="text-black">Verifying reset link...</p>
    </div>
  );

  const renderInvalidState = () => (
    <div className="w-full text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <Lock className="h-8 w-8 text-red-600" />
      </div>
      <h1 className="text-xl font-normal text-black mb-3">
        Invalid Reset Link
      </h1>
      <p className="text-black mb-8">
        This password reset link is invalid or has expired. Please request a new password reset.
      </p>
      <Button 
        type="button"
        className="w-full h-12 text-base font-medium justify-center rounded-full bg-[#d71e28] hover:bg-[#b91920] text-white transition-all duration-200 hover:shadow-md"
        onClick={() => navigate('/forgot-password')}
      >
        Request New Reset Link
      </Button>
    </div>
  );

  const renderSuccessState = () => (
    <div className="w-full text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h1 className="text-xl font-normal text-black mb-3">
        Password Reset Complete
      </h1>
      <p className="text-black mb-8">
        Your password has been successfully reset. You can now sign in with your new password.
      </p>
      <Button 
        type="button"
        className="w-full h-12 text-base font-medium justify-center rounded-full bg-[#d71e28] hover:bg-[#b91920] text-white transition-all duration-200 hover:shadow-md"
        onClick={() => navigate('/')}
      >
        Sign In
      </Button>
    </div>
  );

  const renderFormState = () => (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-normal text-black mb-3">
          Reset your password
        </h1>
        <p className="text-black">
          Enter your new password below.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Show all passwords toggle */}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowAllPasswords(!showAllPasswords)}
              className="flex items-center gap-2 text-sm text-black hover:text-gray-700 transition-colors"
            >
              {showAllPasswords ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showAllPasswords ? 'Hide passwords' : 'Show passwords'}
            </button>
          </div>

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field, fieldState }) => {
              const strength = getPasswordStrength(field.value);
              const requirements = getPasswordRequirements(field.value);
              return (
                <FormItem>
                  <Label htmlFor="newPassword" className="text-sm text-black mb-2 block">
                    New password
                  </Label>
                  <FormControl>
                    <Input 
                      id="newPassword"
                      type={showAllPasswords ? "text" : "password"}
                      className={`h-14 bg-white border rounded-xl px-5 focus:ring-0 transition-colors placeholder:text-gray-400 text-gray-700 ${
                        fieldState.error 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Enter new password"
                      {...field} 
                    />
                  </FormControl>
                  {/* Password strength indicator */}
                  {field.value && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              level <= strength.score ? strength.color : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${
                        strength.label === 'Weak' ? 'text-red-600' : 
                        strength.label === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        Password strength: {strength.label}
                      </p>
                      {/* Requirements checklist */}
                      <ul className="space-y-1 mt-2">
                        {requirements.map((req, index) => (
                          <li 
                            key={index}
                            className={`text-xs flex items-center gap-2 transition-colors duration-200 ${
                              req.met ? 'text-green-600' : 'text-gray-500'
                            }`}
                          >
                            {req.met ? (
                              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                            ) : (
                              <div className="h-3.5 w-3.5 rounded-full border border-gray-400 flex-shrink-0" />
                            )}
                            {req.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => {
              const confirmPassword = field.value;
              const showMatch = confirmPassword.length > 0;
              const passwordsMatch = newPassword === confirmPassword;
              
              return (
                <FormItem>
                  <Label htmlFor="confirmPassword" className="text-sm text-black mb-2 block">
                    Confirm new password
                  </Label>
                  <FormControl>
                    <Input 
                      id="confirmPassword"
                      type={showAllPasswords ? "text" : "password"}
                      className={`h-14 bg-white border rounded-xl px-5 transition-colors placeholder:text-gray-400 text-gray-700 focus:ring-0 ${
                        fieldState.error
                          ? 'border-red-500 focus:border-red-500'
                          : showMatch 
                            ? passwordsMatch 
                              ? 'border-green-500 focus:border-green-500' 
                              : 'border-red-400 focus:border-red-400'
                            : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Confirm new password"
                      {...field} 
                    />
                  </FormControl>
                  {/* Password match indicator */}
                  {showMatch && !fieldState.error && (
                    <p className={`text-xs flex items-center gap-1.5 mt-2 transition-colors duration-200 ${
                      passwordsMatch ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {passwordsMatch ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" />
                          Passwords match
                        </>
                      ) : (
                        <>
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-red-400 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 bg-red-400 rounded-full" />
                          </div>
                          Passwords do not match
                        </>
                      )}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <Button 
            type="submit" 
            variant="outline"
            className="w-full h-12 border-2 border-black rounded-full text-black font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !hasNewPassword}
          >
            <Lock className="h-5 w-5" />
            <span>{isSubmitting ? "Resetting..." : "Reset Password"}</span>
          </Button>
        </form>
      </Form>
    </div>
  );

  const renderContent = () => {
    if (isLoading) return renderLoadingState();
    if (!isValidSession) return renderInvalidState();
    if (passwordUpdated) return renderSuccessState();
    return renderFormState();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black px-4 sm:px-6 py-4">
        <a href="https://halobusinessfinance.com" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">HBF</span>
          </div>
          <span className="text-lg sm:text-xl font-semibold text-white">Halo Business Finance</span>
        </a>
      </header>

      {/* Main Content - Background Image with Centered Card (hidden on mobile) */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 sm:py-8 overflow-hidden bg-white relative">
        {/* Background image - only on md and above */}
        <div 
          className="absolute inset-0 hidden md:block bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/login-background.jpg?v=2')" }}
        />
        {/* Overlay for better readability - hidden on mobile */}
        <div className="absolute inset-0 bg-black/10 hidden md:block" />
        
        {/* Reset Password Card - no shadow on mobile for cleaner look */}
        <div className={`relative z-10 w-full max-w-lg bg-white md:rounded-2xl md:shadow-2xl mx-2 sm:mx-0 max-h-[calc(100vh-140px)] sm:max-h-none flex flex-col ${bounceClass}`}>
          <div 
            className="p-6 sm:p-8 md:p-10 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent overscroll-contain"
            onScroll={onScroll}
          >
            {renderContent()}
          </div>
          {/* Scroll indicator gradient for mobile */}
          <div className="h-4 bg-gradient-to-t from-white to-transparent pointer-events-none sm:hidden -mt-4 relative z-10 md:rounded-b-2xl" />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm text-black">
          <span className="text-center sm:text-left order-2 sm:order-1">
            © {new Date().getFullYear()} Halo Business Finance. All rights reserved.
          </span>
          <div className="flex items-center gap-3 sm:gap-6 order-1 sm:order-2">
            <a href="https://halobusinessfinance.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-black hover:underline transition-colors">Privacy</a>
            <a href="https://halobusinessfinance.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-black hover:underline transition-colors">Terms</a>
            <a href="https://halobusinessfinance.com/technical-support" target="_blank" rel="noopener noreferrer" className="text-black hover:underline transition-colors">Support</a>
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
              <span>Secured</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResetPassword;
