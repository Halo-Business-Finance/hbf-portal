/**
 * RPC Proxy — IBM Cloud Function (Node.js 20 / Express)
 *
 * Replaces Supabase PostgREST RPC calls.
 * Calls PostgreSQL functions with parameterized arguments.
 *
 * POST /api/rpc/:functionName
 * Body: { ...params }
 */
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { query as dbQuery } from '../db.js';

const router = Router();

// Allowed RPC functions (whitelist)
const ALLOWED_FUNCTIONS = new Set([
  'get_user_notification_preferences',
  'mark_notification_read',
  'mark_all_notifications_read',
  'update_profile',
  'check_rate_limit',
  'get_current_user_role',
  'has_app_role',
  'has_role',
  'has_role_or_higher',
  'is_assigned_to_user',
  'log_audit_event',
  'increment_security_telemetry',
  'cleanup_rate_limit_tracking',
  'cleanup_old_crm_sync_logs',
]);

router.post('/:functionName', requireAuth, async (req, res) => {
  try {
    const { functionName } = req.params;

    if (!ALLOWED_FUNCTIONS.has(functionName)) {
      return res.status(400).json({ error: `RPC function "${functionName}" is not allowed` });
    }

    const params = req.body || {};
    const paramNames = Object.keys(params);
    const paramValues = Object.values(params);

    let sql;
    if (paramNames.length === 0) {
      sql = `SELECT * FROM ${functionName}()`;
    } else {
      // Named parameters: SELECT * FROM func(_param1 := $1, _param2 := $2)
      const argList = paramNames.map((name, i) => `${name} := $${i + 1}`).join(', ');
      sql = `SELECT * FROM ${functionName}(${argList})`;
    }

    const result = await dbQuery(sql, paramValues);

    // Return the same shape PostgREST does (array of rows, or scalar)
    if (result.rows.length === 1 && Object.keys(result.rows[0]).length === 1) {
      // Single scalar result — unwrap
      const key = Object.keys(result.rows[0])[0];
      return res.json(result.rows[0][key]);
    }

    return res.json(result.rows);
  } catch (err) {
    console.error(`RPC error (${req.params.functionName}):`, err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
