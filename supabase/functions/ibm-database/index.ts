import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DatabaseOperation {
  operation: "query" | "mutate" | "status" | "tables";
  query?: string;
  params?: unknown[];
}

const READ_ONLY_PREFIXES = ["SELECT", "SHOW", "EXPLAIN"];
const WRITE_PREFIXES = ["INSERT", "UPDATE", "DELETE"];
const BLOCKED_KEYWORDS = [
  "DROP DATABASE", "DROP SCHEMA", "TRUNCATE", "ALTER SYSTEM",
  "CREATE ROLE", "DROP ROLE", "ALTER ROLE", "GRANT", "REVOKE",
  "COPY", "pg_dump", "pg_restore", "SET ROLE", "RESET ROLE",
];

function classifyQuery(sql: string): "read" | "write" | "blocked" {
  const upper = sql.trim().toUpperCase();
  if (BLOCKED_KEYWORDS.some((kw) => upper.includes(kw))) return "blocked";
  if (READ_ONLY_PREFIXES.some((p) => upper.startsWith(p))) return "read";
  if (WRITE_PREFIXES.some((p) => upper.startsWith(p))) return "write";
  return "blocked";
}

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authenticateAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");

  if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase configuration");
  if (!authHeader) return { error: jsonResp({ error: "Authorization header required" }, 401) };

  const supabase = createClient(supabaseUrl, supabaseKey);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) return { error: jsonResp({ error: "Unauthorized" }, 401) };

  // Get the user's highest role
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));
  const isAdmin = roleSet.has("admin") || roleSet.has("super_admin");

  if (!isAdmin) return { error: jsonResp({ error: "Admin access required" }, 403) };

  return { user, supabase, isSuperAdmin: roleSet.has("super_admin") };
}

async function withPool<T>(fn: (pool: Pool) => Promise<T>): Promise<T> {
  const databaseUrl = Deno.env.get("DATABASE_URL");
  if (!databaseUrl) throw new Error("DATABASE_URL environment variable is not set");
  const pool = new Pool(databaseUrl, 1, true);
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

async function handleStatus() {
  return withPool(async (pool) => {
    const conn = await pool.connect();
    try {
      const result = await conn.queryObject("SELECT version()");
      const version = (result.rows[0] as Record<string, string>)?.version ?? "unknown";
      const urlParts = new URL(Deno.env.get("DATABASE_URL")!);
      return jsonResp({
        status: "connected",
        host: urlParts.hostname,
        port: urlParts.port || "5432",
        database: urlParts.pathname.slice(1),
        ssl: urlParts.searchParams.get("sslmode") || "require",
        postgresVersion: version,
      });
    } finally {
      conn.release();
    }
  });
}

async function handleTables() {
  return withPool(async (pool) => {
    const conn = await pool.connect();
    try {
      const result = await conn.queryObject(
        `SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      return jsonResp({ tables: result.rows });
    } finally {
      conn.release();
    }
  });
}

async function handleQuery(query: string) {
  const classification = classifyQuery(query);
  if (classification !== "read") {
    return jsonResp({ error: "Only read-only queries (SELECT, SHOW, EXPLAIN) are allowed via 'query'. Use 'mutate' for writes." }, 403);
  }

  return withPool(async (pool) => {
    const conn = await pool.connect();
    try {
      const result = await conn.queryObject(query);
      return jsonResp({ rows: result.rows, rowCount: result.rows.length });
    } finally {
      conn.release();
    }
  });
}

// Rate limit config for mutate: 10 writes per 60-second window
const MUTATE_RATE_LIMIT = { maxRequests: 10, windowSeconds: 60 };

async function checkMutateRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: string } | null> {
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      _endpoint: "ibm_database_mutate",
      _identifier: userId,
      _max_requests: MUTATE_RATE_LIMIT.maxRequests,
      _window_seconds: MUTATE_RATE_LIMIT.windowSeconds,
    });
    if (error) {
      console.error("Rate limit check failed:", error);
      return null; // fail-open would be dangerous; fail-closed instead
    }
    const row = data?.[0];
    if (!row) return null;
    return {
      allowed: row.allowed,
      remaining: row.remaining_requests,
      resetAt: row.reset_at,
    };
  } catch (err) {
    console.error("Rate limit check exception:", err);
    return null;
  }
}

async function handleMutate(
  query: string,
  params: unknown[] | undefined,
  user: { id: string; email?: string },
  supabase: ReturnType<typeof createClient>,
  ipAddress: string | null,
  userAgent: string | null,
) {
  // Server-side rate limiting — fail-closed
  const rateLimit = await checkMutateRateLimit(supabase, user.id);
  if (!rateLimit) {
    return jsonResp({ error: "Rate limit check failed. Write aborted for safety." }, 503);
  }
  if (!rateLimit.allowed) {
    return jsonResp({
      error: "Rate limit exceeded. Too many write operations.",
      remaining: rateLimit.remaining,
      resetAt: rateLimit.resetAt,
    }, 429);
  }

  const classification = classifyQuery(query);
  if (classification === "blocked") {
    return jsonResp({ error: "This SQL statement is not allowed. Blocked for safety." }, 403);
  }
  if (classification === "read") {
    return jsonResp({ error: "Use the 'query' operation for read-only statements." }, 400);
  }

  // Audit log the write operation BEFORE executing
  try {
    await supabase.rpc("log_audit_event", {
      _user_id: user.id,
      _action: "IBM_DB_WRITE",
      _resource_type: "ibm_database",
      _resource_id: null,
      _ip_address: ipAddress,
      _user_agent: userAgent,
      _details: {
        query: query.substring(0, 500), // truncate for safety
        hasParams: !!params?.length,
        paramCount: params?.length ?? 0,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (auditErr) {
    console.error("Failed to log audit event, aborting write:", auditErr);
    return jsonResp({ error: "Write aborted: audit logging failed" }, 500);
  }

  return withPool(async (pool) => {
    const conn = await pool.connect();
    try {
      const tx = conn.createTransaction("ibm_mutate");
      await tx.begin();
      try {
        const result = params?.length
          ? await tx.queryObject(query, params)
          : await tx.queryObject(query);
        await tx.commit();
        return jsonResp({
          success: true,
          rowCount: result.rowCount ?? result.rows.length,
          rows: result.rows,
        });
      } catch (txErr) {
        await tx.rollback();
        throw txErr;
      }
    } finally {
      conn.release();
    }
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authenticateAdmin(req);
    if ("error" in auth) return auth.error;
    const { user, supabase, isSuperAdmin } = auth;

    const databaseUrl = Deno.env.get("DATABASE_URL");
    if (!databaseUrl) {
      return jsonResp({ error: "IBM Database not configured", message: "DATABASE_URL environment variable is not set" }, 503);
    }

    const body: DatabaseOperation = await req.json();
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent") || null;

    switch (body.operation) {
      case "status":
        return await handleStatus();

      case "tables":
        return await handleTables();

      case "query":
        if (!body.query) return jsonResp({ error: "Query string is required" }, 400);
        return await handleQuery(body.query);

      case "mutate":
        if (!isSuperAdmin) {
          return jsonResp({ error: "Write operations require super_admin role" }, 403);
        }
        if (!body.query) return jsonResp({ error: "Query string is required" }, 400);
        return await handleMutate(body.query, body.params, user, supabase, ipAddress, userAgent);

      default:
        return jsonResp({ error: "Invalid operation. Use: status, tables, query, or mutate" }, 400);
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("IBM Database function error:", msg);
    return jsonResp({ error: msg }, 500);
  }
});
