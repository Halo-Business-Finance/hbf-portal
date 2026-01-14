import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApplicationStats {
  total: number;
  byStatus: { [key: string]: number };
  byLoanType: { [key: string]: number };
  totalAmount: number;
  averageAmount: number;
  thisMonth: number;
  thisWeek: number;
}

interface ApplicationFilter {
  status?: string;
  loanType?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  searchTerm?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase URL and service role key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role using secure has_role RPC function
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    let action = url.searchParams.get('action') || 'stats';
    let body = null;

    // Handle POST requests with body
    if (req.method === 'POST') {
      try {
        body = await req.json();
        if (body.action) {
          action = body.action;
        }
      } catch (e) {
        // If no valid JSON body, continue with URL params
      }
    }

    switch (action) {
      case 'stats':
        return await getApplicationStats(supabase);
      
      case 'applications':
        const filters = body ? body : Object.fromEntries(url.searchParams.entries());
        return await getFilteredApplications(supabase, filters);
      
      case 'update-status':
        const updateSchema = z.object({
          applicationId: z.string().uuid(),
          status: z.string().max(50),
          notes: z.string().max(1000).optional()
        });
        if (!body || typeof body !== 'object') {
          return new Response(
            JSON.stringify({ error: 'Missing or invalid request body' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const updateValidation = updateSchema.safeParse(body);
        if (!updateValidation.success) {
          return new Response(
            JSON.stringify({ error: 'Invalid update data', details: updateValidation.error.format() }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const { applicationId, status, notes } = updateValidation.data;
        return await updateApplicationStatus(supabase, applicationId, status, notes);
      
      case 'export':
        return await exportApplications(supabase, Object.fromEntries(url.searchParams.entries()));

      case 'analytics':
        return await getAnalytics(supabase);

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in admin-dashboard:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getApplicationStats(supabase: any): Promise<Response> {
  try {
    // Get all applications
    const { data: applications, error } = await supabase
      .from('loan_applications')
      .select('*');

    if (error) throw error;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const stats: ApplicationStats = {
      total: applications.length,
      byStatus: {},
      byLoanType: {},
      totalAmount: 0,
      averageAmount: 0,
      thisMonth: 0,
      thisWeek: 0
    };

    applications.forEach((app: any) => {
      // Status counts
      stats.byStatus[app.status] = (stats.byStatus[app.status] || 0) + 1;
      
      // Loan type counts
      stats.byLoanType[app.loan_type] = (stats.byLoanType[app.loan_type] || 0) + 1;
      
      // Amount calculations
      if (app.amount_requested) {
        stats.totalAmount += app.amount_requested;
      }
      
      // Time-based counts
      const createdAt = new Date(app.created_at);
      if (createdAt >= startOfMonth) {
        stats.thisMonth++;
      }
      if (createdAt >= startOfWeek) {
        stats.thisWeek++;
      }
    });

    stats.averageAmount = applications.length > 0 ? stats.totalAmount / applications.length : 0;

    return new Response(
      JSON.stringify({ stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting application stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get application stats',
        message: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getFilteredApplications(supabase: any, filters: ApplicationFilter): Promise<Response> {
  try {
    let query = supabase
      .from('loan_applications')
      .select('*');

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.loanType) {
      query = query.eq('loan_type', filters.loanType);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    if (filters.amountMin) {
      const minAmount = Number(filters.amountMin);
      if (!isNaN(minAmount)) {
        query = query.gte('amount_requested', minAmount);
      }
    }

    if (filters.amountMax) {
      const maxAmount = Number(filters.amountMax);
      if (!isNaN(maxAmount)) {
        query = query.lte('amount_requested', maxAmount);
      }
    }

    if (filters.searchTerm) {
      // SECURITY: Sanitize search term to prevent query manipulation
      // - Escape SQL LIKE wildcards (% and _)
      // - Remove any PostgREST operators or special characters
      // - Limit length to prevent abuse
      const sanitizedSearch = String(filters.searchTerm)
        .slice(0, 100) // Limit length
        .replace(/[\\(),.'"\[\]{}|^$*+?]/g, '') // Remove backslashes and special chars that could break query
        .trim()
        .replace(/[%_]/g, '\\$&'); // Escape LIKE wildcards for safe ilike usage
      
      if (sanitizedSearch.length > 0) {
        query = query.or(`business_name.ilike.%${sanitizedSearch}%,first_name.ilike.%${sanitizedSearch}%,last_name.ilike.%${sanitizedSearch}%,application_number.ilike.%${sanitizedSearch}%`);
      }
    }

    // Order by most recent first
    query = query.order('created_at', { ascending: false });

    const { data: applications, error } = await query;

    if (error) throw error;

    // Get profiles data for all user_ids
    const userIds = [...new Set(applications.map((app: any) => app.user_id))];
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Create a map of user profiles
    const profilesMap = (profiles || []).reduce((acc: any, profile: any) => {
      acc[profile.id] = profile;
      return acc;
    }, {});

    // Format applications to include profile data
    const formattedApplications = applications.map((app: any) => {
      const profile = profilesMap[app.user_id];
      return {
        ...app,
        first_name: profile?.first_name || app.first_name || 'N/A',
        last_name: profile?.last_name || app.last_name || 'N/A'
      };
    });

    return new Response(
      JSON.stringify({ applications: formattedApplications }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting filtered applications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get applications',
        message: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function updateApplicationStatus(
  supabase: any, 
  applicationId: string, 
  status: string, 
  notes?: string
): Promise<Response> {
  try {
    // Get current application details
    const { data: application, error: fetchError } = await supabase
      .from('loan_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError) throw fetchError;

    // Update application status
    const { data: updatedApplication, error: updateError } = await supabase
      .from('loan_applications')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
        loan_details: {
          ...application.loan_details,
          status_notes: notes || '',
          status_updated_at: new Date().toISOString()
        }
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Trigger notification (call notification service)
    try {
      await supabase.functions.invoke('notification-service', {
        body: {
          action: 'application-status-change',
          notificationData: {
            applicationId,
            newStatus: status,
            applicantEmail: application.email || null, // Use actual applicant email if available
            applicantName: `${application.first_name} ${application.last_name}`,
            applicationNumber: application.application_number
          }
        }
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the status update if notification fails
    }

    console.log(`Application ${applicationId} status updated to: ${status}`);

    return new Response(
      JSON.stringify({
        success: true,
        application: updatedApplication,
        message: 'Application status updated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating application status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update application status',
        message: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Sanitize a value for CSV export to prevent CSV injection attacks.
 * Prefixes dangerous characters (=, +, -, @, tab, carriage return) with a single quote
 * to neutralize any formulas that could execute in spreadsheet applications.
 */
function sanitizeCSVField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const strValue = String(value);
  // Prefix dangerous characters with single quote to neutralize formulas
  // These characters at the start of a cell can trigger formula execution in Excel/LibreOffice
  if (/^[=+\-@\t\r]/.test(strValue)) {
    return "'" + strValue;
  }
  // Also escape any double quotes within the value
  return strValue.replace(/"/g, '""');
}

async function exportApplications(supabase: any, filters: ApplicationFilter): Promise<Response> {
  try {
    // Query applications directly for export to avoid extra processing done in getFilteredApplications
    let query = supabase
      .from('applications')
      .select(`
        application_number,
        status,
        loan_type,
        amount_requested,
        first_name,
        last_name,
        business_name,
        phone,
        years_in_business,
        application_started_date,
        application_submitted_date
      `);

    // Apply basic filters consistent with ApplicationFilter where possible
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.loanType) {
      query = query.eq('loan_type', filters.loanType);
    }
    if (filters.startDate) {
      query = query.gte('application_submitted_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('application_submitted_date', filters.endDate);
    }

    const { data: applications, error: queryError } = await query;

    if (queryError) {
      console.error('Error querying applications for export:', queryError);
      return new Response(
        JSON.stringify({
          error: 'Failed to export applications',
          message: queryError.message ?? 'Unknown query error',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Convert to CSV format with CSV injection protection
    const csvHeader = [
      'Application Number',
      'Status',
      'Loan Type',
      'Amount Requested',
      'Applicant Name',
      'Business Name',
      'Phone',
      'Years in Business',
      'Application Date',
      'Submitted Date'
    ].join(',');

    // Sanitize all user-supplied fields to prevent CSV injection attacks
    const csvRows = (applications ?? []).map((app: any) => [
      sanitizeCSVField(app.application_number),
      sanitizeCSVField(app.status),
      sanitizeCSVField(app.loan_type),
      app.amount_requested || 0,
      `"${sanitizeCSVField(app.first_name)} ${sanitizeCSVField(app.last_name)}"`,
      `"${sanitizeCSVField(app.business_name)}"`,
      sanitizeCSVField(app.phone),
      app.years_in_business || 0,
      app.application_started_date ? new Date(app.application_started_date).toLocaleDateString() : '',
      app.application_submitted_date ? new Date(app.application_submitted_date).toLocaleDateString() : ''
    ].join(','));

    const csvContent = [csvHeader, ...csvRows].join('\n');

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="loan_applications_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting applications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Failed to export applications',
        message: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getAnalytics(supabase: any): Promise<Response> {
  try {
    const { data: applications, error } = await supabase
      .from('loan_applications')
      .select('*');

    if (error) throw error;

    // Calculate analytics
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const analytics = {
      totalApplications: applications.length,
      applicationsTrend: {
        last30Days: applications.filter((app: any) => new Date(app.created_at) >= last30Days).length,
        last7Days: applications.filter((app: any) => new Date(app.created_at) >= last7Days).length
      },
      approvalRate: {
        total: applications.filter((app: any) => app.status === 'approved').length / applications.length * 100,
        last30Days: 0
      },
      averageProcessingTime: calculateAverageProcessingTime(applications),
      topLoanTypes: getTopLoanTypes(applications),
      amountDistribution: getAmountDistribution(applications),
      statusDistribution: getStatusDistribution(applications)
    };

    // Calculate approval rate for last 30 days
    const recentApps = applications.filter((app: any) => new Date(app.created_at) >= last30Days);
    if (recentApps.length > 0) {
      analytics.approvalRate.last30Days = 
        recentApps.filter((app: any) => app.status === 'approved').length / recentApps.length * 100;
    }

    return new Response(
      JSON.stringify({ analytics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get analytics',
        message: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function calculateAverageProcessingTime(applications: any[]): number {
  const processedApps = applications.filter(app => 
    app.application_submitted_date && 
    (app.status === 'approved' || app.status === 'rejected')
  );

  if (processedApps.length === 0) return 0;

  const totalTime = processedApps.reduce((sum, app) => {
    const submitted = new Date(app.application_submitted_date);
    const processed = new Date(app.updated_at);
    return sum + (processed.getTime() - submitted.getTime());
  }, 0);

  return totalTime / processedApps.length / (1000 * 60 * 60 * 24); // Convert to days
}

function getTopLoanTypes(applications: any[]): Array<{ type: string; count: number; percentage: number }> {
  const typeCounts: { [key: string]: number } = {};
  
  applications.forEach(app => {
    typeCounts[app.loan_type] = (typeCounts[app.loan_type] || 0) + 1;
  });

  return Object.entries(typeCounts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: (count / applications.length) * 100
    }))
    .sort((a, b) => b.count - a.count);
}

function getAmountDistribution(applications: any[]): Array<{ range: string; count: number }> {
  const ranges = [
    { min: 0, max: 50000, label: '$0 - $50K' },
    { min: 50000, max: 100000, label: '$50K - $100K' },
    { min: 100000, max: 500000, label: '$100K - $500K' },
    { min: 500000, max: 1000000, label: '$500K - $1M' },
    { min: 1000000, max: 5000000, label: '$1M - $5M' },
    { min: 5000000, max: Infinity, label: '$5M+' }
  ];

  return ranges.map(range => ({
    range: range.label,
    count: applications.filter(app => 
      app.amount_requested >= range.min && app.amount_requested < range.max
    ).length
  }));
}

function getStatusDistribution(applications: any[]): Array<{ status: string; count: number; percentage: number }> {
  const statusCounts: { [key: string]: number } = {};
  
  applications.forEach(app => {
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
  });

  return Object.entries(statusCounts)
    .map(([status, count]) => ({
      status,
      count,
      percentage: (count / applications.length) * 100
    }))
    .sort((a, b) => b.count - a.count);
}