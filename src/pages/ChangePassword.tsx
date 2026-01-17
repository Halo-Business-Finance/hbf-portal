import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

// Rate limiting configuration
const RATE_LIMIT = { maxAttempts: 3, windowMs: 300000, lockoutMs: 600000 }; // 10 min lockout

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lockedUntil?: number;
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
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

const ChangePassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  
  // Rate limiting
  const rateLimitRef = useRef<RateLimitEntry | null>(null);

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
        message: `Too many password change attempts. Please wait ${formatTimeRemaining(remainingTime)} before trying again.`
      };
    }

    if (current && now > current.resetTime) {
      rateLimitRef.current = null;
    }

    const entry = rateLimitRef.current;

    if (!entry) {
      rateLimitRef.current = { count: 1, resetTime: now + RATE_LIMIT.windowMs };
      return { allowed: true };
    }

    if (entry.count >= RATE_LIMIT.maxAttempts) {
      rateLimitRef.current = {
        ...entry,
        lockedUntil: now + RATE_LIMIT.lockoutMs,
        resetTime: now + RATE_LIMIT.lockoutMs
      };
      return {
        allowed: false,
        message: `Too many password change attempts. Please wait ${formatTimeRemaining(RATE_LIMIT.lockoutMs)} before trying again.`
      };
    }

    rateLimitRef.current = { ...entry, count: entry.count + 1 };
    return { allowed: true };
  }, []);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof passwordSchema>) => {
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

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;

      // Reset rate limit on success
      rateLimitRef.current = null;

      toast({
        title: "Success",
        description: "Your password has been updated successfully",
      });
      
      form.reset();
      setPasswordUpdated(true);
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSuccessState = () => (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-xl font-normal text-gray-900 mb-3 text-center">
          Password updated
        </h1>
        <p className="text-gray-600 text-center">
          Your password has been successfully updated. You can now use your new password to log in.
        </p>
      </div>

      <div className="border-t border-gray-200 mb-8" />

      <Button 
        type="button"
        variant="outline"
        className="w-full max-w-sm h-12 text-base font-medium justify-center rounded-none border-gray-300"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Back to Dashboard
      </Button>
    </div>
  );

  const renderFormState = () => (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-xl font-normal text-gray-900 mb-3">
          Change your password
        </h1>
        <p className="text-gray-600">
          Update your password to keep your account secure.
        </p>
      </div>

      <div className="border-t border-gray-200 mb-8" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem className="max-w-sm">
                <Label htmlFor="currentPassword" className="text-sm text-blue-600 mb-2 block">
                  Current password
                </Label>
                <FormControl>
                  <div className="relative">
                    <Input 
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      className="h-12 bg-white border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-600 focus:ring-0 px-0 pr-12"
                      {...field} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => {
              const strength = getPasswordStrength(field.value);
              const requirements = getPasswordRequirements(field.value);
              return (
                <FormItem className="max-w-sm">
                  <Label htmlFor="newPassword" className="text-sm text-blue-600 mb-2 block">
                    New password
                  </Label>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        className="h-12 bg-white border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-600 focus:ring-0 px-0 pr-12"
                        {...field} 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                      </Button>
                    </div>
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
            render={({ field }) => (
              <FormItem className="max-w-sm">
                <Label htmlFor="confirmPassword" className="text-sm text-blue-600 mb-2 block">
                  Confirm new password
                </Label>
                <FormControl>
                  <div className="relative">
                    <Input 
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="h-12 bg-white border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-600 focus:ring-0 px-0 pr-12"
                      {...field} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="max-w-sm h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium justify-between px-4 rounded-none w-full"
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? "Updating..." : "Update Password"}</span>
            {!isSubmitting && <ArrowRight className="h-5 w-5" />}
          </Button>

          <div className="pt-6 border-t border-gray-200">
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              <span className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </span>
            </button>
          </div>
        </form>
      </Form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-black px-4 sm:px-6 py-4">
        <a href="https://halobusinessfinance.com" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">HBF</span>
          </div>
          <span className="text-lg sm:text-xl font-semibold text-white">Halo Business Finance</span>
        </a>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Column - Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12 bg-white">
          {passwordUpdated ? renderSuccessState() : renderFormState()}
        </div>

        {/* Right Column - Decorative Geometric Shapes */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden items-center justify-center">
          {/* Geometric shapes */}
          <div className="absolute inset-0">
            {/* Large circle - centered */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-2 border-white/20" />
            
            {/* Medium circle */}
            <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-white/10" />
            
            {/* Small filled circle */}
            <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full bg-blue-400/30" />
            
            {/* Dots pattern */}
            <div className="absolute top-20 right-20 grid grid-cols-4 gap-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-white/30" />
              ))}
            </div>
            
            {/* Lines */}
            <div className="absolute bottom-20 left-20 space-y-3">
              <div className="w-32 h-0.5 bg-white/20" />
              <div className="w-24 h-0.5 bg-white/20" />
              <div className="w-16 h-0.5 bg-white/20" />
            </div>
          </div>

          {/* Center content */}
          <div className="relative z-10 text-center text-white px-12">
            <p className="text-2xl font-bold tracking-wider mb-2 text-white">Account Security</p>
            <h1 className="text-2xl font-bold mb-4 text-white">Keep Your Account Safe</h1>
            <div className="flex items-center justify-center gap-8 text-sm text-white mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-white" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-white" />
                <span>Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-white" />
                <span>Protected</span>
              </div>
            </div>
            <h2 className="text-base font-medium drop-shadow-md text-white">Your security is our priority</h2>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <span className="text-center sm:text-left">
            © {new Date().getFullYear()} Halo Business Finance.
            <span className="block sm:inline"> All rights reserved.</span>
          </span>
          <div className="flex items-center gap-4 sm:gap-6">
            <a href="https://halobusinessfinance.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 hover:underline transition-colors">Privacy Policy</a>
            <a href="https://halobusinessfinance.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 hover:underline transition-colors">Terms of Service</a>
            <a href="https://halobusinessfinance.com/technical-support" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 hover:underline transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChangePassword;
