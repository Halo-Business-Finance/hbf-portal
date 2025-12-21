import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, ArrowLeft } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

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

const ChangePassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      navigate('/my-account?tab=account');
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 md:p-8">
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
              <Lock className="w-5 h-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter current password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter new password (min 6 characters)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Confirm new password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChangePassword;
