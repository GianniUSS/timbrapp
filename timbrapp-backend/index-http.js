// Test server HTTP per TimbrApp
require('dotenv').config();

const fs      = require('fs');
const path    = require('path');
const http    = require('http'); // Cambiato da https a http
const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');
const sequelize = require('./sequelize');

// Importazione di tutti i modelli dal nuovo file di indice
const models = require('./models');
const { 
  User, Subscription, Notification, Timbratura, Request,
  Commessa, Location, Shift, Task, TipologiaDocumento, DocumentoUser,
  Skill, Funzione, FunzioneSkill
} = models;
const authenticateToken = require('./auth');

const app = express();

// 1) Parsing del body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 2) CORS avanzato
const corsOptions = {
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Origin','X-Requested-With','Content-Type','Accept','Authorization'],
  exposedHeaders: ['Content-Length','Content-Type','Authorization'],
  credentials: true,
  maxAge: 86400
};
app.use(cors(corsOptions));

// 3) Health Check
app.get('/api/health', (req, res) => {
  res.json({ status:'ok', time:new Date().toISOString(), protocol: 'HTTP' });
});

// 4) Autenticazione
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where:{ email } });
  if (!user || !(await user.verifyPassword(password))) {
    return res.status(401).json({ error:'Credenziali non valide' });
  }
  const isWebDashboard = user.role === 'web';
  const isAdmin = user.role === 'admin';
  const token = jwt.sign({ id:user.id, email:user.email, role: user.role, isAdmin, isWebDashboard }, process.env.JWT_SECRET, { expiresIn:'8h' });
  res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role, isAdmin, isWebDashboard } });
});

// 5) SPA React statica
app.use(express.static(path.join(__dirname,'../timbrapp-frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname,'../timbrapp-frontend/build','index.html'));
});

// Avvio HTTP server
const server = http.createServer(app);
// Usa porta da env o 4000 se non specificata
const port = process.env.PORT || 4000;

server.listen(port, '0.0.0.0', () => {
  console.log(`HTTP Test Server avviato su http://192.168.1.12:${port}`);
  console.log(`Locale: http://localhost:${port}`);
});
