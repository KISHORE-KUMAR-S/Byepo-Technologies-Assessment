const router = require('express').Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');

// Static Super Admin credentials — override via .env
const SUPER_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL || 'super@admin.com',
  password: process.env.SUPER_ADMIN_PASS || 'superpass123',
};

// POST /api/superadmin/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (email !== SUPER_ADMIN.email || password !== SUPER_ADMIN.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { role: 'super_admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  res.json({ token });
});

// POST /api/superadmin/organizations
router.post('/organizations', auth(['super_admin']), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Organization name is required' });
    }
    const [result] = await db.execute(
      'INSERT INTO organizations (name) VALUES (?)',
      [name.trim()]
    );
    res.status(201).json({ id: result.insertId, name: name.trim() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Organization name already exists' });
    }
    throw err;
  }
});

// GET /api/superadmin/organizations
router.get('/organizations', auth(['super_admin']), async (req, res) => {
  const [rows] = await db.execute(
    'SELECT id, name, created_at FROM organizations ORDER BY created_at DESC'
  );
  res.json(rows);
});

// DELETE /api/superadmin/organizations/:id
router.delete('/organizations/:id', auth(['super_admin']), async (req, res) => {
  const [result] = await db.execute(
    'DELETE FROM organizations WHERE id = ?',
    [req.params.id]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  res.json({ message: 'Organization deleted' });
});

module.exports = router;
