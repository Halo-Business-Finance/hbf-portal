/**
 * Notification Service — IBM Cloud Function (Node.js 20 / Express)
 * Ported from supabase/functions/notification-service/index.ts
 *
 * POST /api/notification-service
 * Body: { action, notificationData? }
 */
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, hasRole } from '../auth.js';
import { checkRateLimit, rateLimitHeaders } from '../rate-limit.js';
import { logAuditEvent } from '../audit-helpers.js';
import { query } from '../db.js';

const router = Router();

const RATE_LIMITS = {
  send:                       { maxRequests: 50,  windowSeconds: 60 },
  'send-bulk':                { maxRequests: 10,  windowSeconds: 60 },
  'get-templates':            { maxRequests: 30,  windowSeconds: 60 },
  'application-status-change':{ maxRequests: 100, windowSeconds: 60 },
  'loan-funded':              { maxRequests: 20,  windowSeconds: 60 },
  'send-external':            { maxRequests: 30,  windowSeconds: 60 },
};

const ADMIN_ONLY_ACTIONS = ['loan-funded', 'send-external', 'send-bulk'];

const requestSchema = z.object({
  action: z.enum(['send', 'send-bulk', 'get-templates', 'application-status-change', 'loan-funded', 'send-external']),
  notificationData: z.any().optional(),
});

// ── Main route ──
router.post('/', requireAuth, async (req, res) => {
  try {
    const clientIp = (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()) || req.headers['x-real-ip'] || 'unknown';
    const validation = requestSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ error: 'Invalid request format', details: validation.error.format() });

    const { action, notificationData } = validation.data;

    // Rate limiting
    const rlConfig = RATE_LIMITS[action] || { maxRequests: 60, windowSeconds: 60 };
    const rlResult = await checkRateLimit(req.userId, `notification-service:${action}`, rlConfig.maxRequests, rlConfig.windowSeconds);
    const rlHeaders = rateLimitHeaders(rlConfig.maxRequests, rlResult);

    if (!rlResult.allowed) {
      await logAuditEvent({ userId: req.userId, action: 'RATE_LIMIT_EXCEEDED', resourceType: 'notification', ipAddress: clientIp, details: { endpoint: 'notification-service', action } });
      const retryAfter = Math.max(1, Math.ceil((new Date(rlResult.reset_at).getTime() - Date.now()) / 1000));
      return res.status(429).set(rlHeaders).set('Retry-After', String(retryAfter)).json({ error: 'Rate limit exceeded', retryAfter });
    }

    res.set(rlHeaders);

    // Admin-only authorization
    if (ADMIN_ONLY_ACTIONS.includes(action)) {
      const isAdmin = await hasRole(req.userId, 'admin');
      if (!isAdmin) return res.status(403).json({ error: 'Admin role required' });
    }

    switch (action) {
      case 'send':
        return handleSend(res, notificationData);
      case 'send-bulk':
        return handleBulk(res, notificationData);
      case 'get-templates':
        return handleGetTemplates(res);
      case 'application-status-change':
        return handleStatusChange(res, notificationData);
      case 'loan-funded':
        return handleLoanFunded(req, res, notificationData);
      case 'send-external':
        return handleSendExternal(res, notificationData);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err) {
    console.error('Notification service error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Handlers ──

function handleSend(res, data) {
  if (!data) return res.status(400).json({ error: 'Notification data required' });
  switch (data.type) {
    case 'email': return sendEmail(res, data);
    case 'sms':   return sendSMS(res, data);
    case 'system':return res.json({ success: true, message: 'System notification created' });
    default:      return res.status(400).json({ error: 'Invalid notification type' });
  }
}

function sendEmail(res, data) {
  const template = getEmailTemplate(data.template, data.data);
  console.log(`EMAIL → ${data.recipient} | Subject: ${template.subject}`);
  return res.json({ success: true, message: 'Email sent', emailLog: { recipient: data.recipient, subject: template.subject, status: 'sent', timestamp: new Date().toISOString() } });
}

function sendSMS(res, data) {
  const message = getSMSTemplate(data.template, data.data);
  console.log(`SMS → ${data.recipient} | ${message}`);
  return res.json({ success: true, message: 'SMS sent', smsLog: { recipient: data.recipient, message, status: 'sent', timestamp: new Date().toISOString() } });
}

function handleBulk(res, data) {
  if (!data?.notifications?.length) return res.status(400).json({ error: 'Notifications array required' });
  console.log(`Bulk: ${data.notifications.length} notifications`);
  return res.json({ success: true, message: 'Bulk notifications processed', resultsCount: data.notifications.length });
}

function handleGetTemplates(res) {
  return res.json({
    templates: {
      application_submitted:    { subject: 'Application Received - Heritage Business Funding' },
      application_under_review: { subject: 'Application Under Review - Heritage Business Funding' },
      application_approved:     { subject: 'Congratulations! Your Application is Approved' },
      application_rejected:     { subject: 'Application Update - Heritage Business Funding' },
      loan_funded:              { subject: 'Your Loan Has Been Funded!' },
      document_required:        { subject: 'Document Required - Heritage Business Funding' },
      payment_reminder:         { subject: 'Payment Reminder - Heritage Business Funding' },
      welcome:                  { subject: 'Welcome to Heritage Business Funding' },
    },
  });
}

function handleStatusChange(res, data) {
  if (!data) return res.status(400).json({ error: 'Notification data required' });
  const template = getEmailTemplate(`application_${data.newStatus}`, { applicantName: data.applicantName, applicationNumber: data.applicationNumber, newStatus: data.newStatus });
  console.log(`Status change email → ${data.applicantEmail} | ${template.subject}`);
  return res.json({ success: true, message: 'Status change notification sent' });
}

async function handleLoanFunded(req, res, data) {
  if (!data) return res.status(400).json({ error: 'Notification data required' });
  const { applicantEmail, applicantName, loanNumber, loanAmount, loanType, monthlyPayment, interestRate, termMonths, userId } = data;

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  // External webhooks
  try { await sendToWebhooks('loan_funded', '🎉 Loan Funded', `${loanType} loan of ${fmt(loanAmount)} funded for ${applicantName}`, data); } catch (e) { console.error('Webhook error:', e); }

  // In-app notification
  if (userId) {
    try {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
         VALUES ($1, $2, $3, 'success', '/existing-loans', $4)`,
        [userId, 'Loan Funded Successfully!', `Your ${loanType} loan of ${fmt(loanAmount)} has been funded. Monthly payment: ${fmt(monthlyPayment)}`,
         JSON.stringify({ loanNumber, loanAmount, loanType, monthlyPayment, interestRate, termMonths })]
      );
    } catch (e) { console.error('In-app notification error:', e); }
  }

  console.log(`Loan funded email → ${applicantEmail}`);
  return res.json({ success: true, message: 'Loan funded notification sent' });
}

async function handleSendExternal(res, data) {
  if (!data) return res.status(400).json({ error: 'Notification data required' });
  try {
    const results = await sendToWebhooks(data.eventType, data.title, data.message, data.data);
    return res.json({ success: true, results });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to send external notifications' });
  }
}

async function sendToWebhooks(eventType, title, message, data) {
  const result = await query(
    `SELECT * FROM external_notification_webhooks WHERE is_active = true AND event_types @> $1::jsonb`,
    [JSON.stringify([eventType])]
  );
  const webhooks = result.rows;
  if (!webhooks.length) return [];

  const results = [];
  for (const wh of webhooks) {
    try {
      const payload = wh.platform === 'slack'
        ? formatSlack(title, message, data)
        : formatDiscord(title, message, data);
      const resp = await fetch(wh.webhook_url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      results.push({ webhook: wh.name, platform: wh.platform, success: resp.ok, status: resp.status });
    } catch (e) {
      results.push({ webhook: wh.name, platform: wh.platform, success: false, error: 'Failed' });
    }
  }
  return results;
}

// ── Templates ──

function getEmailTemplate(templateName, data) {
  const templates = {
    application_submitted:    (d) => ({ subject: 'Application Received', html: `<h1>Thank you, ${d?.applicantName}!</h1>`, text: `Thank you, ${d?.applicantName}!` }),
    application_under_review: (d) => ({ subject: 'Application Under Review', html: `<h1>Hello, ${d?.applicantName}</h1>`, text: `Hello, ${d?.applicantName}` }),
    application_approved:     (d) => ({ subject: 'Application Approved!', html: `<h1>Great news, ${d?.applicantName}!</h1>`, text: `Great news, ${d?.applicantName}!` }),
    application_rejected:     (d) => ({ subject: 'Application Update', html: `<h1>Hello, ${d?.applicantName}</h1>`, text: `Hello, ${d?.applicantName}` }),
    loan_funded:              (d) => ({ subject: 'Your Loan Has Been Funded!', html: `<h1>Congratulations, ${d?.applicantName}!</h1>`, text: `Congratulations!` }),
    welcome:                  (d) => ({ subject: 'Welcome to Heritage Business Funding', html: `<h1>Welcome!</h1>`, text: 'Welcome!' }),
  };
  return (templates[templateName] || templates.welcome)(data || {});
}

function getSMSTemplate(templateName, data) {
  const templates = {
    application_submitted: (d) => `HBF: Application #${d?.applicationNumber} received.`,
    application_approved:  (d) => `HBF: Application #${d?.applicationNumber} approved!`,
    loan_funded:           (d) => `HBF: Your ${d?.loanType} loan of ${d?.loanAmount} has been funded!`,
  };
  return (templates[templateName] || (() => 'Heritage Business Funding notification'))(data || {});
}

function formatSlack(title, message, data) {
  const fields = [];
  if (data?.loanAmount) fields.push({ type: 'mrkdwn', text: `*Amount:*\n${data.loanAmount}` });
  if (data?.loanType) fields.push({ type: 'mrkdwn', text: `*Type:*\n${data.loanType}` });
  if (data?.applicantName) fields.push({ type: 'mrkdwn', text: `*Applicant:*\n${data.applicantName}` });
  return {
    text: `${title}: ${message}`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: title, emoji: true } },
      { type: 'section', text: { type: 'mrkdwn', text: message } },
      ...(fields.length ? [{ type: 'section', fields }] : []),
      { type: 'context', elements: [{ type: 'mrkdwn', text: `Heritage Business Funding | ${new Date().toLocaleString()}` }] },
    ],
  };
}

function formatDiscord(title, message, data) {
  const fields = [];
  if (data?.loanAmount) fields.push({ name: 'Amount', value: data.loanAmount, inline: true });
  if (data?.loanType) fields.push({ name: 'Type', value: data.loanType, inline: true });
  if (data?.applicantName) fields.push({ name: 'Applicant', value: data.applicantName, inline: true });
  return { embeds: [{ title, description: message, color: 0x00d26a, fields: fields.length ? fields : undefined, timestamp: new Date().toISOString(), footer: { text: 'Heritage Business Funding' } }] };
}

export default router;
