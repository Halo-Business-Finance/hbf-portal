/**
 * Audit Logger — IBM Cloud Function (Node.js 20 / Express)
 * Ported from supabase/functions/audit-logger/index.ts
 *
 * POST /api/audit-logger
 * Body: { action, resourceType, resourceId?, details? }
 */
import { Router } from 'express';
import { requireAuth, hasRoleOrHigher } from '../auth.js';
import { logAuditEvent } from '../audit-helpers.js';
import { query } from '../db.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  try {
    const { action, resourceType, resourceId, details } = req.body;

    if (!action || !resourceType) {
      return res.status(400).json({ error: 'Missing required fields: action, resourceType' });
    }

    // Client info
    const userAgent = req.headers['user-agent'] || null;
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const ipAddress = (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0]?.trim() : realIp) || null;

    console.log(`Audit log: User ${req.userId} - ${action} on ${resourceType}${resourceId ? ` (${resourceId})` : ''}`);

    // Check admin-level role
    const isAdminLevel = await hasRoleOrHigher(req.userId, 'customer_service');

    // Enrich details
    const enrichedDetails = {
      ...details,
      userEmail: req.userEmail,
      userRole: isAdminLevel ? 'admin_level' : 'user',
      requestId: crypto.randomUUID(),
      loggedAt: new Date().toISOString(),
    };

    const logId = await logAuditEvent({
      userId: req.userId,
      action,
      resourceType,
      resourceId: resourceId || null,
      ipAddress,
      userAgent,
      details: enrichedDetails,
    });

    if (!logId) {
      return res.status(500).json({ success: false, error: 'Failed to log audit event' });
    }

    console.log(`Audit log created: ${logId}`);

    // Anomaly detection for sensitive data access
    if (['VIEW_BANK_ACCOUNTS', 'VIEW_BANK_ACCOUNT_DETAIL', 'VIEW_CREDIT_REPORTS'].includes(action)) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const countResult = await query(
        `SELECT COUNT(*) AS cnt FROM audit_logs
         WHERE user_id = $1
           AND action = ANY($2)
           AND created_at >= $3`,
        [req.userId, ['VIEW_BANK_ACCOUNTS', 'VIEW_BANK_ACCOUNT_DETAIL', 'VIEW_CREDIT_REPORTS'], oneHourAgo]
      );
      const count = parseInt(countResult.rows[0]?.cnt || '0', 10);

      if (count > 50) {
        console.warn(`SECURITY ALERT: User ${req.userId} accessed sensitive data ${count} times in the last hour`);
        await logAuditEvent({
          userId: req.userId,
          action: 'SECURITY_ALERT',
          resourceType: 'security_alert',
          ipAddress,
          userAgent,
          details: {
            alertType: 'excessive_sensitive_data_access',
            accessCount: count,
            timeWindow: '1_hour',
            triggeredAt: new Date().toISOString(),
          },
        });
      }
    }

    return res.json({ success: true, logId });
  } catch (err) {
    console.error('Audit logger error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
