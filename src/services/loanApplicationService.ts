import { invokeEdgeFunction, restQuery } from './supabaseHttp';

export interface LoanApplicationValidation {
  isValid: boolean;
  errors: string[];
  riskScore: number;
  autoApprovalEligible: boolean;
}

export interface LoanEligibility {
  eligible: boolean;
  maxLoanAmount: number;
  interestRateRange: { min: number; max: number };
  termOptions: string[];
  requirements: string[];
  reasons: string[];
}

export interface LoanApplicationData {
  loan_type: string;
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
  loan_details: any;
}

class LoanApplicationService {
  async validateApplication(applicationData: LoanApplicationData): Promise<LoanApplicationValidation> {
    try {
      return await invokeEdgeFunction('loan-application-processor', { action: 'validate', applicationData });
    } catch (error) {
      console.error('Error validating application:', error);
      throw new Error('Failed to validate application');
    }
  }

  async processApplication(applicationData: LoanApplicationData) {
    try {
      return await invokeEdgeFunction('loan-application-processor', { action: 'process', applicationData });
    } catch (error) {
      console.error('Error processing application:', error);
      throw new Error('Failed to process application');
    }
  }

  async updateApplicationStatus(applicationId: string, status: string, notes?: string) {
    try {
      return await invokeEdgeFunction('loan-application-processor', { action: 'updateStatus', applicationId, applicationData: { status, notes } });
    } catch (error) {
      console.error('Error updating application status:', error);
      throw new Error('Failed to update application status');
    }
  }

  async calculateEligibility(applicationData: LoanApplicationData): Promise<LoanEligibility> {
    try {
      return await invokeEdgeFunction('loan-application-processor', { action: 'calculate-eligibility', applicationData });
    } catch (error) {
      console.error('Error calculating eligibility:', error);
      throw new Error('Failed to calculate eligibility');
    }
  }

  async getUserApplications(userId: string) {
    try {
      const p = new URLSearchParams();
      p.set('user_id', `eq.${userId}`);
      p.set('order', 'created_at.desc');
      const { data } = await restQuery('loan_applications', { params: p });
      return data;
    } catch (error) {
      console.error('Error fetching user applications:', error);
      throw new Error('Failed to fetch applications');
    }
  }

  async getApplicationById(applicationId: string) {
    try {
      const p = new URLSearchParams();
      p.set('id', `eq.${applicationId}`);
      const { data } = await restQuery('loan_applications', { params: p, single: true });
      return data;
    } catch (error) {
      console.error('Error fetching application:', error);
      throw new Error('Failed to fetch application');
    }
  }

  async saveAsDraft(userId: string, applicationData: Partial<LoanApplicationData>) {
    try {
      const { data } = await restQuery('loan_applications', {
        method: 'POST',
        body: {
          user_id: userId,
          loan_type: applicationData.loan_type,
          amount_requested: applicationData.amount_requested,
          first_name: applicationData.first_name,
          last_name: applicationData.last_name,
          phone: applicationData.phone,
          business_name: applicationData.business_name,
          business_address: applicationData.business_address,
          business_city: applicationData.business_city,
          business_state: applicationData.business_state,
          business_zip: applicationData.business_zip,
          years_in_business: applicationData.years_in_business,
          loan_details: applicationData.loan_details || {},
          status: 'draft',
          application_started_date: new Date().toISOString(),
        },
        returnData: true,
        single: true,
      });
      return data;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw new Error('Failed to save draft');
    }
  }

  async deleteApplication(applicationId: string, userId: string) {
    try {
      const p = new URLSearchParams();
      p.set('id', `eq.${applicationId}`);
      p.set('user_id', `eq.${userId}`);
      p.set('status', `eq.draft`);
      await restQuery('loan_applications', { method: 'DELETE', params: p });
      return { success: true };
    } catch (error) {
      console.error('Error deleting application:', error);
      throw new Error('Failed to delete application');
    }
  }
}

export const loanApplicationService = new LoanApplicationService();
