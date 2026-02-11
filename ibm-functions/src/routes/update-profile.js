/**
 * Update Profile — IBM Cloud Function (Node.js 20 / Express)
 * Ported from supabase/functions/update_profile/index.ts
 *
 * POST /api/update-profile
 * Body: { first_name?, last_name?, phone? }
 */
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { query } from '../db.js';
import { z } from 'zod';

const router = Router();

const profileSchema = z.object({
  first_name: z.string().trim().min(1).max(100).optional(),
  last_name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().min(10).max(20).optional(),
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const validation = profileSchema.safeParse(req.body);

    if (!validation.success) {
      console.warn('Profile validation failed for user:', req.userId);
      return res.status(400).json({
        error: 'Invalid profile data',
        details: validation.error.format(),
      });
    }

    const { first_name = null, last_name = null, phone = null } = validation.data;

    await query(
      `UPDATE profiles
       SET first_name = COALESCE($1, first_name),
           last_name  = COALESCE($2, last_name),
           phone      = COALESCE($3, phone),
           updated_at = NOW()
       WHERE id = $4`,
      [first_name || null, last_name || null, phone || null, req.userId]
    );

    console.log('Profile updated successfully for user:', req.userId);
    return res.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in update-profile:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
