const jwt = require('jsonwebtoken');

// Configurazione di logging
const DEBUG = false;
const logDebug = (...args) => {
  if (DEBUG) console.log(...args);
};

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  logDebug('[AUTH] Chiamata:', req.method, req.originalUrl, '| Authorization:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.warn('[AUTH] Token mancante');
    return res.status(401).json({ error: 'Token mancante' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.warn('[AUTH] Token non valido:', err.message);
      return res.status(403).json({ error: 'Token non valido' });
    }
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
