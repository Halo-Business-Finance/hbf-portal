import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tables in dependency order (parents before children)
const TABLES_IN_ORDER = [
  "profiles",
  "user_roles",
  "loan_applications",
  "loan_application_status_history",
  "admin_application_assignments",
  "bank_accounts",
  "credit_scores",
  "existing_loans",
  "borrower_documents",
  "notifications",
  "notification_preferences",
  "audit_logs",
  "external_notification_webhooks",
  "system_settings",
  "security_telemetry",
  "rate_limit_tracking",
  "crm_contacts",
  "crm_opportunities",
  "crm_activities",
  "crm_integration_settings",
  "crm_sync_log",
];

function getPoolConfig() {
  const databaseUrl = Deno.env.get("DATABASE_URL");
  if (!databaseUrl) throw new Error("DATABASE_URL not set");

  const url = new URL(databaseUrl);
  let caCert = Deno.env.get("IBM_DB_CA_CERT") || "";

  if (caCert) {
    if (!caCert.includes("-----BEGIN")) {
      try { caCert = atob(caCert); } catch { /* use as-is */ }
    }
    if (caCert.includes("-----BEGIN CERTIFICATE-----") && !caCert.includes("\n")) {
      const body = caCert.replace("-----BEGIN CERTIFICATE-----", "").replace("-----END CERTIFICATE-----", "").replace(/\s+/g, "");
      const lines = body.match(/.{1,64}/g) || [];
      caCert = "-----BEGIN CERTIFICATE-----\n" + lines.join("\n") + "\n-----END CERTIFICATE-----\n";
    }
  }

  return {
    hostname: url.hostname,
    port: url.port || "5432",
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    tls: caCert ? { enabled: true, enforce: true, caCertificates: [caCert] } : { enabled: true, enforce: false },
  };
}

function escapeSqlValue(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === "object") {
    const jsonStr = JSON.stringify(val);
    return `'${jsonStr.replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

function buildInsertSQL(tableName: string, rows: Record<string, unknown>[]): string[] {
  if (!rows.length) return [];
  const columns = Object.keys(rows[0]);
  const statements: string[] = [];
  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const valuesClauses = batch.map(row => {
      const vals = columns.map(col => escapeSqlValue(row[col]));
      return `(${vals.join(", ")})`;
    });
    statements.push(
      `INSERT INTO public.${tableName} (${columns.map(c => `"${c}"`).join(", ")}) VALUES\n${valuesClauses.join(",\n")} ON CONFLICT DO NOTHING;`
    );
  }
  return statements;
}

function getSchemaStatements(): string[] {
  return [
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
    `DO $$ BEGIN CREATE TYPE app_role AS ENUM ('admin','moderator','user','customer_service','underwriter','super_admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE application_status AS ENUM ('draft','submitted','under_review','approved','rejected','funded','paused'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE loan_type AS ENUM ('refinance','bridge_loan','purchase','franchise','factoring','working_capital'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin','user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `CREATE TABLE IF NOT EXISTS public.profiles (id UUID PRIMARY KEY, first_name TEXT, last_name TEXT, phone TEXT, business_name TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.user_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, role app_role NOT NULL DEFAULT 'user', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (user_id, role))`,
    `CREATE TABLE IF NOT EXISTS public.loan_applications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, loan_type loan_type NOT NULL, amount_requested NUMERIC, status application_status NOT NULL DEFAULT 'draft', first_name TEXT, last_name TEXT, email TEXT, phone TEXT, business_name TEXT, business_address TEXT, business_city TEXT, business_state TEXT, business_zip TEXT, years_in_business INTEGER, loan_details JSONB DEFAULT '{}'::jsonb, application_number TEXT, application_started_date TIMESTAMPTZ DEFAULT now(), application_submitted_date TIMESTAMPTZ, funded_date TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.loan_application_status_history (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), loan_application_id UUID NOT NULL REFERENCES public.loan_applications(id), status TEXT NOT NULL, changed_by UUID, changed_at TIMESTAMPTZ NOT NULL DEFAULT now(), notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.admin_application_assignments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), admin_id UUID NOT NULL, application_id UUID NOT NULL REFERENCES public.loan_applications(id), assigned_by UUID, assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(), notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS public.bank_accounts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, account_name TEXT NOT NULL, account_number TEXT NOT NULL, account_type TEXT NOT NULL, institution TEXT NOT NULL, balance NUMERIC NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'USD', status TEXT NOT NULL DEFAULT 'active', is_business BOOLEAN NOT NULL DEFAULT false, external_id TEXT, last_synced_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.credit_scores (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, score INTEGER NOT NULL, bureau TEXT NOT NULL, score_date DATE NOT NULL DEFAULT CURRENT_DATE, report_url TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.existing_loans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, loan_application_id UUID REFERENCES public.loan_applications(id), loan_name TEXT NOT NULL, loan_type TEXT NOT NULL, lender TEXT NOT NULL, loan_balance NUMERIC NOT NULL, original_amount NUMERIC NOT NULL, monthly_payment NUMERIC NOT NULL, interest_rate NUMERIC NOT NULL, term_months INTEGER NOT NULL, remaining_months INTEGER NOT NULL, maturity_date DATE NOT NULL, origination_date DATE NOT NULL, status TEXT NOT NULL DEFAULT 'current', loan_purpose TEXT NOT NULL, has_prepayment_penalty BOOLEAN NOT NULL DEFAULT false, prepayment_period_end_date DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.borrower_documents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, file_name TEXT NOT NULL, file_path TEXT NOT NULL, file_type TEXT NOT NULL, file_size INTEGER NOT NULL, document_category TEXT NOT NULL DEFAULT 'general', description TEXT, version_number INTEGER NOT NULL DEFAULT 1, parent_document_id UUID REFERENCES public.borrower_documents(id), is_latest_version BOOLEAN NOT NULL DEFAULT true, uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'info', read BOOLEAN NOT NULL DEFAULT false, read_at TIMESTAMPTZ, action_url TEXT, metadata JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.notification_preferences (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE, preferences JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, action TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id UUID, ip_address TEXT, user_agent TEXT, details JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.external_notification_webhooks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, platform TEXT NOT NULL, webhook_url TEXT NOT NULL, description TEXT, is_active BOOLEAN DEFAULT true, channels JSONB DEFAULT '[]'::jsonb, event_types JSONB DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.system_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), setting_key TEXT NOT NULL, setting_value JSONB NOT NULL, category TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT now(), updated_by UUID)`,
    `CREATE TABLE IF NOT EXISTS public.security_telemetry (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), metric_name TEXT NOT NULL, metric_date DATE NOT NULL DEFAULT CURRENT_DATE, count BIGINT NOT NULL DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (metric_name, metric_date))`,
    `CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), identifier TEXT NOT NULL, endpoint TEXT NOT NULL, request_count INTEGER NOT NULL DEFAULT 1, window_start TIMESTAMPTZ NOT NULL DEFAULT now(), window_end TIMESTAMPTZ NOT NULL, blocked_until TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (identifier, endpoint, window_start))`,
    `CREATE TABLE IF NOT EXISTS public.crm_contacts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, company_name TEXT, job_title TEXT, lead_source TEXT DEFAULT 'website', lead_status TEXT DEFAULT 'new', contact_type TEXT DEFAULT 'lead', notes TEXT, tags TEXT[], assigned_to UUID, external_crm_id TEXT, custom_fields JSONB DEFAULT '{}'::jsonb, last_contact_date TIMESTAMPTZ, next_follow_up_date TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.crm_opportunities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), contact_id UUID NOT NULL REFERENCES public.crm_contacts(id), loan_application_id UUID REFERENCES public.loan_applications(id), opportunity_name TEXT NOT NULL, loan_type TEXT NOT NULL, loan_amount NUMERIC, stage TEXT DEFAULT 'prospecting', probability INTEGER DEFAULT 50, expected_close_date DATE, actual_close_date DATE, assigned_to UUID, loss_reason TEXT, notes TEXT, external_crm_id TEXT, custom_fields JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.crm_activities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), contact_id UUID REFERENCES public.crm_contacts(id), opportunity_id UUID REFERENCES public.crm_opportunities(id), user_id UUID NOT NULL, activity_type TEXT NOT NULL, subject TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'pending', priority TEXT DEFAULT 'medium', duration_minutes INTEGER, scheduled_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, external_crm_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.crm_integration_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, external_crm_name TEXT NOT NULL DEFAULT 'loanflow-nexus', api_endpoint TEXT, webhook_url TEXT, sync_enabled BOOLEAN DEFAULT false, sync_direction TEXT DEFAULT 'bidirectional', last_sync_at TIMESTAMPTZ, field_mappings JSONB DEFAULT '{}'::jsonb, settings JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS public.crm_sync_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, sync_type TEXT NOT NULL, operation TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id UUID, external_id TEXT, status TEXT NOT NULL, error_message TEXT, data_payload JSONB, processing_time_ms INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE OR REPLACE VIEW public.bank_accounts_masked AS SELECT id, user_id, account_name, '****' || RIGHT(account_number, 4) AS account_number_masked, account_type, institution, balance, currency, status, is_business, created_at, updated_at FROM public.bank_accounts`,
  ];
}

async function authenticateAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");

  if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase configuration");
  if (!authHeader) return { error: "Authorization header required", status: 401 };

  const supabase = createClient(supabaseUrl, supabaseKey);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return { error: "Unauthorized", status: 401 };

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));
  if (!roleSet.has("super_admin") && !roleSet.has("admin")) {
    return { error: "Admin access required to run migrations", status: 403 };
  }

  return { user, supabase };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Use streaming to avoid timeout — send progress as newline-delimited JSON
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        const auth = await authenticateAdmin(req);
        if ("error" in auth) {
          send({ type: "error", error: auth.error });
          controller.close();
          return;
        }
        const { user, supabase } = auth;

        const body = await req.json().catch(() => ({}));
        const step = body.step || "full";

        const log: string[] = [];
        const errors: string[] = [];
        let tablesCreated = 0;
        let rowsInserted = 0;

        send({ type: "progress", message: "Connecting to IBM PostgreSQL..." });

        const pool = new Pool(getPoolConfig(), 1);
        let client;
        try {
          client = await pool.connect();
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          send({ type: "error", error: `Failed to connect to IBM: ${msg}` });
          controller.close();
          await pool.end();
          return;
        }

        try {
          // STEP 1: Schema creation
          if (step === "schema" || step === "full") {
            send({ type: "progress", message: "Starting schema creation..." });
            log.push("Starting schema creation...");
            const schemaStatements = getSchemaStatements();

            for (const stmt of schemaStatements) {
              try {
                await client.queryObject(stmt);
                if (stmt.includes("CREATE TABLE")) tablesCreated++;
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                if (!msg.includes("already exists") && !msg.includes("duplicate")) {
                  errors.push(`Schema error: ${msg.substring(0, 200)}`);
                  send({ type: "error_detail", message: `Schema error: ${msg.substring(0, 200)}` });
                }
              }
            }
            log.push(`Schema creation complete. ${tablesCreated} table statements processed.`);
            send({ type: "progress", message: `Schema creation complete. ${tablesCreated} table statements processed.` });
          }

          // STEP 2: Data migration
          if (step === "data" || step === "full") {
            send({ type: "progress", message: "Starting data migration..." });
            log.push("Starting data migration...");

            try {
              await client.queryObject("SET session_replication_role = 'replica'");
            } catch {
              log.push("Warning: Could not disable triggers during import");
              send({ type: "progress", message: "Warning: Could not disable triggers during import" });
            }

            for (const tableName of TABLES_IN_ORDER) {
              try {
                const { data: rows, error: fetchError } = await supabase
                  .from(tableName)
                  .select("*")
                  .limit(10000);

                if (fetchError) {
                  errors.push(`Fetch ${tableName}: ${fetchError.message}`);
                  send({ type: "error_detail", message: `Fetch ${tableName}: ${fetchError.message}` });
                  continue;
                }

                if (!rows || rows.length === 0) {
                  log.push(`${tableName}: 0 rows (skipped)`);
                  send({ type: "table_progress", table: tableName, rows: 0, skipped: true });
                  continue;
                }

                const insertStatements = buildInsertSQL(tableName, rows);
                for (const stmt of insertStatements) {
                  try {
                    await client.queryObject(stmt);
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    errors.push(`Insert ${tableName}: ${msg.substring(0, 200)}`);
                    send({ type: "error_detail", message: `Insert ${tableName}: ${msg.substring(0, 200)}` });
                  }
                }

                rowsInserted += rows.length;
                log.push(`${tableName}: ${rows.length} rows exported`);
                send({ type: "table_progress", table: tableName, rows: rows.length, skipped: false });
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                errors.push(`Table ${tableName}: ${msg.substring(0, 200)}`);
                send({ type: "error_detail", message: `Table ${tableName}: ${msg.substring(0, 200)}` });
              }
            }

            try {
              await client.queryObject("SET session_replication_role = 'origin'");
            } catch {
              log.push("Warning: Could not re-enable triggers");
            }

            log.push(`Data migration complete. ${rowsInserted} total rows exported.`);
            send({ type: "progress", message: `Data migration complete. ${rowsInserted} total rows exported.` });
          }

          // Audit the migration
          try {
            await supabase.rpc("log_audit_event", {
              _user_id: user.id,
              _action: "IBM_DATA_MIGRATION",
              _resource_type: "ibm_database",
              _details: {
                step,
                tablesCreated,
                rowsInserted,
                errors: errors.length,
                completedAt: new Date().toISOString(),
              },
            });
          } catch { /* non-critical */ }

          // Final result
          send({
            type: "complete",
            success: errors.length === 0,
            step,
            tablesCreated,
            rowsInserted,
            log,
            errors: errors.length > 0 ? errors : undefined,
          });
        } finally {
          client.release();
          await pool.end();
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error("Migration error:", msg);
        send({ type: "error", error: msg });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
    },
  });
});
