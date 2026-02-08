import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AutoSaveIndicator } from "@/components/ui/auto-save-indicator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLoanApplication } from "@/hooks/useLoanApplication";
import { useFormAutoSave } from "@/hooks/useFormAutoSave";
import { useNavigate } from "react-router-dom";
import { PhoneInput, isValidPhoneNumber } from "@/components/ui/phone-input";

interface BusinessLineOfCreditFormData {
  creditLimit: string;
  businessName: string;
  businessType: string;
  yearsInBusiness: string;
  annualRevenue: string;
  numberOfEmployees: string;
  creditPurpose: string;
  drawPeriod: string;
  intendedUse: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerSSN: string;
  ownershipPercentage: string;
  businessAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
}

const STORAGE_KEY = 'business-loc-draft';

export const BusinessLineOfCreditForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const form = useForm<BusinessLineOfCreditFormData>();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = form;
  const { toast } = useToast();
  const { user } = useAuth();
  const { submitApplication, isLoading } = useLoanApplication();
  const navigate = useNavigate();

  const { clearOnSubmit } = useFormAutoSave({
    form,
    storageKey: STORAGE_KEY,
    excludeFields: ['ownerSSN'],
  });

  const totalSteps = 4;

  const onSubmit = async (data: BusinessLineOfCreditFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit your application.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidPhoneNumber(data.phoneNumber || "")) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return;
    }

    const applicationData = {
      loan_type: "Business Line of Credit",
      amount_requested: parseFloat(data.creditLimit),
      business_name: data.businessName,
      business_type: data.businessType,
      years_in_business: parseInt(data.yearsInBusiness),
      annual_revenue: parseFloat(data.annualRevenue),
      number_of_employees: parseInt(data.numberOfEmployees),
      purpose: data.creditPurpose,
      first_name: data.ownerFirstName,
      last_name: data.ownerLastName,
      ssn: data.ownerSSN,
      phone: data.phoneNumber,
      email: data.email,
      address: data.businessAddress,
      city: data.city,
      state: data.state,
      zip_code: data.zipCode,
      business_address: data.businessAddress,
      business_city: data.city,
      business_state: data.state,
      business_zip: data.zipCode,
      loan_details: {
        creditLimit: data.creditLimit,
        drawPeriod: data.drawPeriod,
        intendedUse: data.intendedUse,
        ownershipPercentage: data.ownershipPercentage
      }
    };

    const result = await submitApplication(applicationData);
    
    if (result) {
      clearOnSubmit();
      toast({
        title: "Application submitted successfully!",
        description: "We'll review your business line of credit application and get back to you soon.",
      });
      navigate('/');
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Credit Line Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="creditLimit">Credit Limit Requested</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  placeholder="Enter credit limit amount"
                  {...register("creditLimit", { required: "Credit limit is required" })}
                />
                {errors.creditLimit && <p className="text-sm text-destructive">{errors.creditLimit.message}</p>}
              </div>
              <div>
                <Label htmlFor="drawPeriod">Draw Period Preference</Label>
                <Select onValueChange={(value) => setValue("drawPeriod", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select draw period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_year">1 Year</SelectItem>
                    <SelectItem value="2_years">2 Years</SelectItem>
                    <SelectItem value="3_years">3 Years</SelectItem>
                    <SelectItem value="5_years">5 Years</SelectItem>
                    <SelectItem value="ongoing">Ongoing/Revolving</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="creditPurpose">Primary Purpose of Credit Line</Label>
              <Select onValueChange={(value) => setValue("creditPurpose", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="working_capital">Working Capital Loan</SelectItem>
                  <SelectItem value="inventory_financing">Inventory Financing</SelectItem>
                  <SelectItem value="seasonal_operations">Seasonal Operations</SelectItem>
                  <SelectItem value="cash_flow_management">Cash Flow Management</SelectItem>
                  <SelectItem value="emergency_funds">Emergency Funds</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="intendedUse">Intended Use Details</Label>
              <Textarea
                id="intendedUse"
                placeholder="Describe how you plan to use the line of credit"
                {...register("intendedUse", { required: "Intended use is required" })}
              />
              {errors.intendedUse && <p className="text-sm text-destructive">{errors.intendedUse.message}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Enter business name"
                  {...register("businessName", { required: "Business name is required" })}
                />
                {errors.businessName && <p className="text-sm text-destructive">{errors.businessName.message}</p>}
              </div>
              <div>
                <Label htmlFor="businessType">Business Type</Label>
                <Select onValueChange={(value) => setValue("businessType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="llc">LLC</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="yearsInBusiness">Years in Business</Label>
                <Input
                  id="yearsInBusiness"
                  type="number"
                  placeholder="Years in business"
                  {...register("yearsInBusiness", { required: "Years in business is required" })}
                />
                {errors.yearsInBusiness && <p className="text-sm text-destructive">{errors.yearsInBusiness.message}</p>}
              </div>
              <div>
                <Label htmlFor="annualRevenue">Annual Revenue</Label>
                <Input
                  id="annualRevenue"
                  type="number"
                  placeholder="Annual revenue"
                  {...register("annualRevenue", { required: "Annual revenue is required" })}
                />
                {errors.annualRevenue && <p className="text-sm text-destructive">{errors.annualRevenue.message}</p>}
              </div>
              <div>
                <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                <Input
                  id="numberOfEmployees"
                  type="number"
                  placeholder="Number of employees"
                  {...register("numberOfEmployees", { required: "Number of employees is required" })}
                />
                {errors.numberOfEmployees && <p className="text-sm text-destructive">{errors.numberOfEmployees.message}</p>}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Owner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ownerFirstName">Owner First Name</Label>
                <Input
                  id="ownerFirstName"
                  placeholder="First name"
                  {...register("ownerFirstName", { required: "First name is required" })}
                />
                {errors.ownerFirstName && <p className="text-sm text-destructive">{errors.ownerFirstName.message}</p>}
              </div>
              <div>
                <Label htmlFor="ownerLastName">Owner Last Name</Label>
                <Input
                  id="ownerLastName"
                  placeholder="Last name"
                  {...register("ownerLastName", { required: "Last name is required" })}
                />
                {errors.ownerLastName && <p className="text-sm text-destructive">{errors.ownerLastName.message}</p>}
              </div>
              <div>
                <Label htmlFor="ownerSSN">Owner SSN</Label>
                <Input
                  id="ownerSSN"
                  placeholder="XXX-XX-XXXX"
                  {...register("ownerSSN", { required: "Owner SSN is required" })}
                />
                {errors.ownerSSN && <p className="text-sm text-destructive">{errors.ownerSSN.message}</p>}
              </div>
              <div>
                <Label htmlFor="ownershipPercentage">Ownership Percentage</Label>
                <Input
                  id="ownershipPercentage"
                  type="number"
                  placeholder="Ownership percentage"
                  {...register("ownershipPercentage", { required: "Ownership percentage is required" })}
                />
                {errors.ownershipPercentage && <p className="text-sm text-destructive">{errors.ownershipPercentage.message}</p>}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessAddress">Business Address</Label>
                <Input
                  id="businessAddress"
                  placeholder="Street address"
                  {...register("businessAddress", { required: "Business address is required" })}
                />
                {errors.businessAddress && <p className="text-sm text-destructive">{errors.businessAddress.message}</p>}
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  {...register("city", { required: "City is required" })}
                />
                {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="State"
                  {...register("state", { required: "State is required" })}
                />
                {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  placeholder="ZIP code"
                  {...register("zipCode", { required: "ZIP code is required" })}
                />
                {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode.message}</p>}
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                 <PhoneInput
                   value={watch("phoneNumber") || ""}
                   onChange={(value) => setValue("phoneNumber", value, { shouldValidate: true })}
                />
                {!isValidPhoneNumber(watch("phoneNumber") || "") && watch("phoneNumber") && (
                  <p className="text-sm text-destructive">Phone number must be exactly 10 digits</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Business Line of Credit Application</CardTitle>
            <CardDescription>
              Step {currentStep} of {totalSteps}: Complete your line of credit application
            </CardDescription>
          </div>
          <AutoSaveIndicator storageKey={STORAGE_KEY} />
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                {isLoading ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};