import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditLogRequest {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // User client to verify authentication
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: AuditLogRequest = await req.json();
    const { action, resourceType, resourceId, details } = body;

    if (!action || !resourceType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action, resourceType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client info from headers
    const userAgent = req.headers.get('user-agent') || null;
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null;

    console.log(`Audit log: User ${user.id} - ${action} on ${resourceType}${resourceId ? ` (${resourceId})` : ''}`);

    // Use service role client to insert audit log (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has admin-level role (only log for admin actions)
    const { data: hasAdminRole } = await serviceClient.rpc('has_role_or_higher', {
      _user_id: user.id,
      _minimum_role: 'customer_service'
    });

    // Enrich details with user info
    const enrichedDetails = {
      ...details,
      userEmail: user.email,
      userRole: hasAdminRole ? 'admin_level' : 'user',
      requestId: crypto.randomUUID(),
      loggedAt: new Date().toISOString()
    };

    // Insert audit log using the log_audit_event function
    const { data: logId, error: logError } = await serviceClient.rpc('log_audit_event', {
      _user_id: user.id,
      _action: action,
      _resource_type: resourceType,
      _resource_id: resourceId || null,
      _ip_address: ipAddress,
      _user_agent: userAgent,
      _details: enrichedDetails
    });

    if (logError) {
      console.error('Failed to insert audit log:', logError);
      // Don't fail the request, just log the error
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to log audit event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Audit log created: ${logId}`);

    // For sensitive data access (bank accounts, credit reports), send alert if unusual
    if (['VIEW_BANK_ACCOUNTS', 'VIEW_BANK_ACCOUNT_DETAIL', 'VIEW_CREDIT_REPORTS'].includes(action)) {
      // Check for unusual access patterns (more than 50 records in last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { count } = await serviceClient
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('action', ['VIEW_BANK_ACCOUNTS', 'VIEW_BANK_ACCOUNT_DETAIL', 'VIEW_CREDIT_REPORTS'])
        .gte('created_at', oneHourAgo);

      if (count && count > 50) {
        console.warn(`SECURITY ALERT: User ${user.id} has accessed sensitive financial data ${count} times in the last hour`);
        
        // Log security alert
        await serviceClient.rpc('log_audit_event', {
          _user_id: user.id,
          _action: 'SECURITY_ALERT',
          _resource_type: 'security_alert',
          _resource_id: null,
          _ip_address: ipAddress,
          _user_agent: userAgent,
          _details: {
            alertType: 'excessive_sensitive_data_access',
            accessCount: count,
            timeWindow: '1_hour',
            triggeredAt: new Date().toISOString()
          }
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, logId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Audit logger error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
