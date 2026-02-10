import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Parse DATABASE_URL into deno-postgres connection options with IBM CA cert
function getPoolConfig() {
  const databaseUrl = Deno.env.get("DATABASE_URL");
  if (!databaseUrl) throw new Error("DATABASE_URL environment variable is not set");

  const url = new URL(databaseUrl);
  let caCert = Deno.env.get("IBM_DB_CA_CERT") || "";

  if (caCert) {
    if (!caCert.includes("-----BEGIN")) {
      try { caCert = atob(caCert); } catch { /* not base64 */ }
    }
    if (caCert.includes("-----BEGIN CERTIFICATE-----") && !caCert.includes("\n")) {
      const body = caCert.replace("-----BEGIN CERTIFICATE-----", "").replace("-----END CERTIFICATE-----", "").replace(/\s+/g, "");
      const lines = body.match(/.{1,64}/g) || [];
      caCert = "-----BEGIN CERTIFICATE-----\n" + lines.join("\n") + "\n-----END CERTIFICATE-----\n";
    }
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

/**
 * Authenticate any logged-in user (not admin-only).
 * Returns the user's ID for scoping queries.
 */
async function authenticateUser(req: Request): Promise<{ userId: string } | { error: Response }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = req.headers.get("Authorization");

  if (!supabaseUrl || !supabaseAnonKey) return { error: jsonResp({ error: "Missing Supabase configuration" }, 500) };
  if (!authHeader?.startsWith("Bearer ")) return { error: jsonResp({ error: "Authorization required" }, 401) };

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return { error: jsonResp({ error: "Unauthorized" }, 401) };

  return { userId: data.claims.sub as string };
}

// --- Supported operations ---

type Operation =
  | { entity: "loan_applications"; action: "list"; userId: string }
  | { entity: "loan_applications"; action: "list_by_status"; userId: string; statuses: string[] }
  | { entity: "loan_applications"; action: "get_by_id"; id: string }
  | { entity: "loan_applications"; action: "has_any"; userId: string }
  | { entity: "loan_applications"; action: "delete"; id: string; userId: string }
  | { entity: "loan_applications"; action: "update_status"; id: string; userId: string; status: string }
  | { entity: "bank_accounts"; action: "list_active"; userId: string }
  | { entity: "bank_accounts"; action: "list_balances"; userId: string }
  | { entity: "credit_scores"; action: "list_scores"; userId: string }
  | { entity: "documents"; action: "list_categories"; userId: string };

async function handleOperation(op: Operation) {
  return withClient(async (client) => {
    switch (op.entity) {
      // --- Loan Applications ---
      case "loan_applications": {
        switch (op.action) {
          case "list": {
            const r = await client.queryObject(
              `SELECT * FROM public.loan_applications WHERE user_id = $1 ORDER BY created_at DESC`,
              [op.userId]
            );
            return jsonResp({ data: r.rows });
          }
          case "list_by_status": {
            // Build parameterized IN clause
            const placeholders = op.statuses.map((_, i) => `$${i + 2}`).join(", ");
            const r = await client.queryObject(
              `SELECT * FROM public.loan_applications WHERE user_id = $1 AND status IN (${placeholders}) ORDER BY application_submitted_date DESC`,
              [op.userId, ...op.statuses]
            );
            return jsonResp({ data: r.rows });
          }
          case "get_by_id": {
            const r = await client.queryObject(
              `SELECT * FROM public.loan_applications WHERE id = $1 LIMIT 1`,
              [op.id]
            );
            return jsonResp({ data: r.rows[0] ?? null });
          }
          case "has_any": {
            const r = await client.queryObject<{ exists: boolean }>(
              `SELECT EXISTS(SELECT 1 FROM public.loan_applications WHERE user_id = $1) as exists`,
              [op.userId]
            );
            return jsonResp({ data: r.rows[0]?.exists ?? false });
          }
          case "delete": {
            await client.queryObject(
              `DELETE FROM public.loan_applications WHERE id = $1 AND user_id = $2`,
              [op.id, op.userId]
            );
            return jsonResp({ success: true });
          }
          case "update_status": {
            await client.queryObject(
              `UPDATE public.loan_applications SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`,
              [op.status, op.id, op.userId]
            );
            return jsonResp({ success: true });
          }
        }
        break;
      }

      // --- Bank Accounts ---
      case "bank_accounts": {
        switch (op.action) {
          case "list_active": {
            const r = await client.queryObject(
              `SELECT * FROM public.bank_accounts WHERE user_id = $1 AND status = 'active' ORDER BY balance DESC`,
              [op.userId]
            );
            return jsonResp({ data: r.rows });
          }
          case "list_balances": {
            const r = await client.queryObject(
              `SELECT balance FROM public.bank_accounts WHERE user_id = $1`,
              [op.userId]
            );
            return jsonResp({ data: r.rows });
          }
        }
        break;
      }

      // --- Credit Scores ---
      case "credit_scores": {
        const r = await client.queryObject(
          `SELECT score FROM public.credit_scores WHERE user_id = $1`,
          [op.userId]
        );
        return jsonResp({ data: r.rows });
      }

      // --- Documents ---
      case "documents": {
        const r = await client.queryObject(
          `SELECT document_category FROM public.borrower_documents WHERE user_id = $1`,
          [op.userId]
        );
        return jsonResp({ data: r.rows });
      }
    }

    return jsonResp({ error: "Unknown operation" }, 400);
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authenticateUser(req);
    if ("error" in auth) return auth.error;
    const { userId } = auth;

    const databaseUrl = Deno.env.get("DATABASE_URL");
    if (!databaseUrl) {
      return jsonResp({ error: "IBM Database not configured" }, 503);
    }

    const body = await req.json();
    const { entity, action, ...params } = body;

    if (!entity || !action) {
      return jsonResp({ error: "entity and action are required" }, 400);
    }

    // Build operation with user scoping enforced
    const op: Operation = (() => {
      switch (entity) {
        case "loan_applications":
          switch (action) {
            case "list": return { entity, action, userId };
            case "list_by_status": return { entity, action, userId, statuses: params.statuses ?? [] };
            case "get_by_id": return { entity, action, id: params.id };
            case "has_any": return { entity, action, userId };
            case "delete": return { entity, action, id: params.id, userId };
            case "update_status": return { entity, action, id: params.id, userId, status: params.status };
            default: throw new Error(`Unknown action: ${action}`);
          }
        case "bank_accounts":
          switch (action) {
            case "list_active": return { entity, action, userId };
            case "list_balances": return { entity, action, userId };
            default: throw new Error(`Unknown action: ${action}`);
          }
        case "credit_scores":
          return { entity, action: "list_scores", userId };
        case "documents":
          return { entity, action: "list_categories", userId };
        default:
          throw new Error(`Unknown entity: ${entity}`);
      }
    })();

    return await handleOperation(op);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("IBM Data API error:", msg);
    return jsonResp({ error: msg }, 500);
  }
});
