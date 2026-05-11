const jwt = require('jsonwebtoken');

/**
 * Auth middleware factory.
 * @param {string[]} roles - allowed roles; empty array = allow any authenticated user
 */
module.exports = (roles = []) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
