import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import auth from '../middleware/auth.js';

const router = Router();

// POST /api/admin/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, org_id } = req.body;
    if (!email || !password || !org_id) {
      return res.status(400).json({ error: 'email, password, and org_id are required' });
    }
    const [[org]] = await db.execute('SELECT id FROM organizations WHERE id = ?', [org_id]);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    const hash = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO users (email, password_hash, role, org_id) VALUES (?, ?, "org_admin", ?)',
      [email.trim(), hash, org_id]
    );
    res.status(201).json({ message: 'Admin account created successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const [[user]] = await db.execute(
    'SELECT * FROM users WHERE email = ? AND role = "org_admin"',
    [email]
  );
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { id: user.id, role: 'org_admin', org_id: user.org_id },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  res.json({ token, org_id: user.org_id });
});

// POST /api/admin/flags
router.post('/flags', auth(['org_admin']), async (req, res) => {
  try {
    const { feature_key, is_enabled } = req.body;
    if (!feature_key?.trim()) {
      return res.status(400).json({ error: 'feature_key is required' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(feature_key.trim())) {
      return res.status(400).json({ error: 'feature_key may only contain letters, numbers, and underscores' });
    }
    await db.execute(
      'INSERT INTO feature_flags (feature_key, is_enabled, org_id) VALUES (?, ?, ?)',
      [feature_key.trim().toLowerCase(), is_enabled ?? false, req.user.org_id]
    );
    res.status(201).json({ message: 'Feature flag created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Feature key already exists for this organization' });
    }
    throw err;
  }
});

// GET /api/admin/flags
router.get('/flags', auth(['org_admin']), async (req, res) => {
  const [rows] = await db.execute(
    'SELECT * FROM feature_flags WHERE org_id = ? ORDER BY created_at DESC',
    [req.user.org_id]
  );
  res.json(rows);
});

// PUT /api/admin/flags/:id
router.put('/flags/:id', auth(['org_admin']), async (req, res) => {
  const { is_enabled } = req.body;
  if (is_enabled === undefined) {
    return res.status(400).json({ error: 'is_enabled is required' });
  }
  const [result] = await db.execute(
    'UPDATE feature_flags SET is_enabled = ? WHERE id = ? AND org_id = ?',
    [is_enabled, req.params.id, req.user.org_id]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Flag not found' });
  }
  res.json({ message: 'Flag updated' });
});

// DELETE /api/admin/flags/:id
router.delete('/flags/:id', auth(['org_admin']), async (req, res) => {
  const [result] = await db.execute(
    'DELETE FROM feature_flags WHERE id = ? AND org_id = ?',
    [req.params.id, req.user.org_id]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Flag not found' });
  }
  res.json({ message: 'Flag deleted' });
});

export default router;
