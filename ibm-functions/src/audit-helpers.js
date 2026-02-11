/**
 * Shared audit logging helper — writes to audit_logs via the
 * log_audit_event database function.
 */
import { query } from './db.js';

export async function logAuditEvent({
  userId,
  action,
  resourceType,
  resourceId = null,
  ipAddress = null,
  userAgent = null,
  details = {},
}) {
  try {
    const result = await query(
      `SELECT log_audit_event($1, $2, $3, $4, $5, $6, $7) AS log_id`,
      [userId, action, resourceType, resourceId, ipAddress, userAgent, JSON.stringify(details)]
    );
    return result.rows?.[0]?.log_id;
  } catch (err) {
    console.error('Failed to write audit log:', err);
    return null;
  }
}
