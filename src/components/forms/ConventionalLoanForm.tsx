import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SecureInput } from "@/components/ui/secure-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AutoSaveIndicator } from "@/components/ui/auto-save-indicator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLoanApplication } from "@/hooks/useLoanApplication";
import { useFormAutoSave } from "@/hooks/useFormAutoSave";
import { useNavigate } from "react-router-dom";
import { PhoneInput } from "@/components/ui/phone-input";

interface ConventionalLoanFormData {
  loanAmount: string;
  businessName: string;
  businessType: string;
  yearsInBusiness: string;
  annualRevenue: string;
  numberOfEmployees: string;
  creditScore: string;
  loanPurpose: string;
  collateralType: string;
  collateralValue: string;
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

const STORAGE_KEY = 'conventional-loan-draft';

export const ConventionalLoanForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const form = useForm<ConventionalLoanFormData>();
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

  const onSubmit = async (data: ConventionalLoanFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit your application.",
        variant: "destructive",
      });
      return;
    }

    const applicationData = {
      loan_type: "Conventional Loan",
      amount_requested: parseFloat(data.loanAmount),
      business_name: data.businessName,
      business_type: data.businessType,
      years_in_business: parseInt(data.yearsInBusiness),
      annual_revenue: parseFloat(data.annualRevenue),
      number_of_employees: parseInt(data.numberOfEmployees),
      purpose: data.loanPurpose,
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
        creditScore: data.creditScore,
        collateralType: data.collateralType,
        collateralValue: data.collateralValue,
        ownershipPercentage: data.ownershipPercentage
      }
    };

    const result = await submitApplication(applicationData);
    
    if (result) {
      clearOnSubmit();
      toast({
        title: "Application submitted successfully!",
        description: "We'll review your conventional loan application and get back to you soon.",
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
            <h3 className="text-lg font-semibold">Loan Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loanAmount">Loan Amount Requested</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  placeholder="Enter loan amount"
                  {...register("loanAmount", { required: "Loan amount is required" })}
                />
                {errors.loanAmount && <p className="text-sm text-destructive">{errors.loanAmount.message}</p>}
              </div>
              <div>
                <Label htmlFor="loanPurpose">Loan Purpose</Label>
                <Select onValueChange={(value) => setValue("loanPurpose", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="working_capital">Working Capital Loan</SelectItem>
                    <SelectItem value="equipment_purchase">Equipment Purchase</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="business_expansion">Business Expansion</SelectItem>
                    <SelectItem value="debt_consolidation">Debt Consolidation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="creditScore">Personal Credit Score</Label>
                <Select onValueChange={(value) => setValue("creditScore", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select credit score range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent (750+)</SelectItem>
                    <SelectItem value="good">Good (700-749)</SelectItem>
                    <SelectItem value="fair">Fair (650-699)</SelectItem>
                    <SelectItem value="poor">Poor (Below 650)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="collateralType">Collateral Type</Label>
                <Select onValueChange={(value) => setValue("collateralType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select collateral type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="accounts_receivable">Accounts Receivable</SelectItem>
                    <SelectItem value="personal_guarantee">Personal Guarantee</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="collateralValue">Collateral Value</Label>
                <Input
                  id="collateralValue"
                  type="number"
                  placeholder="Estimated collateral value"
                  {...register("collateralValue")}
                />
              </div>
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
                <SecureInput
                  id="ownerSSN"
                  type="ssn"
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
                   onChange={(value) => setValue("phoneNumber", value)}
                />
                {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <SecureInput
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
        <CardTitle>Conventional Loan Application</CardTitle>
        <CardDescription>
          Step {currentStep} of {totalSteps}: Complete your conventional loan application
        </CardDescription>
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