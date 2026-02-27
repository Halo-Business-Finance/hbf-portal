/**
 * IBM Cloud Object Storage — Express routes
 * Replaces Supabase Storage for the borrower-documents bucket.
 *
 * POST   /api/storage/upload          — Upload file (multipart/form-data)
 * POST   /api/storage/signed-url      — Generate a time-limited download URL
 * DELETE /api/storage/delete           — Delete object(s)
 *
 * Environment variables:
 *   IBM_COS_API_KEY       — IAM API key for COS
 *   IBM_COS_ENDPOINT      — e.g. https://s3.us-south.cloud-object-storage.appdomain.cloud
 *   IBM_COS_BUCKET        — e.g. hbf-portal-bucket
 *   IBM_COS_INSTANCE_ID   — COS service instance CRN
 */
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import crypto from 'crypto';

const router = Router();

// ── IAM token cache ──

let cachedToken = null;
let tokenExpiresAt = 0;

async function getIamToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60_000) return cachedToken;

  const apiKey = process.env.IBM_COS_API_KEY;
  if (!apiKey) throw new Error('IBM_COS_API_KEY not configured');

  const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: apiKey,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IAM token error (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
}

function getCosConfig() {
  const endpoint = process.env.IBM_COS_ENDPOINT;
  const bucket = process.env.IBM_COS_BUCKET;
  const instanceId = process.env.IBM_COS_INSTANCE_ID;

  if (!endpoint || !bucket || !instanceId) {
    throw new Error('IBM COS not fully configured. Set IBM_COS_ENDPOINT, IBM_COS_BUCKET, IBM_COS_INSTANCE_ID.');
  }
  return { endpoint, bucket, instanceId };
}

// Basic validation to prevent path traversal and unsafe characters in object keys
function validateObjectKey(objectKey) {
  if (typeof objectKey !== 'string') {
    return 'Invalid path type';
  }
  // Disallow directory traversal and backslashes
  if (objectKey.includes('..') || objectKey.includes('\\')) {
    return 'Path contains invalid sequences';
  }
  // Disallow leading slash to avoid changing the base path semantics
  if (objectKey.startsWith('/')) {
    return 'Path must not start with a slash';
  }
  // Very long keys are likely abusive
  if (objectKey.length > 1024) {
    return 'Path is too long';
  }
  // Basic control character check
  if (/[^\x20-\x7E]/.test(objectKey)) {
    return 'Path contains invalid characters';
  }
  return null;
}

// ── Upload (accepts raw body with headers set by frontend) ──

router.post('/upload', requireAuth, async (req, res) => {
  try {
    const { bucket: bucketName, path: objectKey } = req.body || {};

    if (!objectKey) {
      return res.status(400).json({ error: 'Missing path' });
    }

    const validationError = validateObjectKey(objectKey);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Ensure user can only upload to their own prefix
    if (!objectKey.startsWith(`${req.userId}/`)) {
      return res.status(403).json({ error: 'Cannot upload to another user\'s directory' });
    }

    // We expect the file content as base64 in the body
    const { fileBase64, contentType, cacheControl, upsert } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: 'Missing fileBase64' });
    }

    const fileBuffer = Buffer.from(fileBase64, 'base64');

    // Validate file size (10 MB max)
    if (fileBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File exceeds 10 MB limit' });
    }

    const { endpoint, bucket, instanceId } = getCosConfig();
    const token = await getIamToken();

    const headers = {
      Authorization: `Bearer ${token}`,
      'ibm-service-instance-id': instanceId,
      'Content-Type': contentType || 'application/octet-stream',
    };
    if (cacheControl) headers['Cache-Control'] = `max-age=${cacheControl}`;

    const cosUrl = `${endpoint}/${bucket}/portal/documents/${objectKey}`;

    const putRes = await fetch(cosUrl, {
      method: 'PUT',
      headers,
      body: fileBuffer,
    });

    if (!putRes.ok) {
      const text = await putRes.text();
      console.error('COS upload error:', putRes.status, text);
      return res.status(502).json({ error: `COS upload failed (${putRes.status})` });
    }

    return res.json({ key: `portal/documents/${objectKey}` });
  } catch (err) {
    console.error('storage/upload error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// ── Signed URL (time-limited presigned download link) ──

router.post('/signed-url', requireAuth, async (req, res) => {
  try {
    const { bucket: bucketName, path: objectKey, expiresIn } = req.body;

    if (!objectKey) {
      return res.status(400).json({ error: 'Missing path' });
    }

    // Ensure user can only access their own files
    if (!objectKey.startsWith(`${req.userId}/`)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const expiry = Math.min(parseInt(expiresIn) || 3600, 86400); // max 24h

    const { endpoint, bucket, instanceId } = getCosConfig();
    const token = await getIamToken();

    // Use IBM COS presigned URL via the S3-compatible API
    // For simplicity, proxy through the server: fetch the object and return a temporary redirect token
    // Better approach: generate an IAM-delegated URL
    // Since IBM COS supports S3-compatible presigned URLs with HMAC credentials,
    // but we're using IAM, we'll create a short-lived proxy endpoint instead.

    // Generate a secure one-time token
    const downloadToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + expiry * 1000;

    // Store in memory (in production, use Redis or a DB)
    if (!global._cosTokens) global._cosTokens = new Map();
    // Clean up expired tokens
    for (const [k, v] of global._cosTokens) {
      if (v.expiresAt < Date.now()) global._cosTokens.delete(k);
    }
    global._cosTokens.set(downloadToken, { objectKey, expiresAt, userId: req.userId });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const signedUrl = `${baseUrl}/api/storage/download/${downloadToken}`;

    return res.json({ signedURL: signedUrl });
  } catch (err) {
    console.error('storage/signed-url error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate signed URL' });
  }
});

// ── Download (serves file by token) ──

router.get('/download/:token', async (req, res) => {
  try {
    const tokenData = global._cosTokens?.get(req.params.token);
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      return res.status(404).json({ error: 'Link expired or invalid' });
    }

    const { endpoint, bucket } = getCosConfig();
    const token = await getIamToken();

    const cosUrl = `${endpoint}/${bucket}/portal/documents/${tokenData.objectKey}`;
    const cosRes = await fetch(cosUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!cosRes.ok) {
      return res.status(502).json({ error: `COS download failed (${cosRes.status})` });
    }

    const contentType = cosRes.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    const contentLength = cosRes.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    // Stream the response
    const arrayBuf = await cosRes.arrayBuffer();
    res.send(Buffer.from(arrayBuf));
  } catch (err) {
    console.error('storage/download error:', err);
    return res.status(500).json({ error: 'Download failed' });
  }
});

// ── Delete ──

function isValidObjectKeyForUser(objectKey, userId) {
  if (typeof objectKey !== 'string') return false;
  // Ensure the object key is within the user's namespace
  if (!objectKey.startsWith(`${userId}/`)) {
    return false;
  }
  // Disallow path traversal and backslashes
  if (objectKey.includes('..') || objectKey.includes('\\')) {
    return false;
  }
  // Allow only safe characters in the key
  const safeKeyPattern = /^[A-Za-z0-9._\-\/]+$/;
  if (!safeKeyPattern.test(objectKey)) {
    return false;
  }
  return true;
}

router.post('/delete', requireAuth, async (req, res) => {
  try {
    const { bucket: bucketName, paths } = req.body;

    if (!Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ error: 'Missing paths array' });
    }

    // Ensure user can only delete their own files and object keys are well-formed
    for (const p of paths) {
      if (!isValidObjectKeyForUser(p, req.userId)) {
        return res.status(400).json({ error: 'Invalid object key in paths' });
      }
    }

    const { endpoint, bucket, instanceId } = getCosConfig();
    const token = await getIamToken();

    const errors = [];
    for (const objectKey of paths) {
      const cosUrl = `${endpoint}/${bucket}/portal/documents/${objectKey}`;
      const delRes = await fetch(cosUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'ibm-service-instance-id': instanceId,
        },
      });

      if (!delRes.ok && delRes.status !== 404) {
        errors.push(`Failed to delete ${objectKey}: ${delRes.status}`);
      }
    }

    if (errors.length > 0) {
      return res.status(207).json({ errors });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('storage/delete error:', err);
    return res.status(500).json({ error: err.message || 'Delete failed' });
  }
});

export default router;
