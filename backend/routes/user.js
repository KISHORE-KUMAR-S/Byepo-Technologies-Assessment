import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/user/check?org_id=1&feature_key=dark_mode
router.get('/check', async (req, res) => {
  const { org_id, feature_key } = req.query;
  if (!org_id || !feature_key) {
    return res.status(400).json({ error: 'org_id and feature_key are required query parameters' });
  }
  const [[flag]] = await db.execute(
    'SELECT is_enabled FROM feature_flags WHERE feature_key = ? AND org_id = ?',
    [feature_key, org_id]
  );
  if (!flag) return res.json({ found: false, is_enabled: false });
  res.json({ found: true, is_enabled: Boolean(flag.is_enabled) });
});

// GET /api/user/orgs — list all organizations (public, for org picker)
router.get('/orgs', async (req, res) => {
  const [rows] = await db.execute(
    'SELECT id, name FROM organizations ORDER BY name ASC'
  );
  res.json(rows);
});

// GET /api/user/flags?org_id=1 — list all flags for an org (public)
router.get('/flags', async (req, res) => {
  const { org_id } = req.query;
  if (!org_id) {
    return res.status(400).json({ error: 'org_id is required' });
  }
  const [rows] = await db.execute(
    'SELECT feature_key, is_enabled FROM feature_flags WHERE org_id = ? ORDER BY feature_key ASC',
    [org_id]
  );
  res.json(rows);
});

export default router;
