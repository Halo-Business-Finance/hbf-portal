/**
 * Generic REST Query Proxy — IBM Cloud Function (Node.js 20 / Express)
 *
 * Replaces Supabase PostgREST for authenticated data access.
 * Accepts the same query-parameter conventions the frontend already uses
 * (eq., in.(), order, select, limit) and translates them to parameterized SQL.
 *
 * POST /api/rest-query
 * Body: { table, method?, params?, body?, returnData?, countOnly?, single? }
 */
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { query as dbQuery } from '../db.js';

const router = Router();

// Allowed tables (whitelist to prevent arbitrary table access)
const ALLOWED_TABLES = new Set([
  'loan_applications',
  'bank_accounts',
  'bank_accounts_masked',
  'borrower_documents',
  'credit_scores',
  'existing_loans',
  'profiles',
  'notifications',
  'notification_preferences',
  'audit_logs',
  'loan_application_status_history',
  'security_telemetry',
  'user_roles',
  'system_settings',
  'admin_application_assignments',
  'crm_contacts',
  'crm_activities',
  'crm_opportunities',
  'crm_integration_settings',
  'crm_sync_log',
  'external_notification_webhooks',
  'rate_limit_tracking',
]);

// Allowed columns per table for SELECT (if not specified, all columns returned)
// This is for safety — prevents selecting from sensitive columns
const SENSITIVE_TABLES_REQUIRE_USER_SCOPE = new Set([
  'loan_applications',
  'bank_accounts',
  'bank_accounts_masked',
  'borrower_documents',
  'credit_scores',
  'existing_loans',
  'notifications',
  'notification_preferences',
]);

/**
 * Parse PostgREST-style filter params into WHERE clauses.
 * Supports: eq., neq., gt., gte., lt., lte., in.(), like., ilike., is.
 */
function parseFilters(params, tableColumns) {
  const clauses = [];
  const values = [];
  let idx = 1;

  for (const [key, rawValue] of Object.entries(params)) {
    // Skip PostgREST meta-params
    if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(key)) continue;

    const col = key;

    if (typeof rawValue === 'string') {
      if (rawValue.startsWith('eq.')) {
        clauses.push(`"${col}" = $${idx++}`);
        values.push(rawValue.slice(3));
      } else if (rawValue.startsWith('neq.')) {
        clauses.push(`"${col}" != $${idx++}`);
        values.push(rawValue.slice(4));
      } else if (rawValue.startsWith('gt.')) {
        clauses.push(`"${col}" > $${idx++}`);
        values.push(rawValue.slice(3));
      } else if (rawValue.startsWith('gte.')) {
        clauses.push(`"${col}" >= $${idx++}`);
        values.push(rawValue.slice(4));
      } else if (rawValue.startsWith('lt.')) {
        clauses.push(`"${col}" < $${idx++}`);
        values.push(rawValue.slice(3));
      } else if (rawValue.startsWith('lte.')) {
        clauses.push(`"${col}" <= $${idx++}`);
        values.push(rawValue.slice(4));
      } else if (rawValue.startsWith('in.(') && rawValue.endsWith(')')) {
        const inner = rawValue.slice(4, -1);
        const items = inner.split(',').map(s => s.trim());
        const placeholders = items.map(() => `$${idx++}`);
        clauses.push(`"${col}" IN (${placeholders.join(', ')})`);
        values.push(...items);
      } else if (rawValue.startsWith('like.')) {
        clauses.push(`"${col}" LIKE $${idx++}`);
        values.push(rawValue.slice(5));
      } else if (rawValue.startsWith('ilike.')) {
        clauses.push(`"${col}" ILIKE $${idx++}`);
        values.push(rawValue.slice(6));
      } else if (rawValue.startsWith('is.')) {
        const val = rawValue.slice(3);
        if (val === 'null') clauses.push(`"${col}" IS NULL`);
        else if (val === 'true') clauses.push(`"${col}" IS TRUE`);
        else if (val === 'false') clauses.push(`"${col}" IS FALSE`);
      }
    }
  }

  return { clauses, values, nextIdx: idx };
}

function parseOrder(orderStr) {
  if (!orderStr) return '';
  // e.g. "created_at.desc" or "balance.desc,name.asc"
  const parts = orderStr.split(',').map(p => {
    const [col, dir] = p.trim().split('.');
    const direction = dir?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    return `"${col}" ${direction}`;
  });
  return `ORDER BY ${parts.join(', ')}`;
}

router.post('/', requireAuth, async (req, res) => {
  try {
    const { table, method = 'GET', params = {}, body: reqBody, returnData, countOnly, single } = req.body;

    if (!table || !ALLOWED_TABLES.has(table)) {
      return res.status(400).json({ error: `Table "${table}" is not allowed` });
    }

    const sqlMethod = method.toUpperCase();

    switch (sqlMethod) {
      case 'GET': {
        const selectCols = params.select || '*';
        const { clauses, values } = parseFilters(params, null);
        const orderClause = parseOrder(params.order);
        const limitClause = params.limit ? `LIMIT ${parseInt(params.limit, 10)}` : '';
        const offsetClause = params.offset ? `OFFSET ${parseInt(params.offset, 10)}` : '';

        const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
        const sql = `SELECT ${selectCols} FROM "${table}" ${where} ${orderClause} ${limitClause} ${offsetClause}`;

        if (countOnly) {
          const countSql = `SELECT COUNT(*) as total FROM "${table}" ${where}`;
          const result = await dbQuery(countSql, values);
          const total = parseInt(result.rows[0]?.total || '0', 10);
          return res.json({ data: [], count: total });
        }

        const result = await dbQuery(sql, values);
        const data = single ? (result.rows[0] ?? null) : result.rows;
        return res.json({ data, count: result.rowCount });
      }

      case 'POST': {
        // INSERT — reqBody can be an array or object
        const rows = Array.isArray(reqBody) ? reqBody : [reqBody];
        if (!rows.length) return res.status(400).json({ error: 'No data to insert' });

        const columns = Object.keys(rows[0]);
        const allValues = [];
        const rowPlaceholders = [];
        let idx = 1;

        for (const row of rows) {
          const ph = columns.map(col => {
            allValues.push(row[col] ?? null);
            return `$${idx++}`;
          });
          rowPlaceholders.push(`(${ph.join(', ')})`);
        }

        const colList = columns.map(c => `"${c}"`).join(', ');
        let sql = `INSERT INTO "${table}" (${colList}) VALUES ${rowPlaceholders.join(', ')}`;

        // Handle upsert (on_conflict)
        if (params.on_conflict) {
          const conflict = params.on_conflict;
          // Basic identifier validation to prevent SQL injection via on_conflict
          const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
          if (typeof conflict !== 'string' || !identifierRegex.test(conflict) || !columns.includes(conflict)) {
            return res.status(400).json({ error: 'Invalid on_conflict column' });
          }
          const conflictColumn = `"${conflict}"`;
          sql += ` ON CONFLICT (${conflictColumn}) DO UPDATE SET ${columns.filter(c => c !== conflict).map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')}`;
        }

        if (returnData) sql += ' RETURNING *';

        const result = await dbQuery(sql, allValues);
        return res.json({ data: returnData ? result.rows : null });
      }

      case 'PATCH': {
        // UPDATE
        if (!reqBody || typeof reqBody !== 'object') {
          return res.status(400).json({ error: 'PATCH requires a body' });
        }

        const setCols = Object.keys(reqBody);
        const { clauses, values: filterValues, nextIdx } = parseFilters(params, null);
        const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

        if (!where) return res.status(400).json({ error: 'PATCH requires filter conditions' });

        let idx2 = nextIdx;
        const setClause = setCols.map(col => {
          filterValues.push(reqBody[col]);
          return `"${col}" = $${idx2++}`;
        }).join(', ');

        const sql = `UPDATE "${table}" SET ${setClause} ${where}${returnData ? ' RETURNING *' : ''}`;
        const result = await dbQuery(sql, filterValues);
        return res.json({ data: returnData ? result.rows : null });
      }

      case 'DELETE': {
        const { clauses, values } = parseFilters(params, null);
        const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
        if (!where) return res.status(400).json({ error: 'DELETE requires filter conditions' });

        const sql = `DELETE FROM "${table}" ${where}`;
        await dbQuery(sql, values);
        return res.json({ data: null });
      }

      default:
        return res.status(400).json({ error: `Unsupported method: ${sqlMethod}` });
    }
  } catch (err) {
    console.error('rest-query error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
