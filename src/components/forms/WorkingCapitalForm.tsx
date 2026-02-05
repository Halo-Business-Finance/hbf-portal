import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';
import { useToast } from '@/hooks/use-toast';
import { useLoanApplication } from '@/hooks/useLoanApplication';
import { useFormAutoSave } from '@/hooks/useFormAutoSave';
import { TrendingUp, Building, DollarSign, FileText, Check } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PhoneInput } from '@/components/ui/phone-input';

const workingCapitalSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  
  // Business Information
  businessName: z.string().min(2, 'Business name is required'),
  businessAddress: z.string().min(5, 'Business address is required'),
  businessCity: z.string().min(2, 'City is required'),
  businessState: z.string().min(2, 'State is required'),
  businessZip: z.string().min(5, 'ZIP code is required'),
  yearsInBusiness: z.number().min(1, 'Years in business must be at least 1'),
  industry: z.string().min(2, 'Industry is required'),
  
  // Working Capital Loan Details
  amountRequested: z.number().min(10000, 'Minimum amount is $10,000'),
  purposeOfFunds: z.string().min(10, 'Purpose must be at least 10 characters'),
  monthlyRevenue: z.number().min(1000, 'Monthly revenue is required'),
  monthlyExpenses: z.number().min(1000, 'Monthly expenses is required'),
  currentCashFlow: z.number(),
  seasonalBusiness: z.boolean(),
  
  // Financial Information
  bankName: z.string().min(2, 'Bank name is required'),
  averageMonthlyBalance: z.number().min(0, 'Average balance must be positive'),
  creditScore: z.number().min(300, 'Credit score must be at least 300').max(850, 'Credit score cannot exceed 850'),
  
  // Terms
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms')
});

type WorkingCapitalFormData = z.infer<typeof workingCapitalSchema>;

const STORAGE_KEY = 'working-capital-draft';

const WorkingCapitalForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const { submitApplication, isLoading } = useLoanApplication();

  const form = useForm<WorkingCapitalFormData>({
    resolver: zodResolver(workingCapitalSchema),
    defaultValues: {
      seasonalBusiness: false,
      acceptTerms: false,
      currentCashFlow: 0
    }
  });

  const { clearOnSubmit } = useFormAutoSave({
    form,
    storageKey: STORAGE_KEY,
    excludeFields: ['acceptTerms'],
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof WorkingCapitalFormData)[] => {
    switch (step) {
      case 1:
        return ['firstName', 'lastName', 'phone'];
      case 2:
        return ['businessName', 'businessAddress', 'businessCity', 'businessState', 'businessZip', 'yearsInBusiness', 'industry'];
      case 3:
        return ['amountRequested', 'purposeOfFunds', 'monthlyRevenue', 'monthlyExpenses'];
      case 4:
        return ['bankName', 'averageMonthlyBalance', 'creditScore', 'acceptTerms'];
      default:
        return [];
    }
  };

  const onSubmit = async (data: WorkingCapitalFormData) => {
    try {
      const applicationData = {
        loan_type: 'working_capital',
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        business_name: data.businessName,
        business_address: data.businessAddress,
        business_city: data.businessCity,
        business_state: data.businessState,
        business_zip: data.businessZip,
        years_in_business: data.yearsInBusiness,
        amount_requested: data.amountRequested,
        loan_details: {
          industry: data.industry,
          purpose_of_funds: data.purposeOfFunds,
          monthly_revenue: data.monthlyRevenue,
          monthly_expenses: data.monthlyExpenses,
          current_cash_flow: data.currentCashFlow,
          seasonal_business: data.seasonalBusiness,
          bank_name: data.bankName,
          average_monthly_balance: data.averageMonthlyBalance,
          credit_score: data.creditScore
        }
      };

      const result = await submitApplication(applicationData);
      
      if (result) {
        clearOnSubmit();
        toast({
          title: "Application Submitted Successfully!",
          description: `Your working capital loan application #${result.application_number} has been submitted for review.`
        });
        form.reset();
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Personal Information</h3>
              <p className="text-muted-foreground">Let's start with your basic information</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                     <PhoneInput 
                       value={field.value}
                       onChange={field.onChange}
                     />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Building className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Business Information</h3>
              <p className="text-muted-foreground">Tell us about your business</p>
            </div>
            
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Business Name LLC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="businessAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Business Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="businessCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="businessState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="businessZip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="yearsInBusiness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years in Business</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="5" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="Technology, Retail, Manufacturing, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <DollarSign className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Working Capital Loan Details</h3>
              <p className="text-muted-foreground">Specify your funding requirements</p>
            </div>
            
            <FormField
              control={form.control}
              name="amountRequested"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Requested</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="100000" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="purposeOfFunds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Funds</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe how you plan to use the working capital..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthlyRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Revenue</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="50000" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="monthlyExpenses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Expenses</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="40000" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="seasonalBusiness"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      My business is seasonal
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Financial Information</h3>
              <p className="text-muted-foreground">Final details about your finances</p>
            </div>
            
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Bank</FormLabel>
                  <FormControl>
                    <Input placeholder="Chase, Bank of America, Wells Fargo, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="averageMonthlyBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Monthly Bank Balance</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="25000" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="creditScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Score</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="700" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I accept the terms and conditions and privacy policy
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Working Capital Loan Application
        </CardTitle>
        <CardDescription>
          Step {currentStep} of {totalSteps} - Secure working capital for your business operations
        </CardDescription>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderStep()}
            
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default WorkingCapitalForm;