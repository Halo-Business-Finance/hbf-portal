import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, ArrowRight, CheckCircle, Lock } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Email Sent",
        description: "Check your inbox for the password reset link",
      });
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to send reset email",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSuccessState = () => (
    <>
      <div className="mb-8">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif text-center text-black mb-4">
          Check your email
        </h1>
        <p className="text-black text-center">
          We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
        </p>
      </div>

      <Button 
        type="button"
        variant="outline"
        className="w-full h-12 text-base font-medium justify-center rounded-full border-2 border-black text-black hover:bg-gray-50 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Back to Login
      </Button>
    </>
  );

  const renderFormState = () => (
    <>
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-serif text-center text-black mb-4">
        Reset your password
      </h1>
      <p className="text-black text-center mb-8">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="Email"
                    className="h-12 bg-white border border-gray-300 rounded-full px-5 focus:border-gray-500 focus:ring-0 transition-colors"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            variant="outline"
            className="w-full h-12 border-2 border-black rounded-full text-black font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !form.watch('email')}
          >
            <Lock className="h-5 w-5" />
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>

          <div className="text-center pt-4">
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-black hover:text-gray-700 text-sm font-medium hover:underline focus:outline-none"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </button>
          </div>
        </form>
      </Form>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Bar */}
      <header className="bg-black px-4 sm:px-6 py-4">
        <a href="https://halobusinessfinance.com" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">HBF</span>
          </div>
          <span className="text-lg sm:text-xl font-semibold text-white">Halo Business Finance</span>
        </a>
      </header>

      {/* Main Content - Background Image with Centered Card (hidden on mobile) */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 bg-white relative">
        {/* Background image - only on md and above */}
        <div 
          className="absolute inset-0 hidden md:block bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/login-background.jpg?v=2')" }}
        />
        {/* Overlay for better readability - hidden on mobile */}
        <div className="absolute inset-0 bg-black/10 hidden md:block" />
        
        {/* Reset Password Card - no shadow on mobile for cleaner look */}
        <div className="relative z-10 w-full max-w-lg bg-white md:rounded-2xl md:shadow-2xl p-6 sm:p-8 md:p-10">
          {emailSent ? renderSuccessState() : renderFormState()}
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

export default ForgotPassword;
