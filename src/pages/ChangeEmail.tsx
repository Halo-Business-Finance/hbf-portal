import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Rate limiting configuration
const RATE_LIMIT = { maxAttempts: 3, windowMs: 300000, lockoutMs: 600000 }; // 10 min lockout

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lockedUntil?: number;
}

const emailSchema = z.object({
  currentEmail: z.string().email("Invalid email address"),
  newEmail: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  confirmEmail: z.string().email("Invalid email address"),
}).refine((data) => data.newEmail === data.confirmEmail, {
  message: "Email addresses don't match",
  path: ["confirmEmail"],
}).refine((data) => data.currentEmail !== data.newEmail, {
  message: "New email must be different from current email",
  path: ["newEmail"],
});

const ChangeEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
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
        message: `Too many email change attempts. Please wait ${formatTimeRemaining(remainingTime)} before trying again.`
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
        message: `Too many email change attempts. Please wait ${formatTimeRemaining(RATE_LIMIT.lockoutMs)} before trying again.`
      };
    }

    rateLimitRef.current = { ...entry, count: entry.count + 1 };
    return { allowed: true };
  }, []);

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      currentEmail: user?.email || '',
      newEmail: '',
      confirmEmail: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof emailSchema>) => {
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
      // Verify current email matches
      if (values.currentEmail !== user?.email) {
        throw new Error("Current email doesn't match your account email");
      }

      const { error } = await supabase.auth.updateUser({
        email: values.newEmail,
      });

      if (error) throw error;

      // Reset rate limit on success
      rateLimitRef.current = null;

      toast({
        title: "Verification Email Sent",
        description: "Please check both your current and new email addresses to confirm the change. You must click the confirmation link in your new email to complete the process.",
      });
      
      form.reset();
      navigate('/my-account?tab=account');
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update email address",
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
              <Mail className="w-5 h-5" />
              Change Email Address
            </CardTitle>
            <CardDescription>
              Update the email address associated with your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                You will receive confirmation emails at both your current and new email addresses. 
                You must click the confirmation link in your new email to complete the change. 
                Your email will not change until you confirm it.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          readOnly
                          className="bg-muted/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter new email address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Confirm new email address"
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
                    {isSubmitting ? "Sending Verification..." : "Change Email Address"}
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

export default ChangeEmail;
