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
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
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
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-xl font-normal text-gray-900 mb-3 text-center">
          Check your email
        </h1>
        <p className="text-gray-600 text-center">
          We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
        </p>
      </div>

      <div className="border-t border-gray-200 mb-8" />

      <Button 
        type="button"
        variant="outline"
        className="w-full max-w-sm h-12 text-base font-medium justify-center rounded-full border-blue-800 text-blue-800 hover:bg-blue-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Back to Login
      </Button>
    </div>
  );

  const renderFormState = () => (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-xl font-normal text-gray-900 mb-3">
          Reset your password
        </h1>
        <p className="text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="border-t border-gray-200 mb-8" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="max-w-sm">
                <Label htmlFor="email" className="text-sm text-blue-800 mb-2 block">
                  Email
                </Label>
                <FormControl>
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="you@example.com"
                    className="h-12 bg-white border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-800 focus:ring-0 px-0"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="max-w-sm h-12 bg-blue-800 hover:bg-blue-700 text-white text-base font-medium justify-between px-4 rounded-full w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-blue-800/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? "Sending..." : "Send Reset Link"}</span>
            {!isSubmitting && <ArrowRight className="h-5 w-5" />}
          </Button>

          <div className="pt-6 border-t border-gray-200">
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              <span className="text-blue-800 hover:text-blue-900 hover:underline flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
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
          {emailSent ? renderSuccessState() : renderFormState()}
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
            <p className="text-2xl font-bold tracking-wider mb-2 text-white">Welcome to our</p>
            <h1 className="text-2xl font-bold mb-4 text-white">Commercial Loan Marketplace</h1>
            <div className="flex items-center justify-center gap-8 text-sm text-white mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-white" />
                <span>Fast Approval</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-white" />
                <span>Low Rates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-white" />
                <span>Expert Support</span>
              </div>
            </div>
            <h2 className="text-base font-medium drop-shadow-md text-white">Business Financing Made Simple</h2>
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

export default ForgotPassword;
