/**
 * Loan Application Processor — IBM Cloud Function (Node.js 20 / Express)
 * Ported from supabase/functions/loan-application-processor/index.ts
 *
 * POST /api/loan-application-processor
 * Body: { action, applicationData?, applicationId? }
 */
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, hasRole } from '../auth.js';
import { checkRateLimit, rateLimitHeaders } from '../rate-limit.js';
import { logAuditEvent } from '../audit-helpers.js';
import { query } from '../db.js';

const router = Router();

// ── Rate limit configs ──
const RATE_LIMITS = {
  validate:                { maxRequests: 30,  windowSeconds: 60 },
  process:                 { maxRequests: 10,  windowSeconds: 3600 },
  updateStatus:            { maxRequests: 100, windowSeconds: 60 },
  'calculate-eligibility': { maxRequests: 20,  windowSeconds: 60 },
};

// ── Validation helpers ──
const EMAIL_REGEX = /^(?!.*[.]{2})[a-zA-Z0-9](?:[a-zA-Z0-9._+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;
const BLOCKED_EMAIL_DOMAINS = [
  'tempmail.com','throwaway.email','guerrillamail.com','mailinator.com',
  '10minutemail.com','fakeinbox.com','trashmail.com','yopmail.com',
  'tempail.com','temp-mail.org','sharklasers.com','guerrillamailblock.com',
];
const PHONE_REGEX = /^[\d\s\-\(\)\+\.]+$/;

function validateEmail(email) {
  const sanitized = email.trim().toLowerCase();
  if (!sanitized) return { isValid: false, error: 'Email is required', sanitized };
  if (sanitized.length > 254) return { isValid: false, error: 'Email too long', sanitized };
  const atIdx = sanitized.indexOf('@');
  if (atIdx === -1 || atIdx > 64) return { isValid: false, error: 'Invalid email format', sanitized };
  if (!EMAIL_REGEX.test(sanitized)) return { isValid: false, error: 'Invalid email format', sanitized };
  const domain = sanitized.substring(atIdx + 1);
  if (BLOCKED_EMAIL_DOMAINS.includes(domain)) return { isValid: false, error: 'Disposable email addresses are not allowed', sanitized };
  if (/[<>'";\x00-\x1F\x7F]/.test(email)) return { isValid: false, error: 'Email contains invalid characters', sanitized };
  return { isValid: true, sanitized };
}

function validatePhone(phone) {
  const sanitized = phone.trim();
  if (!sanitized) return { isValid: false, error: 'Phone number is required', sanitized, digitsOnly: '' };
  if (sanitized.length > 25) return { isValid: false, error: 'Phone number too long', sanitized, digitsOnly: '' };
  if (/[<>'";\x00-\x1F\x7F]/.test(phone)) return { isValid: false, error: 'Phone contains invalid characters', sanitized, digitsOnly: '' };
  if (!PHONE_REGEX.test(sanitized)) return { isValid: false, error: 'Phone number contains invalid characters', sanitized, digitsOnly: '' };
  const digitsOnly = sanitized.replace(/\D/g, '');
  if (digitsOnly.length < 7) return { isValid: false, error: 'Phone must have at least 7 digits', sanitized, digitsOnly };
  if (digitsOnly.length > 15) return { isValid: false, error: 'Phone must have no more than 15 digits', sanitized, digitsOnly };
  if (digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly.startsWith('1'))) {
    const areaCode = digitsOnly.length === 11 ? digitsOnly.substring(1, 4) : digitsOnly.substring(0, 3);
    const exchange = digitsOnly.length === 11 ? digitsOnly.substring(4, 7) : digitsOnly.substring(3, 6);
    if (areaCode.startsWith('0') || areaCode.startsWith('1') || /^\d11$/.test(areaCode)) return { isValid: false, error: 'Invalid area code', sanitized, digitsOnly };
    if (exchange.startsWith('0') || exchange.startsWith('1')) return { isValid: false, error: 'Invalid exchange code', sanitized, digitsOnly };
  }
  if (/^(\d)\1+$/.test(digitsOnly)) return { isValid: false, error: 'Invalid phone number pattern', sanitized, digitsOnly };
  return { isValid: true, sanitized, digitsOnly };
}

function sanitizeNotes(input) {
  if (!input) return '';
  return input.trim().slice(0, 1000)
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;').replace(/`/g, '&#x60;');
}

function generateApplicationNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / 86400000);
  const timeComponent = Math.floor(now.getTime() / 1000) % 86400;
  return `HBF-${year}-${dayOfYear.toString().padStart(3, '0')}-${timeComponent.toString().padStart(5, '0')}`;
}

// ── Request schema ──
const requestSchema = z.object({
  action: z.enum(['validate', 'process', 'updateStatus', 'calculate-eligibility']),
  applicationData: z.object({
    loan_type: z.string().max(50),
    amount_requested: z.number().min(1000).max(50000000),
    first_name: z.string().min(2).max(100),
    last_name: z.string().min(2).max(100),
    email: z.string().email().max(255),
    phone: z.string().max(20),
    business_name: z.string().min(2).max(200),
    business_address: z.string().max(255),
    business_city: z.string().max(100),
    business_state: z.string().max(50),
    business_zip: z.string().max(20),
    years_in_business: z.number().min(0).max(200),
    loan_details: z.any(),
    status: z.string().max(50).optional(),
    notes: z.string().max(1000).optional(),
  }).optional(),
  applicationId: z.string().uuid().optional(),
});

// ── Main route ──
router.post('/', requireAuth, async (req, res) => {
  try {
    const clientIp = (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()) || req.headers['x-real-ip'] || 'unknown';
    const validation = requestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request format', details: validation.error.format() });
    }

    const { action, applicationData, applicationId } = validation.data;

    // Rate limiting
    const rlConfig = RATE_LIMITS[action] || { maxRequests: 60, windowSeconds: 60 };
    const rlResult = await checkRateLimit(req.userId || `ip:${clientIp}`, `loan-application:${action}`, rlConfig.maxRequests, rlConfig.windowSeconds);
    const rlHeaders = rateLimitHeaders(rlConfig.maxRequests, rlResult);

    if (!rlResult.allowed) {
      await logAuditEvent({ userId: req.userId || '00000000-0000-0000-0000-000000000000', action: 'RATE_LIMIT_EXCEEDED', resourceType: 'loan_application', ipAddress: clientIp, details: { endpoint: 'loan-application-processor', action } });
      const retryAfter = Math.max(1, Math.ceil((new Date(rlResult.reset_at).getTime() - Date.now()) / 1000));
      return res.status(429).set(rlHeaders).set('Retry-After', String(retryAfter)).json({ error: 'Rate limit exceeded', retryAfter });
    }

    res.set(rlHeaders);

    switch (action) {
      case 'validate':
        return handleValidate(req, res, applicationData);
      case 'process':
        return handleProcess(req, res, applicationData);
      case 'updateStatus':
        return handleUpdateStatus(req, res, applicationId, applicationData);
      case 'calculate-eligibility':
        return handleEligibility(req, res, applicationData);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err) {
    console.error('[ERROR] loan-application-processor:', err);
    return res.status(500).json({ error: 'Unable to process request' });
  }
});

// ── Handlers ──

function runValidation(data) {
  const result = { isValid: true, errors: [], riskScore: 50, autoApprovalEligible: false };
  if (!data.first_name || data.first_name.length < 2) { result.errors.push('First name must be at least 2 characters'); result.isValid = false; }
  if (!data.last_name || data.last_name.length < 2) { result.errors.push('Last name must be at least 2 characters'); result.isValid = false; }
  if (!data.business_name || data.business_name.length < 2) { result.errors.push('Business name is required'); result.isValid = false; }
  if (data.amount_requested < 1000) { result.errors.push('Minimum loan amount is $1,000'); result.isValid = false; }
  if (data.amount_requested > 50000000) { result.errors.push('Maximum loan amount is $50,000,000'); result.isValid = false; }

  const ev = validateEmail(data.email);
  if (!ev.isValid) { result.errors.push(ev.error); result.isValid = false; }
  const pv = validatePhone(data.phone);
  if (!pv.isValid) { result.errors.push(pv.error); result.isValid = false; }

  // Risk scoring
  let risk = 50;
  if (data.years_in_business >= 5) risk -= 15;
  else if (data.years_in_business >= 2) risk -= 8;
  else if (data.years_in_business < 1) risk += 20;
  if (data.amount_requested > 5000000) risk += 15;
  else if (data.amount_requested < 100000) risk -= 5;
  switch (data.loan_type) {
    case 'refinance': risk -= 10; break;
    case 'bridge_loan': risk += 10; break;
    case 'working_capital': risk += 5; break;
  }
  result.riskScore = Math.max(0, Math.min(100, risk));
  result.autoApprovalEligible = result.riskScore < 30 && result.isValid;
  return result;
}

function handleValidate(_req, res, data) {
  if (!data) return res.status(400).json({ error: 'Application data is required' });
  return res.json(runValidation(data));
}

async function handleProcess(req, res, data) {
  if (!data) return res.status(400).json({ error: 'Application data is required' });
  if (!req.userId) return res.status(401).json({ error: 'Authentication required' });

  const validation = runValidation(data);
  if (!validation.isValid) return res.status(400).json({ success: false, errors: validation.errors, message: 'Validation failed' });

  let initialStatus = 'submitted';
  if (validation.autoApprovalEligible) initialStatus = 'under_review';
  else if (validation.riskScore > 70) initialStatus = 'submitted'; // requires_review maps to submitted

  const applicationNumber = generateApplicationNumber();

  const result = await query(
    `INSERT INTO loan_applications (
       user_id, loan_type, amount_requested, first_name, last_name, email, phone,
       business_name, business_address, business_city, business_state, business_zip,
       years_in_business, loan_details, application_number, status, application_submitted_date
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING *`,
    [
      req.userId, data.loan_type, data.amount_requested, data.first_name, data.last_name,
      data.email, data.phone, data.business_name, data.business_address, data.business_city,
      data.business_state, data.business_zip, data.years_in_business,
      JSON.stringify({ ...data.loan_details, risk_score: validation.riskScore, auto_approval_eligible: validation.autoApprovalEligible }),
      applicationNumber, initialStatus, new Date().toISOString(),
    ]
  );

  console.log(`Application ${applicationNumber} processed with risk score: ${validation.riskScore}`);
  return res.json({ success: true, application: result.rows[0], riskScore: validation.riskScore, autoApprovalEligible: validation.autoApprovalEligible });
}

async function handleUpdateStatus(req, res, applicationId, data) {
  if (!req.userId) return res.status(401).json({ error: 'Authentication required' });
  const isAdmin = await hasRole(req.userId, 'admin');
  if (!isAdmin) return res.status(403).json({ error: 'Admin access required' });
  if (!applicationId || !data?.status) return res.status(400).json({ error: 'Application ID and status required' });

  const sanitizedNotes = sanitizeNotes(data.notes);

  // Fetch current loan_details to merge
  const current = await query('SELECT loan_details FROM loan_applications WHERE id = $1', [applicationId]);
  const currentDetails = current.rows[0]?.loan_details || {};
  const updatedDetails = { ...currentDetails, status_notes: sanitizedNotes };

  const result = await query(
    `UPDATE loan_applications SET status = $1, updated_at = NOW(), loan_details = $2 WHERE id = $3 RETURNING *`,
    [data.status, JSON.stringify(updatedDetails), applicationId]
  );

  console.log(`Application ${applicationId} status updated to: ${data.status}`);
  return res.json({ success: true, application: result.rows[0] });
}

function handleEligibility(_req, res, data) {
  if (!data) return res.status(400).json({ error: 'Application data is required' });

  const eligibility = {
    eligible: true,
    maxLoanAmount: 0,
    interestRateRange: { min: 0, max: 0 },
    termOptions: [],
    requirements: [],
    reasons: [],
  };

  let baseAmount = 1000000;
  if (data.years_in_business >= 5) baseAmount *= 5;
  else if (data.years_in_business >= 2) baseAmount *= 2;
  else if (data.years_in_business < 1) { baseAmount *= 0.5; eligibility.requirements.push('Minimum 1 year in business preferred'); }

  switch (data.loan_type) {
    case 'refinance':
      baseAmount *= 1.2; eligibility.interestRateRange = { min: 3.5, max: 6.5 };
      eligibility.termOptions = ['5 years','10 years','15 years','20 years','25 years']; break;
    case 'bridge_loan':
      baseAmount *= 0.8; eligibility.interestRateRange = { min: 6.0, max: 12.0 };
      eligibility.termOptions = ['6 months','12 months','18 months','24 months']; break;
    case 'working_capital':
      baseAmount *= 0.6; eligibility.interestRateRange = { min: 4.0, max: 8.0 };
      eligibility.termOptions = ['1 year','2 years','3 years','5 years']; break;
    default:
      eligibility.interestRateRange = { min: 4.0, max: 10.0 };
      eligibility.termOptions = ['2 years','5 years','10 years'];
  }

  eligibility.maxLoanAmount = Math.min(baseAmount, 50000000);
  if (data.amount_requested > eligibility.maxLoanAmount) {
    eligibility.eligible = false;
    eligibility.reasons.push(`Requested amount exceeds maximum of $${eligibility.maxLoanAmount.toLocaleString()}`);
  }

  eligibility.requirements.push('Valid business license', 'Financial statements (last 2 years)', 'Tax returns (business and personal)', 'Bank statements (last 6 months)', 'Business plan or project description');
  return res.json(eligibility);
}

export default router;
