/**
 * Unified Express API server for IBM Code Engine.
 * Hosts audit-logger, loan-application-processor, and notification-service
 * as route modules, all backed by IBM PostgreSQL.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool, testConnection } from './db.js';
import auditRouter from './routes/audit-logger.js';
import loanRouter from './routes/loan-application-processor.js';
import notificationRouter from './routes/notification-service.js';
import appIdAuthRouter from './routes/appid-auth.js';
import updateProfileRouter from './routes/update-profile.js';
import healthCheckRouter from './routes/health-check.js';
import securityTelemetryRouter from './routes/security-telemetry.js';
import sendDocumentEmailRouter from './routes/send-document-email.js';
import adminDashboardRouter from './routes/admin-dashboard.js';
import restQueryRouter from './routes/rest-query.js';
import rpcRouter from './routes/rpc.js';

const app = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ──
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));

// ── Health check ──
app.get('/health', async (_req, res) => {
  try {
    await testConnection();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', error: err.message });
  }
});

// ── Routes ──
app.use('/api/audit-logger', auditRouter);
app.use('/api/loan-application-processor', loanRouter);
app.use('/api/notification-service', notificationRouter);
app.use('/api/appid-auth', appIdAuthRouter);
app.use('/api/update-profile', updateProfileRouter);
app.use('/api/update_profile', updateProfileRouter); // alias for underscore variant
app.use('/api/health-check', healthCheckRouter);
app.use('/api/security-telemetry', securityTelemetryRouter);
app.use('/api/send-document-email', sendDocumentEmailRouter);
app.use('/api/admin-dashboard', adminDashboardRouter);
app.use('/api/rest-query', restQueryRouter);
app.use('/api/rpc', rpcRouter);

// ── 404 fallback ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error('[UNHANDLED]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`IBM Functions API listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, draining pool…');
  await pool.end();
  process.exit(0);
});
