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
import { FormRow } from "@/components/ui/form-section";
import { PhoneInput, isValidPhoneNumber } from "@/components/ui/phone-input";

const equipmentFinancingSchema = z.object({
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
  yearsInBusiness: z.number().min(0, "Years in business must be 0 or greater"),
  
  // Equipment Information
  equipmentType: z.string().min(1, "Equipment type is required"),
  equipmentCost: z.number().min(1000, "Minimum equipment cost is $1,000"),
  equipmentCondition: z.string().min(1, "Equipment condition is required"),
  equipmentManufacturer: z.string().min(1, "Equipment manufacturer is required"),
  equipmentModel: z.string().min(1, "Equipment model is required"),
  equipmentYear: z.number().min(1990, "Equipment year must be 1990 or later"),
  equipmentDescription: z.string().min(10, "Please provide equipment description"),
  
  // Financial Information
  annualRevenue: z.number().min(0, "Annual revenue must be 0 or greater"),
  downPayment: z.number().min(0, "Down payment must be 0 or greater"),
  creditScore: z.number().min(300, "Credit score must be at least 300").max(850, "Credit score cannot exceed 850"),
  
  // Terms Agreement
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  creditAuthorizationAccepted: z.boolean().refine(val => val === true, "You must authorize credit check"),
});

type EquipmentFinancingFormData = z.infer<typeof equipmentFinancingSchema>;

const STORAGE_KEY = 'equipment-financing-draft';

export default function EquipmentFinancingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const { submitApplication, isLoading } = useLoanApplication();
  const { toast } = useToast();

  const form = useForm<EquipmentFinancingFormData>({
    resolver: zodResolver(equipmentFinancingSchema),
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

  const getFieldsForStep = (step: number): (keyof EquipmentFinancingFormData)[] => {
    switch (step) {
      case 1:
        return ["firstName", "lastName", "email", "phone"];
      case 2:
        return ["businessName", "businessAddress", "businessCity", "businessState", "businessZip", "businessType", "yearsInBusiness"];
      case 3:
        return ["equipmentType", "equipmentCost", "equipmentCondition", "equipmentManufacturer", "equipmentModel", "equipmentYear", "equipmentDescription"];
      case 4:
        return ["annualRevenue", "downPayment", "creditScore"];
      case 5:
        return ["termsAccepted", "creditAuthorizationAccepted"];
      default:
        return [];
    }
  };

  const onSubmit = async (data: EquipmentFinancingFormData) => {
    const transformedData = {
      loan_type: "equipment_financing",
      amount_requested: data.equipmentCost,
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
        equipmentType: data.equipmentType,
        equipmentCondition: data.equipmentCondition,
        equipmentManufacturer: data.equipmentManufacturer,
        equipmentModel: data.equipmentModel,
        equipmentYear: data.equipmentYear,
        equipmentDescription: data.equipmentDescription,
        annualRevenue: data.annualRevenue,
        downPayment: data.downPayment,
        creditScore: data.creditScore,
      },
    };

    try {
      const result = await submitApplication(transformedData);
      if (result) {
        clearOnSubmit();
        toast({
          title: "Application Submitted Successfully",
          description: "Your equipment financing application has been submitted. You'll receive updates via email.",
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
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Personal Information</h3>
            <FormRow cols={2}>
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
            </FormRow>

            <FormRow cols={2}>
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
            </FormRow>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Business Information</h3>
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

            <FormRow cols={3}>
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
            </FormRow>

            <FormRow cols={2}>
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
                  </FormItem>
                )}
              />
            </FormRow>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Equipment Details</h3>
            <FormRow cols={2}>
              <FormField
                control={form.control}
                name="equipmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="construction">Construction Equipment</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing Equipment</SelectItem>
                        <SelectItem value="medical">Medical Equipment</SelectItem>
                        <SelectItem value="restaurant">Restaurant Equipment</SelectItem>
                        <SelectItem value="transportation">Transportation Equipment</SelectItem>
                        <SelectItem value="technology">Technology Equipment</SelectItem>
                        <SelectItem value="agricultural">Agricultural Equipment</SelectItem>
                        <SelectItem value="office">Office Equipment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="equipmentCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment Cost *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter equipment cost" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormRow>

            <FormField
              control={form.control}
              name="equipmentCondition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Condition *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                      <SelectItem value="refurbished">Refurbished</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormRow cols={3}>
              <FormField
                control={form.control}
                name="equipmentManufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter manufacturer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="equipmentModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter model" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="equipmentYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter year" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormRow>

            <FormField
              control={form.control}
              name="equipmentDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the equipment, its purpose, and how it will benefit your business..."
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="downPayment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Down Payment Available</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter down payment amount" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">Down payment can improve terms</p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="creditScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Credit Score *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter credit score" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">Minimum recommended: 650</p>
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
                        By checking this box, I agree to the equipment financing terms and acknowledge that the equipment serves as collateral.
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
                        I authorize the lender to obtain my personal and business credit reports and verify all information provided.
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
        <CardTitle className="text-2xl">Equipment Financing Application</CardTitle>
        <CardDescription>
          Get financing for new or used equipment with competitive rates and flexible terms
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