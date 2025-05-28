// index.js - TimbrApp Backend con HTTPS, SPA React e WebPush
require('dotenv').config();
// Creazione del database se non esiste (dev auto-setup)
const { createConnection } = require('mysql2/promise');
const dbConfig = require('./config/config.json')[process.env.NODE_ENV || 'development'];
(async () => {
  try {
    const conn = await createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.username,
      password: dbConfig.password
    });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    console.log(`Database ${dbConfig.database} verificato/creato.`);
    await conn.end();
  } catch (err) {
    console.error('Errore creazione database:', err);
  }
})();

const fs      = require('fs');
const path    = require('path');
const http    = require('http'); // Temporaneo: torno a HTTP per risolvere problema certificati
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
const pushNotifications = require('./notifications');
const { createNotification } = require('./controllers/notificationController');

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
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin','*');
  res.header('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers','Origin,X-Requested-With,Content-Type,Accept,Authorization');
  res.header('Access-Control-Allow-Credentials','true');
  next();
});
app.options('*', cors(corsOptions));

// 3) Connessione, autenticazione e sincronizzazione modelli
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connessione MySQL riuscita ✅');
    // Crea o aggiorna tutte le tabelle in base ai modelli
    // Disabilitato alter: true per evitare errori di foreign key constraint
    await sequelize.sync();
    console.log('Tabelle sincronizzate con i modelli ✅');
  } catch (err) {
    console.error('Errore sincronizzazione DB:', err);
  }
})();

// Configurazione di logging
const DEBUG = false; // Imposta a true per abilitare i log dettagliati
const logDebug = (...args) => {
  if (DEBUG) console.log(...args);
};

// 4) Web Push Endpoints
app.get('/api/webpush/vapid-public-key', (req, res) => {
  logDebug('[VAPID] Richiesta chiave pubblica');
  const key = pushNotifications.getVapidPublicKey();
  logDebug('[VAPID] Invio chiave:', key?.substring(0, 10) + '...');
  res.json({ key });
});
app.post('/api/webpush/subscribe', authenticateToken, async (req, res) => {
  logDebug('[WEBPUSH] Ricevuta richiesta di subscription');
  logDebug('[WEBPUSH] Body ricevuto:', JSON.stringify(req.body));
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    console.warn('[WEBPUSH] Subscription non valida:', subscription);
    return res.status(400).json({ error: 'Sottoscrizione non valida' });
  }
  try {
    const saved = await pushNotifications.saveSubscription(req.user.id, subscription);
    logDebug('[WEBPUSH] Subscription salvata con successo. ID:', saved.id);
    res.status(201).json({ success: true, id: saved.id });
  } catch (err) {
    console.error('[WEBPUSH] Errore salvataggio subscription:', err);
    res.status(500).json({ error: 'Errore salvataggio subscription', details: err.message });
  }
});
app.post('/api/webpush/test', authenticateToken, async (req, res) => {
  logDebug('[WEBPUSH] Test notifica per userId:', req.user.id);
  const result = await pushNotifications.sendNotification(req.user.id, {
    title: 'Notifica di Test',
    body: 'Questa è una notifica di test dal server!',
    icon: '/icon-192x192.png',
    data: { url: '/', timestamp: new Date().toISOString() }
  });
  res.json(result);
});
app.get('/api/webpush/subscriptions', authenticateToken, async (req, res) => {
  const subs = await Subscription.findAll({ where: { userId: req.user.id } });
  // Invia endpoint completo per permettere il match corretto dal frontend
  const sanitized = subs.map(s => ({ id: s.id, endpoint: s.endpoint, createdAt: s.createdAt }));
  res.json(sanitized);
});
app.delete('/api/webpush/subscriptions/:id', authenticateToken, async (req, res) => {
  console.log('[API] DELETE /api/webpush/subscriptions/' + req.params.id + ' userId=' + req.user.id);
  const sub = await Subscription.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!sub) {
    console.log('[API] Subscription non trovata');
    return res.status(404).json({ error: 'Sottoscrizione non trovata' });
  }
  await sub.destroy();
  console.log('[API] Subscription cancellata con successo');
  res.json({ success: true });
});

// 5) Notifiche Push dal controller
app.post('/api/notifications', authenticateToken, createNotification);

// 6) CRUD Notifiche utente
app.get('/api/notifications', authenticateToken, async (req, res) => {
  const notes = await Notification.findAll({ where:{ userId:req.user.id }, order:[['createdAt','DESC']] });
  res.json(notes);
});
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  const [count] = await Notification.update({ isRead:true },{ where:{ userId:req.user.id, isRead:false }});
  res.json({ success:true, count });
});
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  const note = await Notification.findOne({ where:{ id:req.params.id, userId:req.user.id }});
  if(!note) return res.status(404).json({ error:'Notifica non trovata' });
  note.isRead = true; await note.save();
  res.json({ success:true });
});

// CRUD Richieste utente
app.get('/api/requests', authenticateToken, async (req, res) => {
  try {
    const userRequests = await Request.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json(userRequests);
  } catch (err) {
    console.error('Errore caricamento richieste:', err);
    res.status(500).json({ error: 'Errore caricamento richieste' });
  }
});

app.post('/api/requests', authenticateToken, async (req, res) => {
  try {
    const { type, startDate, endDate, note } = req.body;
    const newRequest = await Request.create({ type, startDate, endDate, note, userId: req.user.id });
    res.status(201).json(newRequest);
  } catch (err) {
    console.error('Errore creazione richiesta:', err);
    res.status(400).json({ error: err.message });
  }
});

// 7) Autenticazione
app.post('/api/auth/register', async (req, res) => {
     const { nome, email, password, role } = req.body;
  // Se il ruolo non è specificato, default a 'user'.
  const userRole = role || 'user';
  if (await User.findOne({ where:{ email } })) {
    return res.status(409).json({ error:'Email già registrata' });
  }
  const user = await User.register(email, password, nome, userRole);
  res.status(201).json({ id:user.id, email:user.email, role: user.role });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where:{ email } });
  if (!user || !(await user.verifyPassword(password))) {
    return res.status(401).json({ error:'Credenziali non valide' });
  }
  // Ruolo per dashboard web/desktop: 'web' (o altro a scelta)
  const isWebDashboard = user.role === 'web';
  const isAdmin = user.role === 'admin';
  const token = jwt.sign({ id:user.id, email:user.email, role: user.role, isAdmin, isWebDashboard }, process.env.JWT_SECRET, { expiresIn:'8h' });
  // Salva anche user info per il FE
  res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role, isAdmin, isWebDashboard } });
});

// Endpoint per verificare lo stato dell'autenticazione
app.get('/api/auth/status', authenticateToken, (req, res) => {
  res.json({ 
    authenticated: true, 
    user: { 
      id: req.user.id, 
      email: req.user.email, 
      role: req.user.role 
    } 
  });
});

// 9) Timbrature
app.get('/api/timbrature', authenticateToken, async (req, res) => {
  const entries = await Timbratura.findAll({ where:{ userId:req.user.id }, order:[['timestamp','ASC']] });
  res.json(entries);
});
app.post('/api/timbrature', authenticateToken, async (req, res) => {
  const { type, lat, lon } = req.body;
  if (!['start','break_start','break_end','end'].includes(type)) {
    return res.status(400).json({ error:'Tipo timbratura non valido' });
  }
  const t = await Timbratura.create({ type, timestamp:new Date(), lat:lat||null, lon:lon||null, userId:req.user.id });
  res.status(201).json(t);
});

// 10) Admin routes (facoltative)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo gli admin possono vedere tutti gli utenti' });
  const users = await User.findAll();
  res.json(users.map(u => ({ 
    id: u.id, 
    email: u.email, 
    nome: u.nome, 
    role: u.role,
    createdAt: u.createdAt 
  })));
});

// 11) Gestione Shifts (Turni)
const shiftRoutes = require('./routes/shiftRoutes');
app.use('/api/shifts', shiftRoutes);

// 12) Gestione pianificazione risorse
const resourcePlannerRoutes = require('./routes/resourcePlanner');
app.use('/api/resourcePlanner', resourcePlannerRoutes);

// 13) Restituisce dati utente autenticato
app.get('/api/user', authenticateToken, async (req, res) => {
  const dbUser = await User.findByPk(req.user.id, { attributes: ['nome'] });
  if (!dbUser) return res.status(404).json({ error: 'Utente non trovato' });
  res.json({ name: dbUser.nome });
});

// 12) Health Check
app.get('/api/health', (req, res) => {
  res.json({ status:'ok', time:new Date().toISOString() });
});

// 13) Sincronizzazione Offline
app.post('/api/sync', authenticateToken, async (req, res) => {
  const { pendingEntries } = req.body;
  if (!Array.isArray(pendingEntries)) return res.status(400).json({ error:'Formato dati non valido' });
  const results = [];
  for (const e of pendingEntries) {
    if (!e.type || !e.timestamp) {
      results.push({ id: e.id, success: false, error: 'Dati mancanti' });
      continue;
    }
    try {
      const t = await Timbratura.create({ type: e.type, timestamp: new Date(e.timestamp), lat: e.lat||null, lon: e.lon||null, userId: req.user.id, syncedFromOffline: true });
      results.push({ id: e.id, success: true, serverId: t.id });
    } catch(err) {
      results.push({ id: e.id, success: false, error: 'Errore salvataggio' });
    }
  }
  res.json({ results });
});

// 14) API per le commesse
app.get('/api/commesse', authenticateToken, async (req, res) => {
  try {
    const commesse = await Commessa.findAll({
      where: { stato: 'attiva' },
      order: [['codice', 'ASC']],
      include: [
        { model: Task, as: 'tasks' },
        { model: Location, as: 'location' }
      ]
    });
    res.json(commesse);
  } catch (error) {
    console.error('Errore nel recupero delle commesse:', error);
    res.status(500).json({ message: 'Errore nel recupero delle commesse' });
  }
});

// 15) API per documenti e tipologie documento
const DocumentoController = require('./controllers/DocumentoController');
const TipologiaDocumentoController = require('./controllers/TipologiaDocumentoController');

// Rotte per tipologie documento
app.get('/api/tipologie-documento', authenticateToken, TipologiaDocumentoController.getAllTipologie);
app.get('/api/tipologie-documento/:id', authenticateToken, TipologiaDocumentoController.getTipologia);
app.post('/api/tipologie-documento', authenticateToken, TipologiaDocumentoController.createTipologia);
app.put('/api/tipologie-documento/:id', authenticateToken, TipologiaDocumentoController.updateTipologia);
app.delete('/api/tipologie-documento/:id', authenticateToken, TipologiaDocumentoController.deleteTipologia);

// Rotte per documenti utente
app.get('/api/documenti', authenticateToken, DocumentoController.getAllDocumenti);
app.get('/api/documenti/user/:userId', authenticateToken, DocumentoController.getDocumentiByUser);
app.get('/api/documenti/:id', authenticateToken, DocumentoController.getDocumento);
app.post('/api/documenti', authenticateToken, DocumentoController.createDocumento);
app.put('/api/documenti/:id/stato-lettura', authenticateToken, DocumentoController.updateStatoLettura);
app.delete('/api/documenti/:id', authenticateToken, DocumentoController.deleteDocumento);

// Dettaglio di una singola commessa
app.get('/api/commesse/:id', authenticateToken, async (req, res) => {
  try {
    const commessa = await Commessa.findByPk(req.params.id, {
      include: [
        { model: Task, as: 'tasks' },
        { model: Location, as: 'location' }
      ]
    });
    if (!commessa) {
      return res.status(404).json({ message: 'Commessa non trovata' });
    }
    res.json(commessa);
  } catch (error) {
    console.error('Errore nel recupero della commessa:', error);
    res.status(500).json({ message: 'Errore nel recupero della commessa' });
  }
});

// Creazione di una nuova commessa
app.post('/api/commesse', authenticateToken, async (req, res) => {
  try {
    const commessa = await Commessa.create(req.body);
    res.status(201).json(commessa);
  } catch (error) {
    console.error('Errore nella creazione della commessa:', error);
    res.status(400).json({ message: 'Errore nella creazione della commessa', error: error.message });
  }
});

// Aggiornamento di una commessa esistente
app.put('/api/commesse/:id', authenticateToken, async (req, res) => {
  try {
    const commessa = await Commessa.findByPk(req.params.id);
    if (!commessa) {
      return res.status(404).json({ message: 'Commessa non trovata' });
    }
    await commessa.update(req.body);
    res.json(commessa);
  } catch (error) {
    console.error('Errore nell\'aggiornamento della commessa:', error);
    res.status(400).json({ message: 'Errore nell\'aggiornamento della commessa', error: error.message });
  }
});

// API per le tipologie di documento
app.get('/api/tipologie-documento', authenticateToken, async (req, res) => {
  try {
    const tipologie = await sequelize.models.TipologiaDocumento.findAll({
      order: [['nome', 'ASC']]
    });
    res.json(tipologie);
  } catch (error) {
    console.error('Errore nel recupero delle tipologie di documento:', error);
    res.status(500).json({ message: 'Errore nel recupero delle tipologie di documento' });
  }
});

// API per i documenti utente
app.get('/api/documenti-utente', authenticateToken, async (req, res) => {
  try {
    const documenti = await sequelize.models.DocumentoUser.findAll({
      where: { userId: req.user.id },
      include: [
        { model: sequelize.models.TipologiaDocumento, as: 'tipologia' }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(documenti);
  } catch (error) {
    console.error('Errore nel recupero dei documenti utente:', error);
    res.status(500).json({ message: 'Errore nel recupero dei documenti utente' });
  }
});

// Caricamento di un nuovo documento
app.post('/api/documenti-utente', authenticateToken, async (req, res) => {
  try {
    const { nome, url, tipologiaId } = req.body;
    
    if (!nome || !url || !tipologiaId) {
      return res.status(400).json({ message: 'Dati mancanti: nome, url e tipologiaId sono richiesti' });
    }
    
    const documento = await sequelize.models.DocumentoUser.create({
      nome,
      url,
      tipologiaId,
      userId: req.user.id,
      stato_lettura: 'non letto'
    });
    
    // Recupera il documento con la tipologia inclusa
    const documentoConTipologia = await sequelize.models.DocumentoUser.findByPk(documento.id, {
      include: [{ model: sequelize.models.TipologiaDocumento, as: 'tipologia' }]
    });
    
    res.status(201).json(documentoConTipologia);
  } catch (error) {
    console.error('Errore durante il caricamento del documento:', error);
    res.status(500).json({ message: 'Errore durante il caricamento del documento' });
  }
});

// Aggiornamento stato lettura documento
app.patch('/api/documenti-utente/:id/stato-lettura', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { stato_lettura } = req.body;
    
    if (!stato_lettura || !['letto', 'non letto'].includes(stato_lettura)) {
      return res.status(400).json({ message: 'Stato lettura non valido' });
    }
    
    const documento = await sequelize.models.DocumentoUser.findOne({
      where: { id, userId: req.user.id }
    });
    
    if (!documento) {
      return res.status(404).json({ message: 'Documento non trovato' });
    }
    
    await documento.update({ stato_lettura });
    
    res.json({ message: 'Stato lettura aggiornato con successo', documento });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dello stato lettura:', error);
    res.status(500).json({ message: 'Errore durante l\'aggiornamento dello stato lettura' });
  }
});

// Eliminazione di una commessa
app.delete('/api/commesse/:id', authenticateToken, async (req, res) => {
  try {
    const commessa = await Commessa.findByPk(req.params.id);
    if (!commessa) {
      return res.status(404).json({ message: 'Commessa non trovata' });
    }
    await commessa.destroy();
    res.json({ message: 'Commessa eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione della commessa:', error);
    res.status(500).json({ message: 'Errore nell\'eliminazione della commessa' });
  }
});

// --- API TURNI (SHIFTS) ---
const { Op } = require('sequelize');

// Crea un nuovo turno
app.post('/api/shifts', authenticateToken, async (req, res) => {
  try {
    const { userId, startTime, endTime, date, role, location, notes } = req.body;
    if (!userId || !startTime || !endTime || !date) {
      return res.status(400).json({ message: 'Dati obbligatori mancanti' });
    }
    const shift = await Shift.create({ userId, startTime, endTime, date, role, location, notes });
    res.status(201).json(shift);
  } catch (error) {
    console.error('Errore creazione turno:', error);
    res.status(500).json({ message: 'Errore creazione turno', error: error.message });
  }
});

// Ottieni tutti i turni (con filtri opzionali)
app.get('/api/shifts', authenticateToken, async (req, res) => {
  try {
    const { userId, date, dateFrom, dateTo } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (date) where.date = date;
    if (dateFrom && dateTo) {
      where.date = { [sequelize.Sequelize.Op.between]: [dateFrom, dateTo] };
    } else if (dateFrom) {
      where.date = { [sequelize.Sequelize.Op.gte]: dateFrom };
    } else if (dateTo) {
      where.date = { [sequelize.Sequelize.Op.lte]: dateTo };
    }
    const shifts = await Shift.findAll({ 
      where, 
      order: [['date', 'DESC'], ['startTime', 'ASC']],
      include: [
        { model: Commessa, as: 'commessa' },
        { model: User, as: 'user', attributes: ['id', 'nome', 'email'] }
      ]
    });
    res.json(shifts);
  } catch (error) {
    console.error('Errore recupero turni:', error);
    res.status(500).json({ message: 'Errore recupero turni' });
  }
});

// Ottieni un turno specifico
app.get('/api/shifts/:id', authenticateToken, async (req, res) => {
  try {
    const shift = await Shift.findByPk(req.params.id);
    if (!shift) return res.status(404).json({ message: 'Turno non trovato' });
    res.json(shift);
  } catch (error) {
    console.error('Errore recupero turno:', error);
    res.status(500).json({ message: 'Errore recupero turno' });
  }
});

// Aggiorna un turno
app.put('/api/shifts/:id', authenticateToken, async (req, res) => {
  try {
    const shift = await Shift.findByPk(req.params.id);
    if (!shift) return res.status(404).json({ message: 'Turno non trovato' });
    await shift.update(req.body);
    res.json(shift);
  } catch (error) {
    console.error('Errore aggiornamento turno:', error);
    res.status(500).json({ message: 'Errore aggiornamento turno' });
  }
});

// Elimina un turno
app.delete('/api/shifts/:id', authenticateToken, async (req, res) => {
  try {
    const shift = await Shift.findByPk(req.params.id);
    if (!shift) return res.status(404).json({ message: 'Turno non trovato' });
    await shift.destroy();
    res.json({ message: 'Turno eliminato' });
  } catch (error) {
    console.error('Errore eliminazione turno:', error);
    res.status(500).json({ message: 'Errore eliminazione turno' });
  }
});

// --- API DASHBOARD WEB: Turni odierni raggruppati per commessa ---
app.get('/api/shifts/today/group-by-commessa', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const shifts = await Shift.findAll({
      where: { date: todayStr },
      include: [
        { model: Commessa, as: 'commessa' },
        { model: User, as: 'user', attributes: ['id', 'nome', 'email'] }
      ],
      order: [
        [{ model: Commessa, as: 'commessa' }, 'codice', 'ASC'],
        ['startTime', 'ASC']
      ]
    });
    // Raggruppa per commessa
    const grouped = {};
    for (const shift of shifts) {
      const commessaKey = shift.commessa ? `${shift.commessa.id}` : 'Senza commessa';
      if (!grouped[commessaKey]) {
        grouped[commessaKey] = {
          commessa: shift.commessa || { id: null, codice: 'N/A', descrizione: 'Senza commessa' },
          turni: []
        };
      }
      grouped[commessaKey].turni.push({
        id: shift.id,
        user: shift.user,
        startTime: shift.startTime,
        endTime: shift.endTime,
        role: shift.role,
        location: shift.location,
        notes: shift.notes
      });
    }
    res.json(Object.values(grouped));
  } catch (error) {
    console.error('Errore dashboard turni:', error);
    res.status(500).json({ message: 'Errore dashboard turni' });
  }
});

// 15) Service Worker headers
app.get('/service-worker.js', (req, res, next) => {
  res.setHeader('Service-Worker-Allowed','/');
  res.setHeader('Cache-Control','no-cache');
  next();
});

// API: Lista task per una commessa
app.get('/api/commesse/:commessaId/tasks', authenticateToken, async (req, res) => {
  logDebug('[API] GET /api/commesse/' + req.params.commessaId + '/tasks');
  try {
    const commessaId = req.params.commessaId;
    const tasks = await Task.findAll({ 
      where: { commessaId },
      include: [{ model: Location, as: 'location' }]
    });
    logDebug('[API] Trovati', tasks.length, 'task per commessa', commessaId);
    res.json(tasks);
  } catch (error) {
    console.error('Errore nel recupero dei task:', error);
    res.status(500).json({ message: 'Errore nel recupero dei task' });
  }
});

// API: Crea un nuovo task per una commessa
app.post('/api/commesse/:commessaId/tasks', authenticateToken, async (req, res) => {
  try {
    const commessaId = req.params.commessaId;
    
    // Log completo dei dati ricevuti
    console.log('Dati ricevuti per la creazione del task:', JSON.stringify(req.body, null, 2));
    
    // Prepara l'oggetto task con tutti i campi disponibili
    const taskData = {
      ...req.body,
      commessaId // Override del commessaId con quello dall'URL
    };
    
    // Verifica che funzioneId sia presente
    if (!taskData.funzioneId) {
      return res.status(400).json({ 
        message: 'Errore nella creazione del task', 
        error: 'Il campo funzioneId è obbligatorio' 
      });
    }
    
    const task = await Task.create(taskData);
    
    // Recupera task con location
    const newTask = await Task.findByPk(task.id, {
      include: [{ model: Location, as: 'location' }]
    });
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Errore nella creazione del task:', error);
    res.status(400).json({ 
      message: 'Errore nella creazione del task', 
      error: error.message 
    });
  }
});

// API: Aggiorna un task
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ message: 'Task non trovato' });
    await task.update(req.body);
    res.json(task);
  } catch (error) {
    console.error('Errore nell\'aggiornamento del task:', error);
    res.status(400).json({ message: 'Errore nell\'aggiornamento del task', error: error.message });
  }
});

// API: Elimina un task
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ message: 'Task non trovato' });
    await task.destroy();
    res.json({ message: 'Task eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione del task:', error);
    res.status(500).json({ message: 'Errore nell\'eliminazione del task' });
  }
});

// --- Registrazione nuove route per funzioni e skill ---
const funzioniSkillRoutes = require('./routes/funzioniSkillRoutes');
app.use('/api/funzioniSkill', funzioniSkillRoutes);

// --- Registrazione route per le commesse ---
const commesseRoutes = require('./routes/commesse');
app.use('/api/commesse', commesseRoutes);

// --- Registrazione nuova route per dipendenti ---
const dipendentiRoutes = require('./routes/dipendenti');
app.use('/api/dipendenti', dipendentiRoutes);

// --- Registrazione nuova route per task ---
const tasksRoutes = require('./routes/tasks');
app.use('/api/tasks', tasksRoutes);

// 15) SPA React statica (IMPORTANTE: Deve stare dopo tutte le API)
app.use(express.static(path.join(__dirname,'../timbrapp-frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname,'../timbrapp-frontend/build','index.html'));
});

// Temporaneamente disabilitato per problemi certificati
/*
// Caricamento certificati SSL
const certsDir    = path.join(__dirname,'certs');
const privateKey  = fs.readFileSync(path.join(certsDir,'192.168.1.12+1-key.pem'),'utf8');
const certificate = fs.readFileSync(path.join(certsDir,'192.168.1.12+1.pem'),'utf8');
*/

// Funzione per provare a usare una porta alternativa se quella principale è occupata
const startServer = (port) => {
  const server = http.createServer(app); // Temporaneo: uso HTTP
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`ERRORE CRITICO: La porta ${port} è già in uso. Terminare i processi che la utilizzano.`);
      console.error(`Eseguire: taskkill /F /FI "PID eq <pid>" dove <pid> è il PID del processo.`);
      process.exit(1); // Termina l'applicazione con errore
    } else {
      console.error('Errore durante l\'avvio del server:', err);
      process.exit(1);
    }
  });
  
  server.listen(port, '0.0.0.0', () => {
    console.log(`HTTP Server temporaneo avviato su http://192.168.1.12:${port}`);
  });
};

// Avvio HTTPS con gestione del conflitto di porte
const portaIniziale = process.env.PORT || 4000;
startServer(portaIniziale);
