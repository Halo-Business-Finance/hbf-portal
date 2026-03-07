import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { loanApplicationService, type LoanApplicationData } from '@/services/loanApplicationService';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeFormData } from '@/lib/utils';
import { crmSyncService } from '@/services/crmSyncService';

export const useLoanApplication = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const validateApplication = useCallback(async (applicationData: LoanApplicationData) => {
    try {
      setIsLoading(true);
      const result = await loanApplicationService.validateApplication(applicationData);
      setValidation(result);
      return result;
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Failed to validate application data.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const checkEligibility = useCallback(async (applicationData: LoanApplicationData) => {
    try {
      setIsLoading(true);
      const result = await loanApplicationService.calculateEligibility(applicationData);
      setEligibility(result);
      return result;
    } catch (error) {
      toast({
        title: "Eligibility Check Failed",
        description: "Failed to check loan eligibility.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const submitApplication = useCallback(async (applicationData: LoanApplicationData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit your application.",
        variant: "destructive",
      });
      return null;
    }

    try {
      setIsLoading(true);

      const sanitizedData = sanitizeFormData(applicationData) as LoanApplicationData;

      const validationResult = await loanApplicationService.validateApplication(sanitizedData);
      if (!validationResult.isValid) {
        toast({
          title: "Validation Failed",
          description: validationResult.errors.join(', '),
          variant: "destructive",
        });
        return null;
      }

      const result = await loanApplicationService.processApplication(sanitizedData);

      if (result.success) {
        // Sync to CRM (non-blocking)
        crmSyncService.syncLoanApplication({
          application_id: result.application.id,
          user_id: user.id,
          loan_type: sanitizedData.loan_type,
          amount_requested: sanitizedData.amount_requested,
          status: 'submitted',
          business_name: sanitizedData.business_name,
          first_name: sanitizedData.first_name,
          last_name: sanitizedData.last_name,
          phone: sanitizedData.phone,
        }).catch(err => console.warn('[CRM Sync] Non-critical sync error:', err));

        await notificationService.sendApplicationSubmittedNotification(
          user.email || `${applicationData.first_name}@example.com`,
          `${applicationData.first_name} ${applicationData.last_name}`,
          result.application.application_number,
          result.application.id
        );

        toast({
          title: "Application Submitted",
          description: `Your application #${result.application.application_number} has been submitted successfully.`,
        });

        return result;
      } else {
        toast({
          title: "Submission Failed",
          description: result.message || "Failed to submit application.",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const saveAsDraft = useCallback(async (applicationData: Partial<LoanApplicationData>) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your application.",
        variant: "destructive",
      });
      return null;
    }

    try {
      setIsLoading(true);
      const result = await loanApplicationService.saveAsDraft(user.id, applicationData);

      // Sync draft to CRM (non-blocking)
      if (result?.id) {
        crmSyncService.syncLoanApplication({
          application_id: result.id,
          user_id: user.id,
          loan_type: applicationData.loan_type || 'unknown',
          amount_requested: applicationData.amount_requested || 0,
          status: 'draft',
          business_name: applicationData.business_name,
          first_name: applicationData.first_name,
          last_name: applicationData.last_name,
          phone: applicationData.phone,
        }).catch(err => console.warn('[CRM Sync] Non-critical sync error:', err));
      }

      toast({
        title: "Draft Saved",
        description: "Your application has been saved as a draft.",
      });

      return result;
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Save Error",
        description: "Failed to save application draft.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const deleteApplication = useCallback(async (applicationId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete your application.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsLoading(true);
      await loanApplicationService.deleteApplication(applicationId, user.id);
      
      toast({
        title: "Application Deleted",
        description: "Your draft application has been deleted.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete application.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  return {
    isLoading,
    validation,
    eligibility,
    validateApplication,
    checkEligibility,
    submitApplication,
    saveAsDraft,
    deleteApplication,
    setValidation,
    setEligibility
  };
};
