import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { AutoSaveIndicator } from "@/components/ui/auto-save-indicator";
import { useToast } from "@/hooks/use-toast";
import { useLoanApplication } from "@/hooks/useLoanApplication";
import { useFormAutoSave } from "@/hooks/useFormAutoSave";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PhoneInput, isValidPhoneNumber } from "@/components/ui/phone-input";

const sba504Schema = z.object({
  // Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().refine((val) => isValidPhoneNumber(val), { message: "Phone number must be exactly 10 digits" }),
  
  // Business Information
  businessName: z.string().min(1, "Business name is required"),
  businessAddress: z.string().min(1, "Business address is required"),
  businessCity: z.string().min(1, "Business city is required"),
  businessState: z.string().min(1, "Business state is required"),
  businessZip: z.string().min(5, "Business ZIP code is required"),
  businessType: z.string().min(1, "Business type is required"),
  yearsInBusiness: z.number().min(2, "SBA 504 requires minimum 2 years in business"),
  numberOfEmployees: z.number().min(0, "Number of employees must be 0 or greater"),
  
  // Project Information
  projectCost: z.number().min(100000, "Minimum project cost is $100,000").max(5500000, "Maximum SBA 504 loan is $5,500,000"),
  projectType: z.string().min(1, "Project type is required"),
  propertyAddress: z.string().min(1, "Property address is required"),
  propertyType: z.string().min(1, "Property type is required"),
  projectDescription: z.string().min(10, "Please provide project description"),
  
  // Financial Information
  annualRevenue: z.number().min(0, "Annual revenue must be 0 or greater"),
  netIncome: z.number(),
  ownerEquity: z.number().min(0, "Owner equity must be 0 or greater"),
  jobsCreated: z.number().min(0, "Jobs created must be 0 or greater"),
  
  // Terms Agreement
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  creditAuthorizationAccepted: z.boolean().refine(val => val === true, "You must authorize credit check"),
});

type SBA504FormData = z.infer<typeof sba504Schema>;

const STORAGE_KEY = 'sba504-loan-draft';

export default function SBA504LoanForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const { submitApplication, isLoading } = useLoanApplication();
  const { toast } = useToast();

  const form = useForm<SBA504FormData>({
    resolver: zodResolver(sba504Schema),
    mode: "onChange",
  });

  const { clearOnSubmit } = useFormAutoSave({
    form,
    storageKey: STORAGE_KEY,
    excludeFields: ['termsAccepted', 'creditAuthorizationAccepted'],
  });

  const totalSteps = 5;

  const nextStep = async () => {
    const fields = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fields);
    
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof SBA504FormData)[] => {
    switch (step) {
      case 1:
        return ["firstName", "lastName", "email", "phone"];
      case 2:
        return ["businessName", "businessAddress", "businessCity", "businessState", "businessZip", "businessType", "yearsInBusiness", "numberOfEmployees"];
      case 3:
        return ["projectCost", "projectType", "propertyAddress", "propertyType", "projectDescription"];
      case 4:
        return ["annualRevenue", "netIncome", "ownerEquity", "jobsCreated"];
      case 5:
        return ["termsAccepted", "creditAuthorizationAccepted"];
      default:
        return [];
    }
  };

  const onSubmit = async (data: SBA504FormData) => {
    const transformedData = {
      loan_type: "sba_504",
      amount_requested: data.projectCost,
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
        businessType: data.businessType,
        numberOfEmployees: data.numberOfEmployees,
        projectType: data.projectType,
        propertyAddress: data.propertyAddress,
        propertyType: data.propertyType,
        projectDescription: data.projectDescription,
        annualRevenue: data.annualRevenue,
        netIncome: data.netIncome,
        ownerEquity: data.ownerEquity,
        jobsCreated: data.jobsCreated,
      },
    };

    try {
      const result = await submitApplication(transformedData);
      
      if (result) {
        clearOnSubmit();
        toast({
          title: "Application Submitted Successfully",
          description: "Your SBA 504 loan application has been submitted. You'll receive updates via email.",
        });
        form.reset();
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Submit error:', error);
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
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
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
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
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
                    <FormLabel>Phone Number *</FormLabel>
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Business Information</h3>
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter business name" {...field} />
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
                  <FormLabel>Business Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter business address" {...field} />
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
                    <FormLabel>Business City *</FormLabel>
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
                    <FormLabel>Business State *</FormLabel>
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
                    <FormLabel>Business ZIP *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter ZIP code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="corporation">Corporation</SelectItem>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfEmployees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Employees *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter employee count" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="yearsInBusiness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years in Business *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter years" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">Minimum 2 years required for SBA 504</p>
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Project Information</h3>
            <FormField
              control={form.control}
              name="projectCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Project Cost *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter total project cost" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    SBA 504 financing: 50% bank loan, 40% SBA debenture, 10% owner equity
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="real_estate_purchase">Real Estate Purchase</SelectItem>
                      <SelectItem value="construction">New Construction</SelectItem>
                      <SelectItem value="renovation">Major Renovation</SelectItem>
                      <SelectItem value="equipment">Heavy Equipment Purchase</SelectItem>
                      <SelectItem value="expansion">Business Expansion</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="propertyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property/Project Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter property address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="office">Office Building</SelectItem>
                      <SelectItem value="retail">Retail Space</SelectItem>
                      <SelectItem value="warehouse">Warehouse/Industrial</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing Facility</SelectItem>
                      <SelectItem value="mixed_use">Mixed Use</SelectItem>
                      <SelectItem value="hotel">Hotel/Hospitality</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your project, construction plans, or equipment purchase..."
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="annualRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Revenue *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
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
                        placeholder="Enter net income" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ownerEquity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Owner Equity *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter available equity" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">Minimum 10% of project cost required</p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobsCreated"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jobs Created/Retained *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter number of jobs" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">SBA 504 requires job creation or retention</p>
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Terms and Authorization</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="termsAccepted"
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
                        I accept the terms and conditions *
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        By checking this box, I agree to the SBA 504 loan terms, acknowledge the job creation requirements, and confirm all information is accurate.
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditAuthorizationAccepted"
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
                        I authorize credit check *
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        I authorize the lender and SBA to obtain my personal and business credit reports and verify all information provided.
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">SBA 504 Loan Application</CardTitle>
        <CardDescription>
          Apply for SBA 504 fixed-rate financing for real estate and major equipment purchases
        </CardDescription>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="w-full" />
        </div>
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
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              
              {currentStep === totalSteps ? (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? "Submitting..." : "Submit Application"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  Next
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