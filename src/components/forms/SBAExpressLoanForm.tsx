import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';
import { useLoanApplication } from '@/hooks/useLoanApplication';
import { useFormAutoSave } from '@/hooks/useFormAutoSave';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { PhoneInput } from '@/components/ui/phone-input';

// Zod schema for SBA Express Loan validation
const sbaExpressSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  ssn: z.string().min(9, 'SSN must be 9 digits'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code must be at least 5 digits'),

  // Business Information
  businessName: z.string().min(2, 'Business name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  businessAddress: z.string().min(5, 'Business address is required'),
  businessCity: z.string().min(2, 'Business city is required'),
  businessState: z.string().min(2, 'Business state is required'),
  businessZip: z.string().min(5, 'Business ZIP code is required'),
  yearsInBusiness: z.number().min(0, 'Years in business must be 0 or greater'),
  industryType: z.string().min(1, 'Industry type is required'),
  numberOfEmployees: z.number().min(0, 'Number of employees must be 0 or greater'),
  federalTaxId: z.string().min(9, 'Federal Tax ID is required'),

  // Loan Information
  loanAmount: z.number().min(1000, 'Minimum loan amount is $1,000').max(500000, 'SBA Express loans are limited to $500,000'),
  loanPurpose: z.string().min(1, 'Loan purpose is required'),
  loanPurposeDetails: z.string().min(10, 'Please provide more details about the loan purpose'),
  collateralDescription: z.string().optional(),
  repaymentTerm: z.number().min(1, 'Repayment term is required').max(25, 'Maximum term is 25 years'),

  // Financial Information
  annualRevenue: z.number().min(0, 'Annual revenue must be 0 or greater'),
  monthlyRevenue: z.number().min(0, 'Monthly revenue must be 0 or greater'),
  existingDebt: z.number().min(0, 'Existing debt must be 0 or greater'),
  creditScore: z.number().min(300, 'Credit score must be at least 300').max(850, 'Credit score cannot exceed 850'),
  bankName: z.string().min(2, 'Bank name is required'),
  accountType: z.string().min(1, 'Account type is required'),
  cashFlow: z.number().min(0, 'Cash flow must be 0 or greater'),

  // Additional Information
  hasConvictions: z.boolean(),
  convictionDetails: z.string().optional(),
  hasBankruptcy: z.boolean(),
  bankruptcyDetails: z.string().optional(),
  hasDefaultedLoans: z.boolean(),
  defaultDetails: z.string().optional(),

  // Terms and Conditions
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
  agreeToCredit: z.boolean().refine(val => val === true, 'You must agree to the credit check'),
  certifyInformation: z.boolean().refine(val => val === true, 'You must certify the information is accurate'),
});

type SBAExpressFormData = z.infer<typeof sbaExpressSchema>;

const STORAGE_KEY = 'sba-express-draft';

const SBAExpressLoanForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const { submitApplication, isLoading } = useLoanApplication();
  const { toast } = useToast();

  const form = useForm<SBAExpressFormData>({
    resolver: zodResolver(sbaExpressSchema),
    defaultValues: {
      hasConvictions: false,
      hasBankruptcy: false,
      hasDefaultedLoans: false,
      agreeToTerms: false,
      agreeToCredit: false,
      certifyInformation: false,
    },
  });

  const { clearOnSubmit } = useFormAutoSave({
    form,
    storageKey: STORAGE_KEY,
    excludeFields: ['ssn', 'federalTaxId', 'agreeToTerms', 'agreeToCredit', 'certifyInformation'],
  });

  const nextStep = () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    form.trigger(fieldsToValidate).then((isValid) => {
      if (isValid) {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      }
    });
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: SBAExpressFormData) => {
    try {
      const applicationData = {
        loan_type: 'sba_express' as const,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        business_name: data.businessName,
        business_address: data.businessAddress,
        business_city: data.businessCity,
        business_state: data.businessState,
        business_zip: data.businessZip,
        years_in_business: data.yearsInBusiness,
        amount_requested: data.loanAmount,
        loan_details: {
          ...data,
          loanType: 'sba_express',
        },
      };

      const result = await submitApplication(applicationData);
      
      if (result) {
        clearOnSubmit();
        toast({
          title: "Application Submitted Successfully",
          description: `Your SBA Express loan application has been submitted. Application ID: ${result.applicationNumber}`,
        });
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getFieldsForStep = (step: number): (keyof SBAExpressFormData)[] => {
    switch (step) {
      case 1:
        return ['firstName', 'lastName', 'email', 'phone', 'ssn', 'dateOfBirth', 'address', 'city', 'state', 'zipCode'];
      case 2:
        return ['businessName', 'businessType', 'businessAddress', 'businessCity', 'businessState', 'businessZip', 'yearsInBusiness', 'industryType', 'numberOfEmployees', 'federalTaxId'];
      case 3:
        return ['loanAmount', 'loanPurpose', 'loanPurposeDetails', 'repaymentTerm'];
      case 4:
        return ['annualRevenue', 'monthlyRevenue', 'existingDebt', 'creditScore', 'bankName', 'accountType', 'cashFlow'];
      case 5:
        return ['agreeToTerms', 'agreeToCredit', 'certifyInformation'];
      default:
        return [];
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
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
              <FormField
                control={form.control}
                name="ssn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Security Number *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>ZIP Code *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                        <SelectItem value="s_corp">S Corporation</SelectItem>
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
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="restaurant">Restaurant/Food Service</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="federalTaxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Federal Tax ID (EIN) *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="businessAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address *</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                    <FormLabel>Business ZIP Code *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
            <h3 className="text-lg font-semibold">Loan Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="loanAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Amount * (Max $500,000)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter amount"
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="repaymentTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Repayment Term (Years) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="loanPurpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Purpose *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select loan purpose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="working_capital">Working Capital Loan</SelectItem>
                      <SelectItem value="equipment">Equipment Purchase</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="business_acquisition">Business Acquisition</SelectItem>
                      <SelectItem value="real_estate">Real Estate</SelectItem>
                      <SelectItem value="debt_refinancing">Debt Refinancing</SelectItem>
                      <SelectItem value="expansion">Business Expansion</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="loanPurposeDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description of Loan Purpose *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please provide specific details about how you plan to use the loan funds..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="collateralDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collateral Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe any collateral you can offer..."
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Information</h3>
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
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthlyRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Monthly Revenue *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter monthly revenue"
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="existingDebt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Existing Business Debt *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter existing debt"
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
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
                    <FormLabel>Personal Credit Score *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter credit score"
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Bank *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="checking">Business Checking</SelectItem>
                        <SelectItem value="savings">Business Savings</SelectItem>
                        <SelectItem value="money_market">Money Market</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="cashFlow"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Cash Flow *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter monthly cash flow"
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Background Information</h4>
              
              <FormField
                control={form.control}
                name="hasConvictions"
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
                        Have you or any business principals been convicted of a felony?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch('hasConvictions') && (
                <FormField
                  control={form.control}
                  name="convictionDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please provide details about the conviction(s)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="hasBankruptcy"
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
                        Have you or your business filed for bankruptcy in the past 7 years?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch('hasBankruptcy') && (
                <FormField
                  control={form.control}
                  name="bankruptcyDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please provide details about the bankruptcy</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="hasDefaultedLoans"
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
                        Have you defaulted on any government loans?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch('hasDefaultedLoans') && (
                <FormField
                  control={form.control}
                  name="defaultDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please provide details about the loan default(s)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Terms and Conditions</h3>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="agreeToTerms"
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
                        I agree to the Terms and Conditions and Privacy Policy *
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="agreeToCredit"
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
                        I authorize a credit check to be performed *
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="certifyInformation"
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
                        I certify that all information provided is true and accurate *
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Important Information:</h4>
              <ul className="text-sm space-y-1">
                <li>• SBA Express loans are available up to $500,000</li>
                <li>• Faster processing time than traditional SBA loans</li>
                <li>• Competitive interest rates with SBA guarantee</li>
                <li>• Personal guarantee required for loans over $25,000</li>
                <li>• Business must meet SBA size standards</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-primary" />
          SBA Express Loan Application
        </CardTitle>
        <CardDescription>
          Complete this application to apply for an SBA Express loan up to $500,000
        </CardDescription>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
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
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              
              {currentStep === totalSteps ? (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? 'Submitting...' : 'Submit Application'}
                  <CheckCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SBAExpressLoanForm;