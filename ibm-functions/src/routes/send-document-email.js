/**
 * Send Document Email — IBM Cloud Function (Node.js 20 / Express)
 * Ported from supabase/functions/send-document-email/index.ts
 *
 * POST /api/send-document-email
 * Body: { recipientEmail, documentName, shareableLink, senderName, documentId? }
 */
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { query } from '../db.js';

const router = Router();

// ── Security helpers ──

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/', requireAuth, async (req, res) => {
  try {
    const { recipientEmail, documentName, shareableLink, senderName, documentId } = req.body;

    // Validate required fields
    if (!recipientEmail || !documentName || !shareableLink || !senderName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!validateEmail(recipientEmail)) {
      return res.status(400).json({ error: 'Invalid recipient email format' });
    }

    if (!validateUrl(shareableLink)) {
      return res.status(400).json({ error: 'Invalid shareable link - must be HTTPS' });
    }

    if (senderName.length > 100 || documentName.length > 255) {
      return res.status(400).json({ error: 'Input exceeds maximum allowed length' });
    }

    // Verify document ownership
    let ownershipSql, ownershipParams;
    if (documentId) {
      ownershipSql = 'SELECT id, file_name FROM borrower_documents WHERE user_id = $1 AND id = $2 LIMIT 1';
      ownershipParams = [req.userId, documentId];
    } else {
      ownershipSql = 'SELECT id, file_name FROM borrower_documents WHERE user_id = $1 AND file_name = $2 LIMIT 1';
      ownershipParams = [req.userId, documentName];
    }

    const { rows } = await query(ownershipSql, ownershipParams);

    if (!rows || rows.length === 0) {
      console.warn(`Unauthorized document share attempt by user ${req.userId} for document: ${documentId || documentName}`);
      return res.status(403).json({ error: 'Document not found or access denied' });
    }

    console.log(`Document ownership verified: ${rows[0].id} belongs to user ${req.userId}`);

    // Check Microsoft 365 credentials
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_TENANT_ID;
    const senderEmail = process.env.MICROSOFT_SENDER_EMAIL;

    if (!clientId || !clientSecret || !tenantId || !senderEmail) {
      return res.status(400).json({
        error: 'Microsoft 365 credentials not configured. Please add MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID, and MICROSOFT_SENDER_EMAIL.',
      });
    }

    // Get access token from Microsoft
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      }
    );

    if (!tokenResponse.ok) {
      console.error('Token error:', await tokenResponse.text());
      return res.status(500).json({ error: 'Failed to authenticate with Microsoft 365' });
    }

    const { access_token } = await tokenResponse.json();

    // Sanitize inputs
    const safeSenderName = escapeHtml(senderName.substring(0, 100));
    const safeDocumentName = escapeHtml(documentName.substring(0, 255));
    const safeShareableLink = escapeHtml(shareableLink);

    // Send email via Microsoft Graph API
    const emailBody = {
      message: {
        subject: `${safeSenderName} shared a document with you: ${safeDocumentName}`,
        body: {
          contentType: 'HTML',
          content: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #0078d4;">Document Shared With You</h2>
                <p><strong>${safeSenderName}</strong> has shared a document with you.</p>
                <p><strong>Document:</strong> ${safeDocumentName}</p>
                <p style="margin: 30px 0;">
                  <a href="${safeShareableLink}"
                     style="background-color: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    View Document
                  </a>
                </p>
                <p style="color: #666; font-size: 14px;">
                  <em>Note: This link will expire based on the sharing settings.</em>
                </p>
              </body>
            </html>
          `,
        },
        toRecipients: [{ emailAddress: { address: recipientEmail } }],
      },
      saveToSentItems: true,
    };

    const sendResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailBody),
      }
    );

    if (!sendResponse.ok) {
      console.error('Send email error:', await sendResponse.text());
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    console.error('send-document-email error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

export default router;
