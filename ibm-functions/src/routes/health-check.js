/**
 * Health Check — IBM Cloud Function (Node.js 20 / Express)
 * Ported from supabase/functions/health-check/index.ts
 *
 * GET /api/health-check
 */
import { Router } from 'express';
import { testConnection } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const startTime = Date.now();

  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'disconnected',
    },
    version: '1.0.0',
  };

  try {
    await testConnection();
    healthStatus.services.database = 'connected';
  } catch (err) {
    console.error('Database connection error:', err.message);
    healthStatus.services.database = 'error';
    healthStatus.status = 'degraded';
  }

  const responseTimeMs = Date.now() - startTime;

  return res
    .status(healthStatus.status === 'healthy' ? 200 : 503)
    .json({ ...healthStatus, responseTimeMs });
});

export default router;
