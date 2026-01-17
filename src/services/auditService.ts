import { supabase } from '@/integrations/supabase/client';

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
  | 'DELETE_ASSIGNMENT';

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
  /**
   * Log an audit event via edge function for comprehensive tracking
   */
  async logAccess(params: AuditLogParams): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.warn('Audit log skipped: No authenticated user');
        return;
      }

      const { error } = await supabase.functions.invoke('audit-logger', {
        body: {
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId || null,
          details: {
            ...params.details,
            timestamp: new Date().toISOString(),
            sessionId: session.access_token?.slice(-10) // Last 10 chars for session tracking
          }
        }
      });

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (error) {
      // Silently fail audit logging to not disrupt user experience
      console.error('Audit logging error:', error);
    }
  }

  /**
   * Log bank account access
   */
  async logBankAccountAccess(
    accountIds: string[], 
    accessType: 'list' | 'detail' | 'masked',
    borrowerUserId?: string
  ): Promise<void> {
    await this.logAccess({
      action: accessType === 'detail' ? 'VIEW_BANK_ACCOUNT_DETAIL' : 'VIEW_BANK_ACCOUNTS',
      resourceType: 'bank_account',
      resourceId: accountIds.length === 1 ? accountIds[0] : undefined,
      details: {
        accountCount: accountIds.length,
        accountIds: accountIds.slice(0, 10), // Limit to first 10 for log size
        accessType,
        borrowerUserId,
        sensitiveDataAccessed: accessType !== 'masked'
      }
    });
  }

  /**
   * Log loan application access
   */
  async logLoanApplicationAccess(
    applicationId: string,
    accessType: 'view' | 'update' | 'export',
    additionalDetails?: Record<string, unknown>
  ): Promise<void> {
    const actionMap: Record<string, AuditAction> = {
      'view': 'VIEW_LOAN_APPLICATION_DETAIL',
      'update': 'UPDATE_APPLICATION_STATUS',
      'export': 'EXPORT_DATA'
    };

    await this.logAccess({
      action: actionMap[accessType],
      resourceType: 'loan_application',
      resourceId: applicationId,
      details: {
        accessType,
        ...additionalDetails
      }
    });
  }

  /**
   * Log admin dashboard access
   */
  async logAdminDashboardAccess(section?: string): Promise<void> {
    await this.logAccess({
      action: 'VIEW_ADMIN_DASHBOARD',
      resourceType: 'admin_dashboard',
      details: {
        section: section || 'main',
        accessedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log credit report access
   */
  async logCreditReportAccess(userId: string, reportIds: string[]): Promise<void> {
    await this.logAccess({
      action: 'VIEW_CREDIT_REPORTS',
      resourceType: 'credit_report',
      details: {
        borrowerUserId: userId,
        reportCount: reportIds.length,
        reportIds: reportIds.slice(0, 5)
      }
    });
  }

  /**
   * Log data export
   */
  async logDataExport(
    exportType: 'applications' | 'users' | 'reports',
    filters: Record<string, unknown>,
    recordCount: number
  ): Promise<void> {
    await this.logAccess({
      action: 'EXPORT_DATA',
      resourceType: 'loan_application',
      details: {
        exportType,
        filters,
        recordCount,
        exportedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log role management actions
   */
  async logRoleManagement(
    targetUserId: string,
    action: 'assign' | 'revoke',
    role: string
  ): Promise<void> {
    await this.logAccess({
      action: 'MANAGE_USER_ROLES',
      resourceType: 'user_role',
      resourceId: targetUserId,
      details: {
        roleAction: action,
        role,
        targetUserId
      }
    });
  }

  /**
   * Get recent audit logs (for admin security view)
   */
  async getRecentAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Log that audit logs were accessed
      await this.logAccess({
        action: 'VIEW_SECURITY_AUDIT',
        resourceType: 'security_audit',
        details: {
          logsRequested: limit,
          logsReturned: data?.length || 0
        }
      });

      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId: string, limit: number = 20): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceAuditLogs(
    resourceType: ResourceType, 
    resourceId: string, 
    limit: number = 20
  ): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching resource audit logs:', error);
      throw error;
    }
  }
}

export const auditService = new AuditService();
