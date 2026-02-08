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

interface USDABILoanFormData {
  loanAmount: string;
  businessName: string;
  businessType: string;
  yearsInBusiness: string;
  annualRevenue: string;
  numberOfEmployees: string;
  industryType: string;
  ruralLocation: string;
  projectDescription: string;
  jobsCreated: string;
  jobsRetained: string;
  ownerName: string;
  ownerSSN: string;
  ownerEquity: string;
  collateralDescription: string;
  businessAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
}

const STORAGE_KEY = 'usda-bi-loan-draft';

export const USDABILoanForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const form = useForm<USDABILoanFormData>();
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

  const onSubmit = async (data: USDABILoanFormData) => {
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
      loan_type: "USDA B&I Loan",
      amount_requested: parseFloat(data.loanAmount),
      business_name: data.businessName,
      business_type: data.businessType,
      years_in_business: parseInt(data.yearsInBusiness),
      annual_revenue: parseFloat(data.annualRevenue),
      number_of_employees: parseInt(data.numberOfEmployees),
      purpose: data.projectDescription,
      first_name: data.ownerName.split(' ')[0] || data.ownerName,
      last_name: data.ownerName.split(' ').slice(1).join(' ') || '',
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
        industryType: data.industryType,
        ruralLocation: data.ruralLocation,
        jobsCreated: data.jobsCreated,
        jobsRetained: data.jobsRetained,
        ownerEquity: data.ownerEquity,
        collateralDescription: data.collateralDescription
      }
    };

    const result = await submitApplication(applicationData);
    
    if (result) {
      clearOnSubmit();
      toast({
        title: "Application submitted successfully!",
        description: "We'll review your USDA B&I loan application and get back to you soon.",
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
                <Label htmlFor="industryType">Industry Type</Label>
                <Select onValueChange={(value) => setValue("industryType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="tourism">Tourism</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ruralLocation">Located in Rural Area?</Label>
                <Select onValueChange={(value) => setValue("ruralLocation", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes - Rural area</SelectItem>
                    <SelectItem value="no">No - Urban area</SelectItem>
                    <SelectItem value="unsure">Not sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="projectDescription">Project Description</Label>
              <Textarea
                id="projectDescription"
                placeholder="Describe your project and how it will benefit the rural community"
                {...register("projectDescription", { required: "Project description is required" })}
              />
              {errors.projectDescription && <p className="text-sm text-destructive">{errors.projectDescription.message}</p>}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobsCreated">Jobs to be Created</Label>
                <Input
                  id="jobsCreated"
                  type="number"
                  placeholder="Number of jobs to be created"
                  {...register("jobsCreated")}
                />
              </div>
              <div>
                <Label htmlFor="jobsRetained">Jobs to be Retained</Label>
                <Input
                  id="jobsRetained"
                  type="number"
                  placeholder="Number of jobs to be retained"
                  {...register("jobsRetained")}
                />
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
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  placeholder="Full name of owner"
                  {...register("ownerName", { required: "Owner name is required" })}
                />
                {errors.ownerName && <p className="text-sm text-destructive">{errors.ownerName.message}</p>}
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
                <Label htmlFor="ownerEquity">Owner Equity Investment</Label>
                <Input
                  id="ownerEquity"
                  type="number"
                  placeholder="Amount of owner equity"
                  {...register("ownerEquity", { required: "Owner equity is required" })}
                />
                {errors.ownerEquity && <p className="text-sm text-destructive">{errors.ownerEquity.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="collateralDescription">Collateral Description</Label>
              <Textarea
                id="collateralDescription"
                placeholder="Describe collateral to be used for the loan"
                {...register("collateralDescription", { required: "Collateral description is required" })}
              />
              {errors.collateralDescription && <p className="text-sm text-destructive">{errors.collateralDescription.message}</p>}
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
        <CardTitle>USDA Business & Industry Loan Application</CardTitle>
        <CardDescription>
          Step {currentStep} of {totalSteps}: Complete your USDA B&I loan application
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