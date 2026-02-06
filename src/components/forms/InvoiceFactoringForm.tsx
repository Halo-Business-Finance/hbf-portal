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
import { ArrowLeft, ArrowRight, FileText, DollarSign } from 'lucide-react';
import { PhoneInput, isValidPhoneNumber } from '@/components/ui/phone-input';

// Zod schema for AR/Invoice Factoring validation
const invoiceFactoringSchema = z.object({
  // Business Information
  businessName: z.string().min(2, 'Business name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  businessAddress: z.string().min(5, 'Business address is required'),
  businessCity: z.string().min(2, 'Business city is required'),
  businessState: z.string().min(2, 'Business state is required'),
  businessZip: z.string().min(5, 'Business ZIP code is required'),
  yearsInBusiness: z.number().min(0.5, 'Must be in business for at least 6 months'),
  industryType: z.string().min(1, 'Industry type is required'),
  federalTaxId: z.string().regex(/^\d{2}-\d{7}$/, 'Federal Tax ID must be in format XX-XXXXXXX'),
  numberOfEmployees: z.number().min(1, 'Must have at least 1 employee'),

  // Contact Information
  contactName: z.string().min(2, 'Contact name is required'),
  contactTitle: z.string().min(1, 'Contact title is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().refine((val) => isValidPhoneNumber(val), { message: "Phone number must be exactly 10 digits" }),

  // Factoring Details
  monthlyInvoiceVolume: z.number().min(10000, 'Minimum monthly invoice volume is $10,000'),
  averageInvoiceAmount: z.number().min(500, 'Minimum average invoice amount is $500'),
  factorAdvanceRate: z.number().min(70).max(95, 'Advance rate must be between 70% and 95%'),
  paymentTerms: z.string().min(1, 'Payment terms are required'),
  invoiceFrequency: z.string().min(1, 'Invoice frequency is required'),
  
  // Customer Information
  numberOfCustomers: z.number().min(1, 'Must have at least 1 customer'),
  largestCustomerPercentage: z.number().min(1).max(100, 'Percentage must be between 1% and 100%'),
  averageCustomerCreditRating: z.string().min(1, 'Customer credit rating is required'),
  customerConcentration: z.string().min(1, 'Customer concentration is required'),
  
  // Financial Information
  annualRevenue: z.number().min(50000, 'Minimum annual revenue is $50,000'),
  monthlyRevenue: z.number().min(4000, 'Minimum monthly revenue is $4,000'),
  accountsReceivableBalance: z.number().min(1000, 'AR balance must be at least $1,000'),
  outstandingDebt: z.number().min(0, 'Outstanding debt must be 0 or greater'),
  bankName: z.string().min(2, 'Bank name is required'),
  
  // Invoice Details
  averageCollectionPeriod: z.number().min(15).max(120, 'Collection period must be between 15-120 days'),
  badDebtPercentage: z.number().min(0).max(10, 'Bad debt percentage cannot exceed 10%'),
  hasDisputeHistory: z.boolean(),
  disputeDetails: z.string().optional(),
  
  // Additional Information
  hasExistingFactoring: z.boolean(),
  existingFactorDetails: z.string().optional(),
  reasonForFactoring: z.string().min(10, 'Please explain why you need factoring'),
  
  // Terms and Conditions
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
  agreeToCredit: z.boolean().refine(val => val === true, 'You must agree to the credit check'),
  certifyInformation: z.boolean().refine(val => val === true, 'You must certify the information is accurate'),
});

type InvoiceFactoringFormData = z.infer<typeof invoiceFactoringSchema>;

const STORAGE_KEY = 'invoice-factoring-draft';

const InvoiceFactoringForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const { submitApplication, isLoading } = useLoanApplication();
  const { toast } = useToast();

  const form = useForm<InvoiceFactoringFormData>({
    resolver: zodResolver(invoiceFactoringSchema),
    defaultValues: {
      hasDisputeHistory: false,
      hasExistingFactoring: false,
      agreeToTerms: false,
      agreeToCredit: false,
      certifyInformation: false,
      factorAdvanceRate: 80,
    },
  });

  const { clearOnSubmit } = useFormAutoSave({
    form,
    storageKey: STORAGE_KEY,
    excludeFields: ['federalTaxId', 'agreeToTerms', 'agreeToCredit', 'certifyInformation'],
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

  const onSubmit = async (data: InvoiceFactoringFormData) => {
    try {
      const applicationData = {
        loan_type: 'invoice_factoring' as const,
        first_name: data.contactName.split(' ')[0] || '',
        last_name: data.contactName.split(' ').slice(1).join(' ') || '',
        email: data.email,
        phone: data.phone,
        business_name: data.businessName,
        business_address: data.businessAddress,
        business_city: data.businessCity,
        business_state: data.businessState,
        business_zip: data.businessZip,
        years_in_business: data.yearsInBusiness,
        amount_requested: data.monthlyInvoiceVolume,
        loan_details: {
          ...data,
          loanType: 'invoice_factoring',
        },
      };

      const result = await submitApplication(applicationData);
      
      if (result) {
        clearOnSubmit();
        toast({
          title: "Application Submitted Successfully",
          description: `Your Invoice Factoring application has been submitted. Application ID: ${result.applicationNumber}`,
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

  const getFieldsForStep = (step: number): (keyof InvoiceFactoringFormData)[] => {
    switch (step) {
      case 1:
        return ['businessName', 'businessType', 'businessAddress', 'businessCity', 'businessState', 'businessZip', 'yearsInBusiness', 'industryType', 'federalTaxId', 'numberOfEmployees'];
      case 2:
        return ['contactName', 'contactTitle', 'email', 'phone'];
      case 3:
        return ['monthlyInvoiceVolume', 'averageInvoiceAmount', 'factorAdvanceRate', 'paymentTerms', 'invoiceFrequency'];
      case 4:
        return ['numberOfCustomers', 'largestCustomerPercentage', 'averageCustomerCreditRating', 'customerConcentration'];
      case 5:
        return ['annualRevenue', 'monthlyRevenue', 'accountsReceivableBalance', 'outstandingDebt', 'bankName', 'averageCollectionPeriod', 'badDebtPercentage'];
      case 6:
        return ['reasonForFactoring', 'agreeToTerms', 'agreeToCredit', 'certifyInformation'];
      default:
        return [];
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
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
                        step="0.5"
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
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="wholesale">Wholesale Trade</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="services">Professional Services</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="staffing">Staffing/Temp Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input 
                        {...field} 
                        placeholder="XX-XXXXXXX"
                        maxLength={10}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                          if (value.length >= 2) {
                            value = value.substring(0, 2) + '-' + value.substring(2, 9);
                          }
                          field.onChange(value);
                        }}
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
                name="businessState"
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
                name="businessZip"
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
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Contact Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title/Position *</FormLabel>
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
                    <FormLabel>Email Address *</FormLabel>
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
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Invoice & Factoring Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthlyInvoiceVolume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Invoice Volume * (Minimum $10,000)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter monthly volume"
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
                name="averageInvoiceAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Invoice Amount *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter average amount"
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
                name="factorAdvanceRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Advance Rate (%) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="70"
                        max="95"
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 80)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typical Payment Terms *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="net_15">Net 15</SelectItem>
                        <SelectItem value="net_30">Net 30</SelectItem>
                        <SelectItem value="net_45">Net 45</SelectItem>
                        <SelectItem value="net_60">Net 60</SelectItem>
                        <SelectItem value="net_90">Net 90</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="invoiceFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How Often Do You Invoice? *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi_weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="as_needed">As Needed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numberOfCustomers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Active Customers *</FormLabel>
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
                name="largestCustomerPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Largest Customer (% of Revenue) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        max="100"
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
                name="averageCustomerCreditRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Customer Credit Rating *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select credit rating" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent (750+)</SelectItem>
                        <SelectItem value="good">Good (650-749)</SelectItem>
                        <SelectItem value="fair">Fair (550-649)</SelectItem>
                        <SelectItem value="poor">Poor (Below 550)</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerConcentration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Base Concentration *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select concentration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="diversified">Well Diversified</SelectItem>
                        <SelectItem value="moderate">Moderately Concentrated</SelectItem>
                        <SelectItem value="concentrated">Highly Concentrated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="annualRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Revenue * (Minimum $50,000)</FormLabel>
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
                name="accountsReceivableBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current AR Balance *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter AR balance"
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
                name="outstandingDebt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outstanding Business Debt *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter outstanding debt"
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
                name="averageCollectionPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Collection Period (Days) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="15"
                        max="120"
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
              name="badDebtPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bad Debt Percentage (% of AR) *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      max="10"
                      placeholder="Enter percentage"
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 border-t pt-4">
              <FormField
                control={form.control}
                name="hasDisputeHistory"
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
                        Do you have a history of invoice disputes with customers?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch('hasDisputeHistory') && (
                <FormField
                  control={form.control}
                  name="disputeDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please provide details about disputes</FormLabel>
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

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Additional Information & Terms</h3>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="hasExistingFactoring"
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
                        Do you currently have factoring with another company?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch('hasExistingFactoring') && (
                <FormField
                  control={form.control}
                  name="existingFactorDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please provide details about your current factoring arrangement</FormLabel>
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
                name="reasonForFactoring"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why do you need invoice factoring? *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please explain your specific cash flow needs and how factoring will help your business..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Terms and Conditions</h4>
              
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
                        I authorize credit checks on my business and customers *
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
              <h4 className="font-medium mb-2">Invoice Factoring Benefits:</h4>
              <ul className="text-sm space-y-1">
                <li>• Immediate cash flow from your outstanding invoices</li>
                <li>• No monthly payments or interest charges</li>
                <li>• Credit protection on your customers</li>
                <li>• Professional collection services</li>
                <li>• Flexible financing that grows with your business</li>
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
          <FileText className="h-6 w-6 text-primary" />
          AR/Invoice Factoring Application
        </CardTitle>
        <CardDescription>
          Convert your outstanding invoices to immediate cash flow
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
                  <DollarSign className="h-4 w-4" />
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

export default InvoiceFactoringForm;