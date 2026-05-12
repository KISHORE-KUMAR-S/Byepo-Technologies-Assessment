import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../db.js';

const router = Router();

const SUPER_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL || 'super@admin.com',
  password: process.env.SUPER_ADMIN_PASS || 'superpass123',
};

// unified login — handles both super admin and org admin
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (email === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
    const token = jwt.sign({ role: 'super_admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token, role: 'super_admin' });
  }

  const [[user]] = await db.execute(
    'SELECT * FROM users WHERE email = ? AND role = "org_admin"',
    [email]
  );
  if (user && (await bcrypt.compare(password, user.password_hash))) {
    const token = jwt.sign(
      { id: user.id, role: 'org_admin', org_id: user.org_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    return res.json({ token, role: 'org_admin', org_id: user.org_id });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

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
    res.status(201).json({ message: 'Account created. You can now log in.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

export default router;
