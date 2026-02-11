/**
 * Admin Dashboard — IBM Cloud Function (Node.js 20 / Express)
 * Ported from supabase/functions/admin-dashboard/index.ts
 *
 * POST /api/admin-dashboard  (body: { action, ...params })
 * GET  /api/admin-dashboard?action=stats
 */
import { Router } from 'express';
import { requireAuth, hasRoleOrHigher } from '../auth.js';
import { query } from '../db.js';
import { z } from 'zod';

const router = Router();

// ── Middleware: require admin ──
async function requireAdmin(req, res, next) {
  const isAdmin = await hasRoleOrHigher(req.userId, 'admin');
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ── Security helpers ──

function escapeLikePattern(input) {
  let result = input.replace(/\\/g, '\\\\');
  result = result.replace(/[%_]/g, '\\$&');
  return result;
}

function sanitizeCSVField(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) return "'" + s;
  return s.replace(/"/g, '""');
}

// ── Route handler ──

router.all('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    let action = 'stats';
    let body = {};

    if (req.method === 'POST' && req.body) {
      body = req.body;
      if (body.action) action = body.action;
    } else {
      action = req.query.action || 'stats';
      body = req.query;
    }

    switch (action) {
      case 'stats':
        return await getApplicationStats(res);
      case 'applications':
        return await getFilteredApplications(res, body);
      case 'update-status': {
        const schema = z.object({
          applicationId: z.string().uuid(),
          status: z.string().max(50),
          notes: z.string().max(1000).optional(),
        });
        const v = schema.safeParse(body);
        if (!v.success) return res.status(400).json({ error: 'Invalid update data', details: v.error.format() });
        return await updateApplicationStatus(res, v.data.applicationId, v.data.status, v.data.notes);
      }
      case 'export':
        return await exportApplications(res, body);
      case 'analytics':
        return await getAnalytics(res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err) {
    console.error('Error in admin-dashboard:', err);
    return res.status(500).json({ error: 'An error occurred processing your request' });
  }
});

// ── Stats ──

async function getApplicationStats(res) {
  const { rows: apps } = await query('SELECT * FROM loan_applications');
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const stats = { total: apps.length, byStatus: {}, byLoanType: {}, totalAmount: 0, averageAmount: 0, thisMonth: 0, thisWeek: 0 };
  for (const a of apps) {
    stats.byStatus[a.status] = (stats.byStatus[a.status] || 0) + 1;
    stats.byLoanType[a.loan_type] = (stats.byLoanType[a.loan_type] || 0) + 1;
    if (a.amount_requested) stats.totalAmount += Number(a.amount_requested);
    const d = new Date(a.created_at);
    if (d >= startOfMonth) stats.thisMonth++;
    if (d >= startOfWeek) stats.thisWeek++;
  }
  stats.averageAmount = apps.length ? stats.totalAmount / apps.length : 0;
  return res.json({ stats });
}

// ── Filtered applications ──

async function getFilteredApplications(res, filters) {
  let sql = 'SELECT * FROM loan_applications WHERE 1=1';
  const params = [];
  let idx = 1;

  if (filters.status) { sql += ` AND status = $${idx++}`; params.push(filters.status); }
  if (filters.loanType) { sql += ` AND loan_type = $${idx++}`; params.push(filters.loanType); }
  if (filters.dateFrom) { sql += ` AND created_at >= $${idx++}`; params.push(filters.dateFrom); }
  if (filters.dateTo) { sql += ` AND created_at <= $${idx++}`; params.push(filters.dateTo); }
  if (filters.amountMin) { const v = Number(filters.amountMin); if (!isNaN(v)) { sql += ` AND amount_requested >= $${idx++}`; params.push(v); } }
  if (filters.amountMax) { const v = Number(filters.amountMax); if (!isNaN(v)) { sql += ` AND amount_requested <= $${idx++}`; params.push(v); } }

  if (filters.searchTerm) {
    const raw = String(filters.searchTerm).slice(0, 100).replace(/[(),.'"\[\]{}|^$*+?]/g, '').trim();
    const s = escapeLikePattern(raw);
    if (s.length > 0) {
      const p = `%${s}%`;
      sql += ` AND (business_name ILIKE $${idx} OR first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR application_number ILIKE $${idx})`;
      params.push(p);
      idx++;
    }
  }

  sql += ' ORDER BY created_at DESC';
  const { rows: apps } = await query(sql, params);

  // Get profiles
  const userIds = [...new Set(apps.map(a => a.user_id))];
  let profilesMap = {};
  if (userIds.length > 0) {
    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
    const { rows: profiles } = await query(`SELECT id, first_name, last_name FROM profiles WHERE id IN (${placeholders})`, userIds);
    profilesMap = profiles.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
  }

  const formatted = apps.map(a => {
    const p = profilesMap[a.user_id];
    return { ...a, first_name: p?.first_name || a.first_name || 'N/A', last_name: p?.last_name || a.last_name || 'N/A' };
  });

  return res.json({ applications: formatted });
}

// ── Update status ──

async function updateApplicationStatus(res, applicationId, status, notes) {
  const { rows } = await query('SELECT * FROM loan_applications WHERE id = $1', [applicationId]);
  if (!rows.length) return res.status(404).json({ error: 'Application not found' });
  const app = rows[0];

  const loanDetails = {
    ...(app.loan_details || {}),
    status_notes: notes || '',
    status_updated_at: new Date().toISOString(),
  };

  const { rows: updated } = await query(
    `UPDATE loan_applications SET status = $1, updated_at = NOW(), loan_details = $2 WHERE id = $3 RETURNING *`,
    [status, JSON.stringify(loanDetails), applicationId]
  );

  console.log(`Application ${applicationId} status updated to: ${status}`);
  return res.json({ success: true, application: updated[0], message: 'Application status updated successfully' });
}

// ── Export ──

async function exportApplications(res, filters) {
  let sql = `SELECT application_number, status, loan_type, amount_requested,
             first_name, last_name, business_name, phone, years_in_business,
             application_started_date, application_submitted_date
             FROM loan_applications WHERE 1=1`;
  const params = [];
  let idx = 1;

  if (filters.status) { sql += ` AND status = $${idx++}`; params.push(filters.status); }
  if (filters.loanType) { sql += ` AND loan_type = $${idx++}`; params.push(filters.loanType); }
  if (filters.startDate) { sql += ` AND application_submitted_date >= $${idx++}`; params.push(filters.startDate); }
  if (filters.endDate) { sql += ` AND application_submitted_date <= $${idx++}`; params.push(filters.endDate); }

  const { rows: apps } = await query(sql, params);

  const csvHeader = 'Application Number,Status,Loan Type,Amount Requested,Applicant Name,Business Name,Phone,Years in Business,Application Date,Submitted Date';
  const csvRows = apps.map(a => [
    sanitizeCSVField(a.application_number),
    sanitizeCSVField(a.status),
    sanitizeCSVField(a.loan_type),
    a.amount_requested || 0,
    `"${sanitizeCSVField(a.first_name)} ${sanitizeCSVField(a.last_name)}"`,
    `"${sanitizeCSVField(a.business_name)}"`,
    sanitizeCSVField(a.phone),
    a.years_in_business || 0,
    a.application_started_date ? new Date(a.application_started_date).toLocaleDateString() : '',
    a.application_submitted_date ? new Date(a.application_submitted_date).toLocaleDateString() : '',
  ].join(','));

  const csv = [csvHeader, ...csvRows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="loan_applications_${new Date().toISOString().split('T')[0]}.csv"`);
  return res.send(csv);
}

// ── Analytics ──

async function getAnalytics(res) {
  const { rows: apps } = await query('SELECT * FROM loan_applications');
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 86400000);
  const last7Days = new Date(now.getTime() - 7 * 86400000);

  const recentApps = apps.filter(a => new Date(a.created_at) >= last30Days);
  const analytics = {
    totalApplications: apps.length,
    applicationsTrend: {
      last30Days: recentApps.length,
      last7Days: apps.filter(a => new Date(a.created_at) >= last7Days).length,
    },
    approvalRate: {
      total: apps.length ? (apps.filter(a => a.status === 'approved').length / apps.length) * 100 : 0,
      last30Days: recentApps.length ? (recentApps.filter(a => a.status === 'approved').length / recentApps.length) * 100 : 0,
    },
    averageProcessingTime: calcProcessingTime(apps),
    topLoanTypes: topLoanTypes(apps),
    amountDistribution: amountDistribution(apps),
    statusDistribution: statusDistribution(apps),
  };
  return res.json({ analytics });
}

function calcProcessingTime(apps) {
  const processed = apps.filter(a => a.application_submitted_date && (a.status === 'approved' || a.status === 'rejected'));
  if (!processed.length) return 0;
  const total = processed.reduce((s, a) => s + (new Date(a.updated_at) - new Date(a.application_submitted_date)), 0);
  return total / processed.length / 86400000;
}

function topLoanTypes(apps) {
  const c = {};
  apps.forEach(a => { c[a.loan_type] = (c[a.loan_type] || 0) + 1; });
  return Object.entries(c).map(([type, count]) => ({ type, count, percentage: (count / apps.length) * 100 })).sort((a, b) => b.count - a.count);
}

function amountDistribution(apps) {
  const ranges = [
    { min: 0, max: 50000, label: '$0 - $50K' },
    { min: 50000, max: 100000, label: '$50K - $100K' },
    { min: 100000, max: 500000, label: '$100K - $500K' },
    { min: 500000, max: 1000000, label: '$500K - $1M' },
    { min: 1000000, max: 5000000, label: '$1M - $5M' },
    { min: 5000000, max: Infinity, label: '$5M+' },
  ];
  return ranges.map(r => ({ range: r.label, count: apps.filter(a => a.amount_requested >= r.min && a.amount_requested < r.max).length }));
}

function statusDistribution(apps) {
  const c = {};
  apps.forEach(a => { c[a.status] = (c[a.status] || 0) + 1; });
  return Object.entries(c).map(([status, count]) => ({ status, count, percentage: (count / apps.length) * 100 })).sort((a, b) => b.count - a.count);
}

export default router;
