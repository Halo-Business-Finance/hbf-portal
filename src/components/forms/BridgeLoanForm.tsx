import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';
import { useToast } from '@/hooks/use-toast';
import { useFormAutoSave } from '@/hooks/useFormAutoSave';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormSection, FormRow } from '@/components/ui/form-section';
import { DollarSign, User, Building2, MapPin, FileText } from 'lucide-react';

interface BridgeLoanFormData {
  amount_requested: number;
  first_name: string;
  last_name: string;
  phone: string;
  business_name: string;
  business_address: string;
  business_city: string;
  business_state: string;
  business_zip: string;
  years_in_business: number;
  property_type: string;
  property_value: number;
  loan_term: string;
  exit_strategy: string;
  project_description: string;
}

const STORAGE_KEY = 'bridge-loan-draft';

const BridgeLoanForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<BridgeLoanFormData>();
  const { register, handleSubmit, formState: { errors }, setValue } = form;
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { clearOnSubmit } = useFormAutoSave({
    form,
    storageKey: STORAGE_KEY,
  });

  const onSubmit = async (data: BridgeLoanFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit your application.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('loan_applications')
        .insert({
          user_id: user.id,
          loan_type: 'bridge_loan',
          amount_requested: data.amount_requested,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          business_name: data.business_name,
          business_address: data.business_address,
          business_city: data.business_city,
          business_state: data.business_state,
          business_zip: data.business_zip,
          years_in_business: data.years_in_business,
          loan_details: {
            property_type: data.property_type,
            property_value: data.property_value,
            loan_term: data.loan_term,
            exit_strategy: data.exit_strategy,
            project_description: data.project_description,
          },
          status: 'submitted',
          application_submitted_date: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      clearOnSubmit();
      toast({
        title: "Application Submitted",
        description: "Your bridge loan application has been submitted successfully.",
      });

      navigate('/');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Bridge Loan Application</CardTitle>
              <CardDescription className="text-sm">
                Complete this form to apply for short-term bridge financing
              </CardDescription>
            </div>
            <AutoSaveIndicator storageKey={STORAGE_KEY} />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
            {/* Loan Details Section */}
            <FormSection title="Loan Details" description="Specify your funding requirements" icon={DollarSign}>
            <FormRow cols={2}>
              <div className="space-y-2">
                <Label htmlFor="amount_requested">Loan Amount Requested *</Label>
                <Input
                  id="amount_requested"
                  type="number"
                  placeholder="Enter loan amount"
                  {...register('amount_requested', { 
                    required: 'Loan amount is required',
                    min: { value: 1000, message: 'Minimum loan amount is $1,000' }
                  })}
                />
                {errors.amount_requested && (
                  <p className="text-sm text-destructive">{errors.amount_requested.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="loan_term">Desired Loan Term *</Label>
                <Select onValueChange={(value) => setValue('loan_term', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6_months">6 Months</SelectItem>
                    <SelectItem value="12_months">12 Months</SelectItem>
                    <SelectItem value="18_months">18 Months</SelectItem>
                    <SelectItem value="24_months">24 Months</SelectItem>
                    <SelectItem value="36_months">36 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FormRow>
            </FormSection>

            {/* Personal Information Section */}
            <FormSection title="Personal Information" description="Your contact details" icon={User}>
            <FormRow cols={2}>
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  placeholder="Enter first name"
                  {...register('first_name', { required: 'First name is required' })}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  placeholder="Enter last name"
                  {...register('last_name', { required: 'Last name is required' })}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name.message}</p>
                )}
              </div>
            </FormRow>

            <FormRow cols={2}>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  {...register('phone', { required: 'Phone number is required' })}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  placeholder="Enter business name"
                  {...register('business_name', { required: 'Business name is required' })}
                />
                {errors.business_name && (
                  <p className="text-sm text-destructive">{errors.business_name.message}</p>
                )}
              </div>
            </FormRow>
            </FormSection>

            {/* Business Address Section */}
            <FormSection title="Business Address" description="Your business location" icon={Building2}>
            <div className="space-y-2">
              <Label htmlFor="business_address">Business Address *</Label>
              <Input
                id="business_address"
                placeholder="Enter business address"
                {...register('business_address', { required: 'Business address is required' })}
              />
              {errors.business_address && (
                <p className="text-sm text-destructive">{errors.business_address.message}</p>
              )}
            </div>

            <FormRow cols={3}>
              <div className="space-y-2">
                <Label htmlFor="business_city">City *</Label>
                <Input
                  id="business_city"
                  placeholder="City"
                  {...register('business_city', { required: 'City is required' })}
                />
                {errors.business_city && (
                  <p className="text-sm text-destructive">{errors.business_city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_state">State *</Label>
                <Input
                  id="business_state"
                  placeholder="State"
                  {...register('business_state', { required: 'State is required' })}
                />
                {errors.business_state && (
                  <p className="text-sm text-destructive">{errors.business_state.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_zip">ZIP Code *</Label>
                <Input
                  id="business_zip"
                  placeholder="ZIP Code"
                  {...register('business_zip', { required: 'ZIP code is required' })}
                />
                {errors.business_zip && (
                  <p className="text-sm text-destructive">{errors.business_zip.message}</p>
                )}
              </div>
            </FormRow>
            </FormSection>

            {/* Property Information Section */}
            <FormSection title="Property Information" description="Details about the property" icon={MapPin}>
            <FormRow cols={2}>
              <div className="space-y-2">
                <Label htmlFor="property_type">Property Type *</Label>
                <Select onValueChange={(value) => setValue('property_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Office Building</SelectItem>
                    <SelectItem value="retail">Retail Space</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="multifamily">Multifamily</SelectItem>
                    <SelectItem value="mixed_use">Mixed Use</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_value">Property Value *</Label>
                <Input
                  id="property_value"
                  type="number"
                  placeholder="Enter property value"
                  {...register('property_value', { 
                    required: 'Property value is required',
                    min: { value: 1, message: 'Property value must be greater than 0' }
                  })}
                />
                {errors.property_value && (
                  <p className="text-sm text-destructive">{errors.property_value.message}</p>
                )}
              </div>
            </FormRow>

            <div className="space-y-2">
              <Label htmlFor="years_in_business">Years in Business *</Label>
              <Input
                id="years_in_business"
                type="number"
                placeholder="Years in business"
                {...register('years_in_business', { 
                  required: 'Years in business is required',
                  min: { value: 0, message: 'Years cannot be negative' }
                })}
              />
              {errors.years_in_business && (
                <p className="text-sm text-destructive">{errors.years_in_business.message}</p>
              )}
            </div>
            </FormSection>

            {/* Exit Strategy Section */}
            <FormSection title="Exit Strategy" description="Your repayment plan" icon={FileText}>
            <div className="space-y-2">
              <Label htmlFor="exit_strategy">Exit Strategy *</Label>
              <Select onValueChange={(value) => setValue('exit_strategy', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exit strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale of Property</SelectItem>
                  <SelectItem value="refinance">Permanent Refinancing</SelectItem>
                  <SelectItem value="lease_up">Lease Up and Stabilize</SelectItem>
                  <SelectItem value="construction_complete">Construction Completion</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_description">Project Description *</Label>
              <Textarea
                id="project_description"
                placeholder="Describe your project and intended use of funds"
                rows={4}
                {...register('project_description', { required: 'Project description is required' })}
              />
              {errors.project_description && (
                <p className="text-sm text-destructive">{errors.project_description.message}</p>
              )}
            </div>
            </FormSection>

            <div className="flex justify-center pt-4 sm:pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 text-base sm:text-lg"
              >
                {isLoading ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BridgeLoanForm;