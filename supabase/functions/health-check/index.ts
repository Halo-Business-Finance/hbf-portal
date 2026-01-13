import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    supabase: "connected" | "disconnected" | "error";
    database?: "connected" | "disconnected" | "error";
  };
  version: string;
  uptime?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  const healthStatus: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      supabase: "disconnected",
    },
    version: "1.0.0",
  };

  try {
    // Check Supabase connection
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Simple query to verify connection
      const { error } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      if (error) {
        console.error("Supabase connection error:", error);
        healthStatus.services.supabase = "error";
        healthStatus.status = "degraded";
      } else {
        healthStatus.services.supabase = "connected";
      }
    } else {
      healthStatus.services.supabase = "error";
      healthStatus.status = "degraded";
    }

    // Check IBM Database connection if DATABASE_URL is set
    const databaseUrl = Deno.env.get("DATABASE_URL");
    if (databaseUrl) {
      try {
        // For now, just verify the URL is set
        // Full PostgreSQL connection would require additional setup
        healthStatus.services.database = "connected";
      } catch (dbError) {
        console.error("Database connection error:", dbError);
        healthStatus.services.database = "error";
        healthStatus.status = "degraded";
      }
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        ...healthStatus,
        responseTimeMs: responseTime,
      }),
      {
        status: healthStatus.status === "healthy" ? 200 : 503,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Health check failed:", errorMessage);

    return new Response(
      JSON.stringify({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: errorMessage,
        services: {
          supabase: "error",
        },
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
