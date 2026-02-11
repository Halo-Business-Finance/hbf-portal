import { authProvider } from '@/services/auth';
import { invokeEdgeFunction, restQuery } from './supabaseHttp';

export type AuditAction =
  | 'VIEW_BANK_ACCOUNTS'
  | 'VIEW_BANK_ACCOUNT_DETAIL'
  | 'VIEW_LOAN_APPLICATIONS'
  | 'VIEW_LOAN_APPLICATION_DETAIL'
  | 'VIEW_CREDIT_REPORTS'
  | 'VIEW_USER_PROFILE'
  | 'UPDATE_APPLICATION_STATUS'
  | 'EXPORT_DATA'
  | 'VIEW_ADMIN_DASHBOARD'
  | 'VIEW_SECURITY_AUDIT'
  | 'MANAGE_USER_ROLES'
  | 'ASSIGN_APPLICATION'
  | 'UPDATE_ASSIGNMENT'
  | 'DELETE_ASSIGNMENT'
  | 'REPEATED_FAILED_LOGIN'
  | 'RATE_LIMIT_TRIGGERED'
  | 'SESSION_TIMEOUT';

export type ResourceType =
  | 'bank_account'
  | 'loan_application'
  | 'credit_report'
  | 'user_profile'
  | 'admin_dashboard'
  | 'security_audit'
  | 'user_role'
  | 'application_assignment';

interface AuditLogParams {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  details?: Record<string, unknown>;
}

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: unknown;
  created_at: string;
}

class AuditService {
  async logAccess(params: AuditLogParams): Promise<void> {
    try {
      const { data } = await authProvider.getSession();
      const session = data?.session;
      if (!session?.user) {
        console.warn('Audit log skipped: No authenticated user');
        return;
      }

      await invokeEdgeFunction('audit-logger', {
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || null,
        details: {
          ...params.details,
          timestamp: new Date().toISOString(),
          sessionId: session.access_token?.slice(-10),
        },
      });
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  async logBankAccountAccess(accountIds: string[], accessType: 'list' | 'detail' | 'masked', borrowerUserId?: string): Promise<void> {
    await this.logAccess({
      action: accessType === 'detail' ? 'VIEW_BANK_ACCOUNT_DETAIL' : 'VIEW_BANK_ACCOUNTS',
      resourceType: 'bank_account',
      resourceId: accountIds.length === 1 ? accountIds[0] : undefined,
      details: { accountCount: accountIds.length, accountIds: accountIds.slice(0, 10), accessType, borrowerUserId, sensitiveDataAccessed: accessType !== 'masked' },
    });
  }

  async logLoanApplicationAccess(applicationId: string, accessType: 'view' | 'update' | 'export', additionalDetails?: Record<string, unknown>): Promise<void> {
    const actionMap: Record<string, AuditAction> = { view: 'VIEW_LOAN_APPLICATION_DETAIL', update: 'UPDATE_APPLICATION_STATUS', export: 'EXPORT_DATA' };
    await this.logAccess({ action: actionMap[accessType], resourceType: 'loan_application', resourceId: applicationId, details: { accessType, ...additionalDetails } });
  }

  async logAdminDashboardAccess(section?: string): Promise<void> {
    await this.logAccess({ action: 'VIEW_ADMIN_DASHBOARD', resourceType: 'admin_dashboard', details: { section: section || 'main', accessedAt: new Date().toISOString() } });
  }

  async logCreditReportAccess(userId: string, reportIds: string[]): Promise<void> {
    await this.logAccess({ action: 'VIEW_CREDIT_REPORTS', resourceType: 'credit_report', details: { borrowerUserId: userId, reportCount: reportIds.length, reportIds: reportIds.slice(0, 5) } });
  }

  async logDataExport(exportType: 'applications' | 'users' | 'reports', filters: Record<string, unknown>, recordCount: number): Promise<void> {
    await this.logAccess({ action: 'EXPORT_DATA', resourceType: 'loan_application', details: { exportType, filters, recordCount, exportedAt: new Date().toISOString() } });
  }

  async logRoleManagement(targetUserId: string, action: 'assign' | 'revoke', role: string): Promise<void> {
    await this.logAccess({ action: 'MANAGE_USER_ROLES', resourceType: 'user_role', resourceId: targetUserId, details: { roleAction: action, role, targetUserId } });
  }

  async getRecentAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      const p = new URLSearchParams();
      p.set('order', 'created_at.desc');
      p.set('limit', String(limit));
      const { data } = await restQuery<AuditLogEntry[]>('audit_logs', { params: p });
      await this.logAccess({ action: 'VIEW_SECURITY_AUDIT', resourceType: 'security_audit', details: { logsRequested: limit, logsReturned: data?.length || 0 } });
      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  async getUserAuditLogs(userId: string, limit: number = 20): Promise<AuditLogEntry[]> {
    try {
      const p = new URLSearchParams();
      p.set('user_id', `eq.${userId}`);
      p.set('order', 'created_at.desc');
      p.set('limit', String(limit));
      const { data } = await restQuery<AuditLogEntry[]>('audit_logs', { params: p });
      return data || [];
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      throw error;
    }
  }

  async getResourceAuditLogs(resourceType: ResourceType, resourceId: string, limit: number = 20): Promise<AuditLogEntry[]> {
    try {
      const p = new URLSearchParams();
      p.set('resource_type', `eq.${resourceType}`);
      p.set('resource_id', `eq.${resourceId}`);
      p.set('order', 'created_at.desc');
      p.set('limit', String(limit));
      const { data } = await restQuery<AuditLogEntry[]>('audit_logs', { params: p });
      return data || [];
    } catch (error) {
      console.error('Error fetching resource audit logs:', error);
      throw error;
    }
  }
}

export const auditService = new AuditService();
