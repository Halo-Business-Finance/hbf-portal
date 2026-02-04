import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormProgress, FormProgressStep } from "@/components/ui/form-progress";
import { FormSection, FormRow } from "@/components/ui/form-section";
import { AutoSaveIndicator } from "@/components/ui/auto-save-indicator";
import { useToast } from "@/hooks/use-toast";
import { useLoanApplication } from "@/hooks/useLoanApplication";
import { useFormAutoSave } from "@/hooks/useFormAutoSave";
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  FileCheck,
  Mail,
  Phone,
  MapPin,
  Hash,
  Briefcase,
  Users,
  Target,
  CreditCard,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

const sba7aSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  email: z.string().email("Valid email is required").max(255, "Email must be less than 255 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20, "Phone number is too long"),
  ssn: z.string().min(9, "SSN is required").max(11, "SSN format is invalid"),
  address: z.string().min(1, "Address is required").max(200, "Address is too long"),
  city: z.string().min(1, "City is required").max(100, "City name is too long"),
  state: z.string().min(1, "State is required").max(50, "State name is too long"),
  zipCode: z.string().min(5, "ZIP code is required").max(10, "ZIP code is too long"),
  
  // Business Information
  businessName: z.string().min(1, "Business name is required").max(200, "Business name is too long"),
  businessAddress: z.string().min(1, "Business address is required").max(200, "Address is too long"),
  businessCity: z.string().min(1, "Business city is required").max(100, "City name is too long"),
  businessState: z.string().min(1, "Business state is required").max(50, "State name is too long"),
  businessZip: z.string().min(5, "Business ZIP code is required").max(10, "ZIP code is too long"),
  businessType: z.string().min(1, "Business type is required"),
  industryType: z.string().min(1, "Industry type is required"),
  yearsInBusiness: z.number().min(0, "Years in business must be 0 or greater").max(200, "Invalid years"),
  numberOfEmployees: z.number().min(0, "Number of employees must be 0 or greater").max(100000, "Invalid number"),
  
  // Loan Details
  loanAmount: z.number().min(1000, "Minimum loan amount is $1,000").max(5000000, "Maximum SBA 7(a) loan is $5,000,000"),
  loanPurpose: z.string().min(1, "Loan purpose is required"),
  useOfFunds: z.string().min(10, "Please provide detailed use of funds (minimum 10 characters)").max(2000, "Description is too long"),
  
  // Financial Information
  annualRevenue: z.number().min(0, "Annual revenue must be 0 or greater"),
  netIncome: z.number(),
  currentDebt: z.number().min(0, "Current debt must be 0 or greater"),
  creditScore: z.number().min(300, "Credit score must be at least 300").max(850, "Credit score cannot exceed 850"),
  
  // Terms Agreement
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  creditAuthorizationAccepted: z.boolean().refine(val => val === true, "You must authorize credit check"),
});

type SBA7aFormData = z.infer<typeof sba7aSchema>;

const formSteps: FormProgressStep[] = [
  { title: "Personal", description: "Your information", icon: User },
  { title: "Business", description: "Company details", icon: Building2 },
  { title: "Loan", description: "Funding needs", icon: DollarSign },
  { title: "Financial", description: "Business finances", icon: TrendingUp },
  { title: "Review", description: "Terms & submit", icon: FileCheck },
];

export default function SBA7aLoanForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const { submitApplication, isLoading } = useLoanApplication();
  const { toast } = useToast();

  const form = useForm<SBA7aFormData>({
    resolver: zodResolver(sba7aSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      ssn: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      businessName: "",
      businessAddress: "",
      businessCity: "",
      businessState: "",
      businessZip: "",
      businessType: "",
      industryType: "",
      yearsInBusiness: 0,
      numberOfEmployees: 0,
      loanAmount: 0,
      loanPurpose: "",
      useOfFunds: "",
      annualRevenue: 0,
      netIncome: 0,
      currentDebt: 0,
      creditScore: 0,
      termsAccepted: false,
      creditAuthorizationAccepted: false,
    },
  });

  const STORAGE_KEY = 'sba7a-loan-draft';
  
  const { clearOnSubmit } = useFormAutoSave({
    form,
    storageKey: STORAGE_KEY,
    excludeFields: ['ssn', 'termsAccepted', 'creditAuthorizationAccepted'],
  });

  const totalSteps = 5;

  const nextStep = async () => {
    const fields = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fields);
    
    if (isValid && currentStep < totalSteps) {
      setDirection("forward");
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection("backward");
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof SBA7aFormData)[] => {
    switch (step) {
      case 1:
        return ["firstName", "lastName", "email", "phone", "ssn", "address", "city", "state", "zipCode"];
      case 2:
        return ["businessName", "businessAddress", "businessCity", "businessState", "businessZip", "businessType", "industryType", "yearsInBusiness", "numberOfEmployees"];
      case 3:
        return ["loanAmount", "loanPurpose", "useOfFunds"];
      case 4:
        return ["annualRevenue", "netIncome", "currentDebt", "creditScore"];
      case 5:
        return ["termsAccepted", "creditAuthorizationAccepted"];
      default:
        return [];
    }
  };

  const onSubmit = async (data: SBA7aFormData) => {
    const transformedData = {
      loan_type: "sba_7a",
      amount_requested: data.loanAmount,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      business_name: data.businessName,
      business_address: data.businessAddress,
      business_city: data.businessCity,
      business_state: data.businessState,
      business_zip: data.businessZip,
      years_in_business: data.yearsInBusiness,
      loan_details: {
        email: data.email,
        ssn: data.ssn,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        businessType: data.businessType,
        industryType: data.industryType,
        numberOfEmployees: data.numberOfEmployees,
        loanPurpose: data.loanPurpose,
        useOfFunds: data.useOfFunds,
        annualRevenue: data.annualRevenue,
        netIncome: data.netIncome,
        currentDebt: data.currentDebt,
        creditScore: data.creditScore,
      },
    };

    try {
      const result = await submitApplication(transformedData);
      if (result) {
        clearOnSubmit();
        toast({
          title: "Application Submitted Successfully",
          description: "Your SBA 7(a) loan application has been submitted. You'll receive updates via email.",
        });
        form.reset();
        setCurrentStep(1);
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <FormSection 
            title="Personal Information" 
            description="Please provide your personal details"
            icon={User}
            direction={direction}
          >
            <FormRow cols={2}>
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>First Name</FormLabel>
                    <FormControl>
                      <Input 
                        icon={User}
                        placeholder="Enter first name" 
                        {...field} 
                      />
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
                    <FormLabel required>Last Name</FormLabel>
                    <FormControl>
                      <Input 
                        icon={User}
                        placeholder="Enter last name" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormRow>

            <FormRow cols={2}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        icon={Mail}
                        placeholder="Enter email address" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        icon={Phone}
                        placeholder="(555) 555-5555" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormRow>

            <FormField
              control={form.control}
              name="ssn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Social Security Number</FormLabel>
                  <FormControl>
                    <Input 
                      icon={Hash}
                      placeholder="XXX-XX-XXXX" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>Your SSN is encrypted and securely stored</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Street Address</FormLabel>
                  <FormControl>
                    <Input 
                      icon={MapPin}
                      placeholder="Enter street address" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormRow cols={3}>
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>State</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter state" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormRow>
          </FormSection>
        );

      case 2:
        return (
          <FormSection 
            title="Business Information" 
            description="Tell us about your company"
            icon={Building2}
            direction={direction}
          >
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Business Name</FormLabel>
                  <FormControl>
                    <Input 
                      icon={Building2}
                      placeholder="Enter business name" 
                      {...field} 
                    />
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
                  <FormLabel required>Business Address</FormLabel>
                  <FormControl>
                    <Input 
                      icon={MapPin}
                      placeholder="Enter business address" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormRow cols={3}>
              <FormField
                control={form.control}
                name="businessCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" {...field} />
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
                    <FormLabel required>State</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter state" {...field} />
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
                    <FormLabel required>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormRow>

            <FormRow cols={2}>
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Business Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="corporation">Corporation</SelectItem>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                        <SelectItem value="nonprofit">Nonprofit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Industry Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="services">Professional Services</SelectItem>
                        <SelectItem value="restaurant">Restaurant/Food Service</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="real_estate">Real Estate</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormRow>

            <FormRow cols={2}>
              <FormField
                control={form.control}
                name="yearsInBusiness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Years in Business</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        icon={Briefcase}
                        placeholder="Enter years" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfEmployees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Number of Employees</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        icon={Users}
                        placeholder="Enter employee count" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormRow>
          </FormSection>
        );

      case 3:
        return (
          <FormSection 
            title="Loan Details" 
            description="Specify your funding requirements"
            icon={DollarSign}
            direction={direction}
          >
            <FormField
              control={form.control}
              name="loanAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Loan Amount Requested</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      icon={DollarSign}
                      placeholder="Enter loan amount" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    SBA 7(a) loans available from $1,000 to $5,000,000
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loanPurpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Primary Loan Purpose</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select loan purpose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="working_capital">Working Capital Loan</SelectItem>
                      <SelectItem value="equipment">Equipment Purchase</SelectItem>
                      <SelectItem value="real_estate">Real Estate Purchase</SelectItem>
                      <SelectItem value="business_acquisition">Business Acquisition</SelectItem>
                      <SelectItem value="debt_refinancing">Debt Refinancing</SelectItem>
                      <SelectItem value="expansion">Business Expansion</SelectItem>
                      <SelectItem value="startup">Startup Costs</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="useOfFunds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Detailed Use of Funds</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please describe how you plan to use the loan funds. Include specific allocations if possible..."
                      rows={5}
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed breakdown of how funds will be allocated
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>
        );

      case 4:
        return (
          <FormSection 
            title="Financial Information" 
            description="Share your business financials"
            icon={TrendingUp}
            direction={direction}
          >
            <FormRow cols={2}>
              <FormField
                control={form.control}
                name="annualRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Annual Revenue</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        icon={DollarSign}
                        placeholder="Enter annual revenue" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="netIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Net Income</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        icon={TrendingUp}
                        placeholder="Enter net income" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Can be negative if operating at a loss</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormRow>

            <FormRow cols={2}>
              <FormField
                control={form.control}
                name="currentDebt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Current Total Debt</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        icon={Target}
                        placeholder="Enter current debt" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                    <FormLabel required>Personal Credit Score</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        icon={CreditCard}
                        placeholder="Enter credit score" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Minimum recommended: 680</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormRow>
          </FormSection>
        );

      case 5:
        return (
          <FormSection 
            title="Terms & Authorization" 
            description="Review and accept the terms to submit"
            icon={FileCheck}
            direction={direction}
          >
            <div className="space-y-6">
              {/* Application Summary */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <h4 className="font-medium text-sm text-foreground">Application Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Loan Amount:</span>
                  <span className="font-medium">${form.getValues("loanAmount")?.toLocaleString() || 0}</span>
                  <span className="text-muted-foreground">Business:</span>
                  <span className="font-medium">{form.getValues("businessName") || "—"}</span>
                  <span className="text-muted-foreground">Applicant:</span>
                  <span className="font-medium">{form.getValues("firstName")} {form.getValues("lastName")}</span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none flex-1">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        I accept the terms and conditions
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        By checking this box, I agree to the loan terms and conditions, privacy policy, and acknowledge that all information provided is accurate and complete.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditAuthorizationAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none flex-1">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        I authorize credit check
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        I authorize the lender to obtain my personal and business credit reports and verify the information provided in this application.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto elevated-card overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-accent/5 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-primary text-primary-foreground shadow-primary">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">SBA 7(a) Loan Application</CardTitle>
              <CardDescription>
                Complete this application for SBA 7(a) financing up to $5,000,000
              </CardDescription>
            </div>
          </div>
          <AutoSaveIndicator storageKey={STORAGE_KEY} />
        </div>
        
        {/* Progress Indicator */}
        <div className="mt-6">
          <FormProgress steps={formSteps} currentStep={currentStep} />
        </div>
      </CardHeader>
      
      <CardContent className="p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {renderStep()}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={cn(
                  "flex items-center gap-2 h-11 px-6",
                  currentStep === 1 && "opacity-50"
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              
              {currentStep === totalSteps ? (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 h-11 px-8 bg-gradient-primary hover:opacity-90 shadow-primary"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 h-11 px-8 bg-gradient-primary hover:opacity-90 shadow-primary"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
