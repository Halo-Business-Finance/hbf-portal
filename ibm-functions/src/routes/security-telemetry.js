/**
 * Security Telemetry — IBM Cloud Function (Node.js 20 / Express)
 * Ported from supabase/functions/security-telemetry/index.ts
 *
 * POST /api/security-telemetry
 * Body: { metric, count? }
 *
 * Public endpoint — no auth required (anonymous telemetry).
 */
import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

const VALID_METRICS = [
  'password_toggle_show',
  'password_toggle_hide',
  'failed_login_attempt',
  'repeated_failed_login',
  'rate_limit_triggered',
  'session_timeout',
  'mfa_prompt_shown',
];

router.post('/', async (req, res) => {
  try {
    const { metric, count = 1 } = req.body;

    if (!metric || !VALID_METRICS.includes(metric)) {
      console.warn(`Invalid telemetry metric attempted: ${metric}`);
      return res.status(400).json({ error: 'Invalid metric' });
    }

    if (typeof count !== 'number' || count < 1 || count > 100) {
      return res.status(400).json({ error: 'Invalid count' });
    }

    // Increment using the same DB function
    await query(
      `SELECT increment_security_telemetry($1, $2)`,
      [metric, count]
    );

    console.log(`Telemetry recorded: ${metric} (+${count})`);
    return res.json({ success: true });
  } catch (err) {
    console.error('Security telemetry error:', err);
    return res.status(500).json({ success: false });
  }
});

export default router;
