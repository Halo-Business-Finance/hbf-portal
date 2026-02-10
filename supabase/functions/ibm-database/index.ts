import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));
  const isAdmin = roleSet.has("admin") || roleSet.has("super_admin");

  if (!isAdmin) return { error: jsonResp({ error: "Admin access required" }, 403) };

  return { user, supabase, isSuperAdmin: roleSet.has("super_admin") };
}

// Parse DATABASE_URL into deno-postgres connection options with IBM CA cert
function getPoolConfig() {
  const databaseUrl = Deno.env.get("DATABASE_URL");
  if (!databaseUrl) throw new Error("DATABASE_URL environment variable is not set");

  const url = new URL(databaseUrl);
  let caCert = Deno.env.get("IBM_DB_CA_CERT") || "";

  if (caCert) {
    // Handle base64-encoded certs (no PEM header)
    if (!caCert.includes("-----BEGIN")) {
      try {
        caCert = atob(caCert);
      } catch {
        // not base64, use as-is
      }
    }
    
    // Fix single-line PEM: extract the base64 body and reformat with proper 64-char lines
    if (caCert.includes("-----BEGIN CERTIFICATE-----") && !caCert.includes("\n")) {
      const body = caCert
        .replace("-----BEGIN CERTIFICATE-----", "")
        .replace("-----END CERTIFICATE-----", "")
        .replace(/\s+/g, "");
      const lines = body.match(/.{1,64}/g) || [];
      caCert = "-----BEGIN CERTIFICATE-----\n" + lines.join("\n") + "\n-----END CERTIFICATE-----\n";
    }
    
    console.log("CA cert ready, length:", caCert.length, "has newlines:", caCert.includes("\n"));
  }

  const tlsConfig = caCert
    ? { enabled: true, enforce: true, caCertificates: [caCert] }
    : { enabled: true, enforce: false };

  return {
    hostname: url.hostname,
    port: url.port || "5432",
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    tls: tlsConfig,
  };
}

async function withClient<T>(fn: (client: ReturnType<Pool["connect"]> extends Promise<infer C> ? C : never) => Promise<T>): Promise<T> {
  const pool = new Pool(getPoolConfig(), 1);
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
    await pool.end();
  }
}

async function handleStatus() {
  return withClient(async (client) => {
    const result = await client.queryObject<{ version: string }>("SELECT version()");
    const version = result.rows[0]?.version ?? "unknown";
    const url = new URL(Deno.env.get("DATABASE_URL")!);
    return jsonResp({
      status: "connected",
      host: url.hostname,
      port: url.port || "5432",
      database: url.pathname.slice(1),
      ssl: "verify-full (CA provided)",
      postgresVersion: version,
    });
  });
}

async function handleTables() {
  return withClient(async (client) => {
    const result = await client.queryObject<{ table_name: string; table_type: string }>(
      `SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    return jsonResp({ tables: result.rows });
  });
}

async function handleQuery(query: string) {
  const classification = classifyQuery(query);
  if (classification !== "read") {
    return jsonResp({ error: "Only read-only queries (SELECT, SHOW, EXPLAIN) are allowed via 'query'. Use 'mutate' for writes." }, 403);
  }

  return withClient(async (client) => {
    const result = await client.queryObject(query);
    return jsonResp({ rows: result.rows, rowCount: result.rows.length });
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
      return null;
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
  _params: unknown[] | undefined,
  user: { id: string; email?: string },
  supabase: ReturnType<typeof createClient>,
  ipAddress: string | null,
  userAgent: string | null,
) {
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

  try {
    await supabase.rpc("log_audit_event", {
      _user_id: user.id,
      _action: "IBM_DB_WRITE",
      _resource_type: "ibm_database",
      _resource_id: null,
      _ip_address: ipAddress,
      _user_agent: userAgent,
      _details: {
        query: query.substring(0, 500),
        executedAt: new Date().toISOString(),
      },
    });
  } catch (auditErr) {
    console.error("Failed to log audit event, aborting write:", auditErr);
    return jsonResp({ error: "Write aborted: audit logging failed" }, 500);
  }

  return withClient(async (client) => {
    const transaction = client.createTransaction("mutation");
    await transaction.begin();
    try {
      const result = await transaction.queryObject(query);
      await transaction.commit();
      return jsonResp({
        success: true,
        rowCount: result.rows.length,
        rows: result.rows,
      });
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
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
