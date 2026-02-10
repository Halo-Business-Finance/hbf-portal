import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DatabaseOperation {
  operation: "query" | "status" | "tables";
  query?: string;
  params?: unknown[];
}

// Allowlist of safe read-only SQL commands
const ALLOWED_SQL_PREFIXES = ["SELECT", "SHOW", "EXPLAIN"];

function isSafeQuery(sql: string): boolean {
  const trimmed = sql.trim().toUpperCase();
  return ALLOWED_SQL_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user is authenticated and is an admin
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get IBM Database URL
    const databaseUrl = Deno.env.get("DATABASE_URL");

    if (!databaseUrl) {
      return new Response(
        JSON.stringify({
          error: "IBM Database not configured",
          message: "DATABASE_URL environment variable is not set",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: DatabaseOperation = await req.json();

    // --- STATUS operation ---
    if (body.operation === "status") {
      const pool = new Pool(databaseUrl, 1, true);
      try {
        const connection = await pool.connect();
        try {
          const result = await connection.queryObject("SELECT version()");
          const version =
            (result.rows[0] as Record<string, string>)?.version ?? "unknown";

          const urlParts = new URL(databaseUrl);
          return new Response(
            JSON.stringify({
              status: "connected",
              host: urlParts.hostname,
              port: urlParts.port || "5432",
              database: urlParts.pathname.slice(1),
              ssl: urlParts.searchParams.get("sslmode") || "require",
              postgresVersion: version,
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        } finally {
          connection.release();
        }
      } catch (connError: unknown) {
        const msg =
          connError instanceof Error ? connError.message : "Connection failed";
        return new Response(
          JSON.stringify({
            status: "error",
            error: msg,
          }),
          {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } finally {
        await pool.end();
      }
    }

    // --- TABLES operation ---
    if (body.operation === "tables") {
      const pool = new Pool(databaseUrl, 1, true);
      try {
        const connection = await pool.connect();
        try {
          const result = await connection.queryObject(
            `SELECT table_name, table_type
             FROM information_schema.tables
             WHERE table_schema = 'public'
             ORDER BY table_name`
          );
          return new Response(
            JSON.stringify({ tables: result.rows }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        } finally {
          connection.release();
        }
      } finally {
        await pool.end();
      }
    }

    // --- QUERY operation (read-only) ---
    if (body.operation === "query") {
      if (!body.query) {
        return new Response(
          JSON.stringify({ error: "Query string is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!isSafeQuery(body.query)) {
        return new Response(
          JSON.stringify({
            error:
              "Only read-only queries (SELECT, SHOW, EXPLAIN) are allowed",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const pool = new Pool(databaseUrl, 1, true);
      try {
        const connection = await pool.connect();
        try {
          const result = await connection.queryObject(body.query);
          return new Response(
            JSON.stringify({
              rows: result.rows,
              rowCount: result.rows.length,
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        } finally {
          connection.release();
        }
      } catch (queryError: unknown) {
        const msg =
          queryError instanceof Error ? queryError.message : "Query failed";
        return new Response(
          JSON.stringify({ error: msg }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } finally {
        await pool.end();
      }
    }

    return new Response(
      JSON.stringify({
        error: "Invalid operation. Use: status, tables, or query",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("IBM Database function error:", errorMessage);

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
