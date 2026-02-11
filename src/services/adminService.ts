import { authProvider } from '@/services/auth';
import { auditService } from './auditService';
import { invokeEdgeFunction, restQuery } from './supabaseHttp';

export interface ApplicationStats {
  total: number;
  byStatus: { [key: string]: number };
  byLoanType: { [key: string]: number };
  totalAmount: number;
  averageAmount: number;
  thisMonth: number;
  thisWeek: number;
}

export interface ApplicationFilter {
  status?: string;
  loanType?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  searchTerm?: string;
}

export interface Analytics {
  totalApplications: number;
  applicationsTrend: { last30Days: number; last7Days: number };
  approvalRate: { total: number; last30Days: number };
  averageProcessingTime: number;
  topLoanTypes: Array<{ type: string; count: number; percentage: number }>;
  amountDistribution: Array<{ range: string; count: number }>;
  statusDistribution: Array<{ status: string; count: number; percentage: number }>;
}

const BASE_URL = 'https://zosgzkpfgaaadadezpxo.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvc2d6a3BmZ2FhYWRhZGV6cHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzAxMjgsImV4cCI6MjA2OTE0NjEyOH0.r2puMuMTlbLkXqceD7MfC630q_W0K-9GbI632BtFJOY';

class AdminService {
  async getApplicationStats(): Promise<ApplicationStats> {
    try {
      await auditService.logAdminDashboardAccess('statistics');
      const data = await invokeEdgeFunction('admin-dashboard', null);
      return data.stats;
    } catch (error) {
      console.error('Error fetching application stats:', error);
      throw new Error('Failed to fetch application statistics');
    }
  }

  async getFilteredApplications(filters: ApplicationFilter) {
    try {
      const data = await invokeEdgeFunction('admin-dashboard', { action: 'applications', ...filters });
      await auditService.logAccess({ action: 'VIEW_LOAN_APPLICATIONS', resourceType: 'loan_application', details: { filters, resultCount: data.applications?.length || 0 } });
      return data.applications;
    } catch (error) {
      console.error('Error fetching filtered applications:', error);
      throw new Error('Failed to fetch applications');
    }
  }

  async updateApplicationStatus(applicationId: string, status: string, notes?: string) {
    try {
      const data = await invokeEdgeFunction('admin-dashboard', { applicationId, status, notes });
      await auditService.logLoanApplicationAccess(applicationId, 'update', { newStatus: status, notes });
      return data;
    } catch (error) {
      console.error('Error updating application status:', error);
      throw new Error('Failed to update application status');
    }
  }

  async exportApplications(filters: ApplicationFilter): Promise<Blob> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('action', 'export');
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') searchParams.append(key, value.toString());
      });

      const { data: sessionData } = await authProvider.getSession();
      const response = await fetch(`${BASE_URL}/functions/v1/admin-dashboard?${searchParams}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionData?.session?.access_token}`,
          apikey: ANON_KEY,
        },
      });
      if (!response.ok) throw new Error('Export failed');
      await auditService.logDataExport('applications', { ...filters } as Record<string, unknown>, 0);
      return await response.blob();
    } catch (error) {
      console.error('Error exporting applications:', error);
      throw new Error('Failed to export applications');
    }
  }

  async getAnalytics(): Promise<Analytics> {
    try {
      await auditService.logAdminDashboardAccess('analytics');
      const data = await invokeEdgeFunction('admin-dashboard', null);
      return data.analytics;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw new Error('Failed to fetch analytics');
    }
  }

  async getAllApplications() {
    try {
      const p = new URLSearchParams();
      p.set('select', '*, profiles(first_name, last_name)');
      p.set('order', 'created_at.desc');
      const { data } = await restQuery('loan_applications', { params: p });
      await auditService.logAccess({ action: 'VIEW_LOAN_APPLICATIONS', resourceType: 'loan_application', details: { accessType: 'all_applications', resultCount: data?.length || 0 } });
      return data;
    } catch (error) {
      console.error('Error fetching all applications:', error);
      throw new Error('Failed to fetch applications');
    }
  }

  async getApplicationDetails(applicationId: string) {
    try {
      const p = new URLSearchParams();
      p.set('select', '*, profiles(*)');
      p.set('id', `eq.${applicationId}`);
      const { data } = await restQuery('loan_applications', { params: p, single: true });
      await auditService.logLoanApplicationAccess(applicationId, 'view', { borrowerUserId: data?.user_id, loanType: data?.loan_type, status: data?.status });
      return data;
    } catch (error) {
      console.error('Error fetching application details:', error);
      throw new Error('Failed to fetch application details');
    }
  }

  async batchUpdateStatus(applicationIds: string[], status: string, notes?: string) {
    try {
      const p = new URLSearchParams();
      p.set('id', `in.(${applicationIds.join(',')})`);
      const { data } = await restQuery('loan_applications', {
        method: 'PATCH',
        params: p,
        body: { status, updated_at: new Date().toISOString() },
        returnData: true,
      });
      for (const appId of applicationIds) {
        await auditService.logLoanApplicationAccess(appId, 'update', { batchOperation: true, newStatus: status, notes, totalInBatch: applicationIds.length });
      }
      return data;
    } catch (error) {
      console.error('Error batch updating applications:', error);
      throw new Error('Failed to batch update applications');
    }
  }

  async getBorrowerBankAccounts(borrowerUserId: string) {
    try {
      const p = new URLSearchParams();
      p.set('user_id', `eq.${borrowerUserId}`);
      p.set('order', 'created_at.desc');
      const { data } = await restQuery('bank_accounts', { params: p });
      await auditService.logBankAccountAccess(data?.map((a: any) => a.id) || [], 'list', borrowerUserId);
      return data;
    } catch (error) {
      console.error('Error fetching borrower bank accounts:', error);
      throw new Error('Failed to fetch bank accounts');
    }
  }

  async getBorrowerBankAccountsMasked(borrowerUserId: string) {
    try {
      const p = new URLSearchParams();
      p.set('user_id', `eq.${borrowerUserId}`);
      p.set('order', 'created_at.desc');
      const { data } = await restQuery('bank_accounts_masked', { params: p });
      await auditService.logBankAccountAccess(data?.map((a: any) => a.id) || [], 'masked', borrowerUserId);
      return data;
    } catch (error) {
      console.error('Error fetching masked bank accounts:', error);
      throw new Error('Failed to fetch bank accounts');
    }
  }
}

export const adminService = new AdminService();
