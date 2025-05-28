// timbrapp-backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware di autenticazione
 * Verifica il token JWT e carica l'utente nella richiesta
 */
const auth = async (req, res, next) => {
  try {
    // Estrai il token dall'header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token di autenticazione non fornito' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key_123');
    
    // Cerca l'utente nel database
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      throw new Error('Utente non trovato');
    }
    
    // Aggiungi l'utente alla richiesta
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Errore di autenticazione:', error);
    res.status(401).json({ error: 'Autenticazione fallita' });
  }
};

module.exports = auth;
