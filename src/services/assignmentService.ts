import { supabase } from '@/integrations/supabase/client';
import { auditService } from './auditService';

export interface ApplicationAssignment {
  id: string;
  application_id: string;
  admin_id: string;
  assigned_by: string | null;
  assigned_at: string;
  notes: string | null;
  // Joined data
  application?: {
    application_number: string;
    business_name: string;
    first_name: string;
    last_name: string;
    loan_type: string;
    amount_requested: number;
    status: string;
  };
  admin?: {
    email: string;
    first_name: string;
    last_name: string;
  };
  assigned_by_user?: {
    email: string;
    first_name: string;
    last_name: string;
  };
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
  /**
   * Get all underwriters (users with underwriter or admin role)
   */
  async getUnderwriters(): Promise<Underwriter[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['underwriter', 'admin', 'super_admin']);

    if (error) {
      console.error('Error fetching underwriters:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get user details from auth.users via profiles
    const userIds = data.map(r => r.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
    }

    // Map roles to underwriters with profile info
    return data.map(roleData => {
      const profile = profiles?.find(p => p.id === roleData.user_id);
      return {
        id: roleData.user_id,
        email: '', // Will be filled by auth data if needed
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        role: roleData.role
      };
    });
  }

  /**
   * Get all application assignments with related data
   */
  async getAssignments(): Promise<ApplicationAssignment[]> {
    const { data, error } = await supabase
      .from('admin_application_assignments')
      .select(`
        id,
        application_id,
        admin_id,
        assigned_by,
        assigned_at,
        notes
      `)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get related application data
    const applicationIds = data.map(a => a.application_id);
    const { data: applications } = await supabase
      .from('loan_applications')
      .select('id, application_number, business_name, first_name, last_name, loan_type, amount_requested, status')
      .in('id', applicationIds);

    // Get related admin profiles
    const adminIds = [...new Set([...data.map(a => a.admin_id), ...data.filter(a => a.assigned_by).map(a => a.assigned_by!)])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', adminIds);

    // Map assignments with related data
    return data.map(assignment => {
      const application = applications?.find(app => app.id === assignment.application_id);
      const adminProfile = profiles?.find(p => p.id === assignment.admin_id);
      const assignedByProfile = assignment.assigned_by ? profiles?.find(p => p.id === assignment.assigned_by) : null;

      return {
        ...assignment,
        application: application ? {
          application_number: application.application_number || 'N/A',
          business_name: application.business_name || 'N/A',
          first_name: application.first_name || '',
          last_name: application.last_name || '',
          loan_type: application.loan_type,
          amount_requested: application.amount_requested || 0,
          status: application.status
        } : undefined,
        admin: adminProfile ? {
          email: '',
          first_name: adminProfile.first_name || '',
          last_name: adminProfile.last_name || ''
        } : undefined,
        assigned_by_user: assignedByProfile ? {
          email: '',
          first_name: assignedByProfile.first_name || '',
          last_name: assignedByProfile.last_name || ''
        } : undefined
      };
    });
  }

  /**
   * Get applications that are not yet assigned
   */
  async getUnassignedApplications(): Promise<UnassignedApplication[]> {
    // First get all assigned application IDs
    const { data: assignedData } = await supabase
      .from('admin_application_assignments')
      .select('application_id');

    const assignedIds = assignedData?.map(a => a.application_id) || [];

    // Get applications not in the assigned list
    let query = supabase
      .from('loan_applications')
      .select('id, application_number, business_name, first_name, last_name, loan_type, amount_requested, status, created_at')
      .in('status', ['submitted', 'under_review'])
      .order('created_at', { ascending: false });

    if (assignedIds.length > 0) {
      // Use not.in filter for assigned IDs
      query = query.not('id', 'in', `(${assignedIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching unassigned applications:', error);
      throw error;
    }

    return (data || []).map(app => ({
      id: app.id,
      application_number: app.application_number || 'N/A',
      business_name: app.business_name || 'N/A',
      first_name: app.first_name || '',
      last_name: app.last_name || '',
      loan_type: app.loan_type,
      amount_requested: app.amount_requested || 0,
      status: app.status,
      created_at: app.created_at
    }));
  }

  /**
   * Create a new assignment
   */
  async createAssignment(
    applicationId: string,
    adminId: string,
    notes?: string
  ): Promise<ApplicationAssignment> {
    const { data: userData } = await supabase.auth.getUser();
    const assignedBy = userData?.user?.id || null;

    const { data, error } = await supabase
      .from('admin_application_assignments')
      .insert({
        application_id: applicationId,
        admin_id: adminId,
        assigned_by: assignedBy,
        notes: notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }

    // Log the assignment
    await auditService.logAccess({
      action: 'ASSIGN_APPLICATION',
      resourceType: 'loan_application',
      resourceId: applicationId,
      details: {
        assigned_to: adminId,
        notes
      }
    });

    return data;
  }

  /**
   * Update an assignment (reassign or update notes)
   */
  async updateAssignment(
    assignmentId: string,
    updates: { admin_id?: string; notes?: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('admin_application_assignments')
      .update(updates)
      .eq('id', assignmentId);

    if (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }

    // Log the update
    await auditService.logAccess({
      action: 'UPDATE_ASSIGNMENT',
      resourceType: 'application_assignment',
      resourceId: assignmentId,
      details: updates
    });
  }

  /**
   * Delete an assignment
   */
  async deleteAssignment(assignmentId: string): Promise<void> {
    // Get assignment details for audit log before deleting
    const { data: assignment } = await supabase
      .from('admin_application_assignments')
      .select('application_id, admin_id')
      .eq('id', assignmentId)
      .single();

    const { error } = await supabase
      .from('admin_application_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }

    // Log the deletion
    await auditService.logAccess({
      action: 'DELETE_ASSIGNMENT',
      resourceType: 'application_assignment',
      resourceId: assignmentId,
      details: {
        application_id: assignment?.application_id,
        admin_id: assignment?.admin_id
      }
    });
  }

  /**
   * Get assignments for a specific underwriter
   */
  async getAssignmentsForUnderwriter(underwriterId: string): Promise<ApplicationAssignment[]> {
    const assignments = await this.getAssignments();
    return assignments.filter(a => a.admin_id === underwriterId);
  }
}

export const assignmentService = new AssignmentService();
