import { authProvider } from '@/services/auth';
import { auditService } from './auditService';
import { restQuery } from './supabaseHttp';

export interface ApplicationAssignment {
  id: string;
  application_id: string;
  admin_id: string;
  assigned_by: string | null;
  assigned_at: string;
  notes: string | null;
  application?: {
    application_number: string;
    business_name: string;
    first_name: string;
    last_name: string;
    loan_type: string;
    amount_requested: number;
    status: string;
  };
  admin?: { email: string; first_name: string; last_name: string };
  assigned_by_user?: { email: string; first_name: string; last_name: string };
}

export interface Underwriter {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

export interface UnassignedApplication {
  id: string;
  application_number: string;
  business_name: string;
  first_name: string;
  last_name: string;
  loan_type: string;
  amount_requested: number;
  status: string;
  created_at: string;
}

class AssignmentService {
  async getUnderwriters(): Promise<Underwriter[]> {
    const p = new URLSearchParams();
    p.set('select', 'user_id, role');
    p.set('role', 'in.(underwriter,admin,super_admin)');
    const { data } = await restQuery<any[]>('user_roles', { params: p });
    if (!data || data.length === 0) return [];

    const userIds = data.map((r: any) => r.user_id);
    const pp = new URLSearchParams();
    pp.set('id', `in.(${userIds.join(',')})`);
    pp.set('select', 'id, first_name, last_name');
    const { data: profiles } = await restQuery<any[]>('profiles', { params: pp });

    return data.map((roleData: any) => {
      const profile = profiles?.find((p: any) => p.id === roleData.user_id);
      return { id: roleData.user_id, email: '', first_name: profile?.first_name || null, last_name: profile?.last_name || null, role: roleData.role };
    });
  }

  async getAssignments(): Promise<ApplicationAssignment[]> {
    const p = new URLSearchParams();
    p.set('select', 'id, application_id, admin_id, assigned_by, assigned_at, notes');
    p.set('order', 'assigned_at.desc');
    const { data } = await restQuery<any[]>('admin_application_assignments', { params: p });
    if (!data || data.length === 0) return [];

    const applicationIds = data.map((a: any) => a.application_id);
    const ap = new URLSearchParams();
    ap.set('id', `in.(${applicationIds.join(',')})`);
    ap.set('select', 'id, application_number, business_name, first_name, last_name, loan_type, amount_requested, status');
    const { data: applications } = await restQuery<any[]>('loan_applications', { params: ap });

    const adminIds = [...new Set([...data.map((a: any) => a.admin_id), ...data.filter((a: any) => a.assigned_by).map((a: any) => a.assigned_by)])];
    const prp = new URLSearchParams();
    prp.set('id', `in.(${adminIds.join(',')})`);
    prp.set('select', 'id, first_name, last_name');
    const { data: profiles } = await restQuery<any[]>('profiles', { params: prp });

    return data.map((assignment: any) => {
      const application = applications?.find((app: any) => app.id === assignment.application_id);
      const adminProfile = profiles?.find((p: any) => p.id === assignment.admin_id);
      const assignedByProfile = assignment.assigned_by ? profiles?.find((p: any) => p.id === assignment.assigned_by) : null;
      return {
        ...assignment,
        application: application ? { application_number: application.application_number || 'N/A', business_name: application.business_name || 'N/A', first_name: application.first_name || '', last_name: application.last_name || '', loan_type: application.loan_type, amount_requested: application.amount_requested || 0, status: application.status } : undefined,
        admin: adminProfile ? { email: '', first_name: adminProfile.first_name || '', last_name: adminProfile.last_name || '' } : undefined,
        assigned_by_user: assignedByProfile ? { email: '', first_name: assignedByProfile.first_name || '', last_name: assignedByProfile.last_name || '' } : undefined,
      };
    });
  }

  async getUnassignedApplications(): Promise<UnassignedApplication[]> {
    const ap = new URLSearchParams();
    ap.set('select', 'application_id');
    const { data: assignedData } = await restQuery<any[]>('admin_application_assignments', { params: ap });
    const assignedIds = assignedData?.map((a: any) => a.application_id) || [];

    const p = new URLSearchParams();
    p.set('select', 'id, application_number, business_name, first_name, last_name, loan_type, amount_requested, status, created_at');
    p.set('status', 'in.(submitted,under_review)');
    p.set('order', 'created_at.desc');
    if (assignedIds.length > 0) p.set('id', `not.in.(${assignedIds.join(',')})`);

    const { data } = await restQuery<any[]>('loan_applications', { params: p });
    return (data || []).map((app: any) => ({
      id: app.id, application_number: app.application_number || 'N/A', business_name: app.business_name || 'N/A',
      first_name: app.first_name || '', last_name: app.last_name || '', loan_type: app.loan_type,
      amount_requested: app.amount_requested || 0, status: app.status, created_at: app.created_at,
    }));
  }

  async createAssignment(applicationId: string, adminId: string, notes?: string): Promise<ApplicationAssignment> {
    const { data: userData } = await authProvider.getUser();
    const assignedBy = userData?.user?.id || null;
    const { data } = await restQuery<ApplicationAssignment>('admin_application_assignments', {
      method: 'POST',
      body: { application_id: applicationId, admin_id: adminId, assigned_by: assignedBy, notes: notes || null },
      returnData: true,
      single: true,
    });
    await auditService.logAccess({ action: 'ASSIGN_APPLICATION', resourceType: 'loan_application', resourceId: applicationId, details: { assigned_to: adminId, notes } });
    return data;
  }

  async updateAssignment(assignmentId: string, updates: { admin_id?: string; notes?: string }): Promise<void> {
    const p = new URLSearchParams();
    p.set('id', `eq.${assignmentId}`);
    await restQuery('admin_application_assignments', { method: 'PATCH', params: p, body: updates });
    await auditService.logAccess({ action: 'UPDATE_ASSIGNMENT', resourceType: 'application_assignment', resourceId: assignmentId, details: updates });
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    const gp = new URLSearchParams();
    gp.set('id', `eq.${assignmentId}`);
    gp.set('select', 'application_id, admin_id');
    const { data: assignment } = await restQuery<any>('admin_application_assignments', { params: gp, single: true });

    const dp = new URLSearchParams();
    dp.set('id', `eq.${assignmentId}`);
    await restQuery('admin_application_assignments', { method: 'DELETE', params: dp });
    await auditService.logAccess({ action: 'DELETE_ASSIGNMENT', resourceType: 'application_assignment', resourceId: assignmentId, details: { application_id: assignment?.application_id, admin_id: assignment?.admin_id } });
  }

  async getAssignmentsForUnderwriter(underwriterId: string): Promise<ApplicationAssignment[]> {
    const assignments = await this.getAssignments();
    return assignments.filter(a => a.admin_id === underwriterId);
  }
}

export const assignmentService = new AssignmentService();
