import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid metrics that can be tracked (whitelist for security)
const VALID_METRICS = [
  'password_toggle_show',
  'password_toggle_hide',
  'failed_login_attempt',
  'repeated_failed_login', // 3+ failed attempts in a session
  'rate_limit_triggered',
  'session_timeout',
  'mfa_prompt_shown',
] as const;

type MetricName = typeof VALID_METRICS[number];

interface TelemetryRequest {
  metric: MetricName;
  count?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // This endpoint is intentionally public for anonymous telemetry
    // No user identification is collected or stored

    const body: TelemetryRequest = await req.json();
    const { metric, count = 1 } = body;

    // Validate metric name against whitelist
    if (!metric || !VALID_METRICS.includes(metric as MetricName)) {
      console.warn(`Invalid telemetry metric attempted: ${metric}`);
      return new Response(
        JSON.stringify({ error: 'Invalid metric' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate count is reasonable (prevent abuse)
    if (typeof count !== 'number' || count < 1 || count > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid count' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to write telemetry (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Increment the counter using our security definer function
    const { error } = await serviceClient.rpc('increment_security_telemetry', {
      _metric_name: metric,
      _increment_by: count,
    });

    if (error) {
      console.error('Failed to increment telemetry:', error);
      // Don't expose internal errors
      return new Response(
        JSON.stringify({ success: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Telemetry recorded: ${metric} (+${count})`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Security telemetry error:', error);
    return new Response(
      JSON.stringify({ success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
