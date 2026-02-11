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
