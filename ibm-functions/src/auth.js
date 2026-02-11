/**
 * JWT verification middleware for IBM Cloud Functions.
 * Validates tokens issued by IBM App ID or Supabase Auth.
 */
import jwt from 'jsonwebtoken';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;

/**
 * Express middleware: extracts and verifies Bearer token.
 * Sets req.userId, req.userEmail on success.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.userId = decoded.sub;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Check if a user has a specific app_role.
 */
export async function hasRole(userId, role) {
  const result = await query(
    'SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2 LIMIT 1',
    [userId, role]
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Check if user has the given role or higher in the hierarchy.
 */
export async function hasRoleOrHigher(userId, minimumRole) {
  const hierarchy = ['user', 'customer_service', 'underwriter', 'moderator', 'admin', 'super_admin'];
  const minIndex = hierarchy.indexOf(minimumRole);
  if (minIndex < 0) return false;

  const eligibleRoles = hierarchy.slice(minIndex);
  const placeholders = eligibleRoles.map((_, i) => `$${i + 2}`).join(', ');
  const result = await query(
    `SELECT 1 FROM user_roles WHERE user_id = $1 AND role::text IN (${placeholders}) LIMIT 1`,
    [userId, ...eligibleRoles]
  );
  return (result.rowCount ?? 0) > 0;
}
