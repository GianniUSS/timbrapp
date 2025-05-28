# TimbrApp - Documentazione Architettura e Struttura Logica

## Panoramica del Progetto

TimbrApp è un'applicazione web completa per la gestione delle risorse umane, timbrature, e pianificazione dei progetti. Il sistema è composto da un frontend React moderno e un backend Node.js con database MySQL.

## Struttura del Progetto

```
timbrapp/
├── timbrapp-frontend/          # Applicazione React Frontend
├── timbrapp-backend/           # Server Node.js Backend
├── migrations/                 # Script migrazione database
└── Configurazioni globali
```

---

## 🎯 FRONTEND (React Application)

### **Architettura Frontend**

Il frontend è strutturato come una Single Page Application (SPA) Progressive Web App (PWA) con le seguenti caratteristiche principali:

#### **Stack Tecnologico**

- **Framework**: React 18.2.0 con React Router DOM
- **UI Framework**: Material-UI (MUI) 5.15.17
- **Build Tool**: Create React App con CRACO
- **Styling**: TailwindCSS + Material-UI
- **Date Management**: date-fns, @mui/x-date-pickers
- **Calendar**: FullCalendar React, React Big Calendar
- **HTTP Client**: Axios
- **PWA**: Workbox per service worker
- **State Management**: React Context + Local State

#### **Struttura Directory Frontend**

```
timbrapp-frontend/
├── public/
│   ├── service-worker.js           # Service Worker principale
│   ├── service-worker-standalone.js # SW alternativo
│   └── manifest.json              # PWA manifest
├── src/
│   ├── components/                 # Componenti riutilizzabili
│   ├── pages/                     # Pagine/Views principali
│   ├── services/                  # Servizi e API client
│   ├── hooks/                     # Custom React hooks
│   ├── context/                   # React Context providers
│   ├── api/                       # Configurazione API
│   ├── App.js                     # App principale + routing
│   ├── index.js                   # Entry point
│   └── config.js                  # Configurazioni
└── package.json
```

### **Componenti Frontend Chiave**

#### **1. Routing e Autenticazione (`App.js`)**

- **Gestore routing principale** con React Router
- **Componenti di protezione route**:
  - `ProtectedRoute`: Richiede autenticazione
  - `AdminRoute`: Richiede ruolo admin
  - `WebDashboardRoute`: Per dashboard web/desktop
- **Gestione stati globali**: online/offline, versioning, PWA updates

#### **2. Pages (Pagine Principali)**

**Dashboard Mobile (`pages/Dashboard.js`)**

- Dashboard principale per dispositivi mobili
- Gestione timbrature (entrata/uscita/pausa)
- Visualizzazione turni e notifiche
- Integrazione IndexedDB per offline

**Dashboard Web (`pages/DashboardWeb.js`)**

- Dashboard per ambiente desktop/web
- Calendario FullCalendar avanzato
- Gestione commesse e location
- TreeView per navigazione progetti

**EventiDashboard (`pages/EventiDashboard.js`)**

- Dashboard specializzata per gestione eventi
- Integra `ResourcePlannerViewNew`
- Gestione completa progetti e risorse

**Altre pagine**:

- `Login.js`: Autenticazione utenti
- `Requests.js`: Gestione richieste ferie/permessi
- `Documentazione.js`: Sistema documentale
- `ShiftsPage.js`: Gestione turni
- `AdminNotifications.js`: Pannello admin notifiche

#### **3. Componenti Core**

**ResourcePlannerViewNew (`components/ResourcePlannerViewNew.js`)**

- **Componente centrale** per pianificazione risorse
- Tre tab principali: Panoramica, Task Attivi, Assegnazioni
- Gestione task, assegnazioni dipendenti, calendario mensile
- Dialog per creazione task e assegnazioni

**ShiftPlanner (`components/ShiftPlanner.js`)**

- Pianificazione turni di lavoro
- Vista calendario e vista risorse
- Assegnazione dipendenti a turni
- Gestione competenze e skills

**Componenti UI Specializzati**:

- `OptimizedCommesseTreeView.js`: TreeView ottimizzata per commesse
- `CalendarSection.js`: Sezione calendario integrata
- `PersonaleTab.js`: Gestione anagrafica personale
- `FunzioniSkillTab.js`: Gestione competenze e ruoli

#### **4. Services e Data Layer**

**API Client (`api.js`)**

```javascript
// Configurazione base Axios con interceptors
const api = axios.create({ baseURL: "/" });

// API organizzate per dominio:
-commesseAPI - // Gestione progetti/commesse
  taskAPI - // Gestione task
  shiftsAPI - // Gestione turni
  resourcePlannerAPI; // Pianificazione risorse
```

**IndexedDB Service (`services/indexedDBService.js`)**

- Gestione database locale per funzionalità offline
- Sync automatico quando torna online
- Cache timbrature, richieste, dati utente

**Dashboard Cache (`services/dashboardCache.js`)**

- Sistema di cache intelligente per performance
- Cache commesse, turni, task per evitare chiamate ripetitive

#### **5. Custom Hooks**

```javascript
// Hook specializzati per logica business
useTimbrature.js; // Gestione timbrature
useCommesse.js; // Gestione commesse
useShifts.js; // Gestione turni
useTasks.js; // Gestione task
useLocations.js; // Gestione location
useOnlineStatus.js; // Stato connettività
usePushNotifications.js; // Push notifications
```

#### **6. PWA e Service Worker**

**Caratteristiche PWA**:

- **Offline First**: Funziona completamente offline
- **Background Sync**: Sincronizza dati quando torna online
- **Push Notifications**: Notifiche native del browser
- **Auto-update**: Aggiornamento automatico dell'app
- **Installabile**: Può essere installata come app nativa

**Service Worker Features**:

- Cache strategico per performance
- Background sync per timbrature offline
- Gestione aggiornamenti app
- Notifiche push

---

## 🗄️ BACKEND (Node.js + Express)

### **Architettura Backend**

Server HTTPS Express.js con architettura REST, autenticazione JWT, e database MySQL.

#### **Stack Tecnologico Backend**

- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Database**: MySQL con Sequelize ORM 6.29.3
- **Autenticazione**: JWT (jsonwebtoken 9.0.0)
- **Security**: bcrypt 5.1.0 per hash password
- **Push Notifications**: web-push 3.6.3
- **Migrations**: Umzug 3.8.2
- **Environment**: dotenv per configurazioni

#### **Struttura Directory Backend**

```
timbrapp-backend/
├── index.js                    # Server principale + routing
├── sequelize.js               # Configurazione database
├── auth.js                    # Middleware autenticazione
├── notifications.js           # Sistema push notifications
├── package.json
├── config/
│   └── config.json            # Configurazione database
├── models/                    # Modelli Sequelize
│   ├── index.js               # Factory modelli
│   ├── User.js                # Utenti e autenticazione
│   ├── Commessa.js            # Progetti/commesse
│   ├── Task.js                # Task di progetto
│   ├── Shift.js               # Turni di lavoro
│   ├── Dipendente.js          # Anagrafica dipendenti
│   ├── Location.js            # Location geografiche
│   ├── Skill.js / Funzione.js # Competenze e ruoli
│   ├── Timbratura.js          # Timbrature dipendenti
│   ├── Request.js             # Richieste ferie/permessi
│   ├── Notification.js        # Sistema notifiche
│   └── DocumentoUser.js       # Sistema documentale
├── routes/                    # Route modulari
│   ├── commesse.js            # API commesse e location
│   ├── tasks.js               # API gestione task
│   ├── shiftRoutes.js         # API turni
│   ├── resourcePlanner.js     # API pianificazione risorse
│   ├── dipendenti.js          # API anagrafica personale
│   └── funzioniSkillRoutes.js # API competenze
├── controllers/               # Controller logica business
│   ├── resourcePlannerController.js
│   ├── shiftController.js
│   ├── DocumentoController.js
│   └── notificationController.js
├── middleware/
│   └── auth.js                # Middleware autenticazione
├── migrations/                # Migration database
└── certs/                     # Certificati HTTPS
```

### **Modelli Database Principali**

#### **Modello Relazionale**

```
Users (1) ←→ (N) Timbrature
Users (1) ←→ (N) Requests
Users (1) ←→ (N) Notifications
Users (1) ←→ (N) Shifts

Commesse (1) ←→ (N) Locations
Commesse (1) ←→ (N) Tasks
Commesse (1) ←→ (N) Shifts

Tasks (1) ←→ (N) TaskDipendente ←→ (N) Dipendenti
Dipendenti (N) ←→ (N) Skills (attraverso tabelle ponte)

Funzioni (1) ←→ (N) FunzioneSkill ←→ (N) Skills
```

#### **Entità Principali**

**Users**: Gestione utenti e autenticazione

- Ruoli: `user`, `admin`, `web`
- Hash password con bcrypt
- JWT token per sessioni

**Commesse**: Progetti/commesse aziendali

- Codice, descrizione, cliente, date, stato
- Relazione 1:N con Location e Task

**Tasks**: Attività all'interno delle commesse

- Nome, descrizione, durata, numero risorse necessarie
- Skills richieste, priorità, stato
- Assegnazioni a dipendenti attraverso TaskDipendente

**Dipendenti**: Anagrafica personale

- Informazioni personali, ruolo, competenze
- Associazione con Skills attraverso tabelle ponte

**Shifts**: Turni di lavoro

- Orari, date, location, note
- Collegamento a User, Commessa, Task

**Locations**: Sedi/location geografiche

- Coordinate GPS, indirizzo
- Associazione a commesse

### **API Endpoints Principali**

#### **Autenticazione**

```
POST /auth/register     # Registrazione utenti
POST /auth/login        # Login con JWT
GET  /user              # Dati utente corrente
```

#### **Gestione Commesse**

```
GET    /api/commesse                    # Lista commesse
POST   /api/commesse                    # Crea commessa
GET    /api/commesse/:id/locations      # Location di commessa
POST   /api/commesse/:id/locations      # Crea location
PUT    /api/commesse/:id/locations/:lid # Aggiorna location
DELETE /api/commesse/:id/locations/:lid # Elimina location
```

#### **Gestione Task**

```
GET    /api/tasks           # Lista task
POST   /api/tasks           # Crea task
PUT    /api/tasks/:id       # Aggiorna task
DELETE /api/tasks/:id       # Elimina task
```

#### **Pianificazione Risorse**

```
GET    /api/resourcePlanner/assignments    # Lista assegnazioni
POST   /api/resourcePlanner/assignments    # Crea assegnazione
PUT    /api/resourcePlanner/assignments/:id # Aggiorna assegnazione
DELETE /api/resourcePlanner/assignments/:id # Elimina assegnazione
```

#### **Gestione Turni**

```
GET    /api/shifts          # Lista turni
POST   /api/shifts          # Crea turno
PUT    /api/shifts/:id      # Aggiorna turno
DELETE /api/shifts/:id      # Elimina turno
```

#### **Timbrature**

```
GET  /timbrature            # Timbrature utente
POST /timbrature            # Nuova timbratura
```

#### **Sistema Notifiche**

```
GET /notifications                  # Lista notifiche utente
PUT /notifications/read-all         # Segna tutte come lette
PUT /notifications/:id/read         # Segna singola come letta

# Push Notifications
GET  /webpush/vapid-public-key      # Chiave pubblica VAPID
POST /webpush/subscribe             # Sottoscrizione push
POST /webpush/unsubscribe           # Rimozione sottoscrizione
POST /admin/send-notification       # Invio notifica (admin)
```

---

## 🔗 COLLEGAMENTI E FLUSSI PRINCIPALI

### **Flow Autenticazione**

1. **Login** (`Login.js`) → POST `/auth/login`
2. **Salvataggio token** in localStorage
3. **Interceptor Axios** aggiunge Authorization header
4. **Middleware auth** (`auth.js`) valida JWT su ogni richiesta protetta
5. **Routing condizionale** basato su ruolo utente

### **Flow Gestione Commesse**

1. **Dashboard Web** carica commesse via `/api/commesse`
2. **TreeView Commesse** (`OptimizedCommesseTreeView`) mostra struttura
3. **Dialog Gestione** per CRUD commesse e location
4. **Cache locale** (`dashboardCache`) per performance
5. **Sync real-time** tra frontend e backend

### **Flow Pianificazione Risorse**

1. **EventiDashboard** → **ResourcePlannerViewNew**
2. **Caricamento dati** task, dipendenti, assegnazioni
3. **Vista calendario mensile** per visualizzazione
4. **Dialog creazione task** con skills richieste
5. **Dialog assegnazione** dipendenti a task
6. **Validazione competenze** dipendente vs task
7. **Salvataggio** via API ResourcePlanner

### **Flow Timbrature (Mobile)**

1. **Dashboard Mobile** mostra stato corrente
2. **ActionButtons** per entrata/uscita/pausa
3. **Geolocalizzazione** per coordinate
4. **Salvataggio locale** (IndexedDB) se offline
5. **Background sync** quando torna online
6. **Notifiche push** per promemoria

### **Flow Gestione Turni**

1. **ShiftPlanner** per pianificazione
2. **Calendario FullCalendar** per visualizzazione
3. **Assegnazione risorse** con controllo skills
4. **Conflitti temporali** automatici
5. **Sync con commesse** e task

### **Flow PWA e Offline**

1. **Service Worker** intercetta richieste
2. **Cache Strategy**: Network First per API, Cache First per assets
3. **IndexedDB** per storage offline
4. **Background Sync** per operazioni in coda
5. **Push Notifications** per engagement
6. **Auto-update** dell'applicazione

---

## 🛡️ SICUREZZA E AUTENTICAZIONE

### **Backend Security**

- **JWT tokens** con scadenza 8h
- **Hash password** con bcrypt (salt 10 rounds)
- **CORS configurazione** specifica
- **HTTPS obbligatorio** con certificati
- **Middleware autenticazione** su tutte le route protette
- **Validazione input** e sanitizzazione
- **Rate limiting** (da implementare)

### **Frontend Security**

- **Token storage** in localStorage
- **Axios interceptors** per gestione automatica auth
- **Route protection** con componenti HOC
- **HTTPS only** per PWA features
- **CSP headers** (da configurare)

---

## 🎨 PATTERN E BEST PRACTICES

### **Frontend Patterns**

- **Component Composition**: Componenti piccoli e riutilizzabili
- **Custom Hooks**: Logica business estratta in hook
- **Context Pattern**: State management per dati globali
- **Error Boundaries**: Gestione errori React
- **Lazy Loading**: Code splitting per performance
- **Memoization**: React.memo e useMemo per ottimizzazioni

### **Backend Patterns**

- **MVC Architecture**: Model-View-Controller separation
- **Repository Pattern**: Accesso dati attraverso modelli Sequelize
- **Middleware Chain**: Autenticazione, CORS, parsing body
- **Factory Pattern**: Inizializzazione modelli centralizzata
- **Error Handling**: Try-catch consistente con logging

### **Database Patterns**

- **Foreign Keys**: Integrità referenziale
- **Soft Deletes**: Mantenimento storico dati
- **Timestamps**: createdAt/updatedAt automatici
- **Indexes**: Performance su query frequenti
- **Migrations**: Versionamento schema database

---

## 📱 CARATTERISTICHE PWA

### **Progressive Web App Features**

- ✅ **Service Worker** per funzionalità offline
- ✅ **Manifest.json** per installabilità
- ✅ **HTTPS** obbligatorio
- ✅ **Responsive Design** mobile-first
- ✅ **Background Sync** per sincronizzazione dati
- ✅ **Push Notifications** native del browser
- ✅ **Add to Home Screen** prompt
- ✅ **Offline Functionality** completa
- ✅ **App Shell** architecture
- ✅ **Cache Strategy** intelligente

### **Offline Capabilities**

- **Timbrature offline** salvate in IndexedDB
- **Sync automatico** al ritorno online
- **Cache intelligente** per dati critici
- **Fallback pages** per contenuti offline
- **Queue sistema** per operazioni in attesa

---

## 🚀 DEPLOYMENT E CONFIGURAZIONE

### **Environment Configuration**

```javascript
// Frontend (.env)
REACT_APP_API_URL=https://192.168.1.12:4000

// Backend (.env)
NODE_ENV=production
JWT_SECRET=your_secret
DB_HOST=localhost
DB_USER=timbrapp
DB_PASS=password
DB_NAME=timbrapp_db
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

### **Build e Deploy**

```bash
# Frontend build
cd timbrapp-frontend
npm run build

# Backend production
cd timbrapp-backend
npm run start:prod
```

### **Database Setup**

```bash
# Setup automatico database
node setup-db.js

# Run migrations
node run-migrations.js
```

---

## 📊 MONITORAGGIO E PERFORMANCE

### **Frontend Monitoring**

- **Web Vitals**: Performance metrics tracking
- **Error Boundary**: Crash reporting
- **Service Worker**: Lifecycle monitoring
- **Cache Hit Ratio**: Performance analysis

### **Backend Monitoring**

- **Request Logging**: Express middleware
- **Database Query Performance**: Sequelize logging
- **Error Tracking**: Try-catch con logging
- **API Response Times**: Monitoring endpoints

---

## 🔄 FLUSSO SVILUPPO

### **Development Workflow**

1. **Backend**: Sviluppo API e modelli
2. **Database**: Migrations e setup
3. **Frontend**: Componenti e pagine
4. **Integration**: Collegamento API
5. **Testing**: Funzionalità end-to-end
6. **PWA**: Ottimizzazioni offline
7. **Deploy**: Build e rilascio

### **Git Structure** (Raccomandato)

```
main/
├── feature/frontend-componente
├── feature/backend-api
├── hotfix/bug-critico
└── release/v1.3.0
```

---

## 📝 CONCLUSIONI

TimbrApp rappresenta un'applicazione web moderna e completa che combina:

- **Frontend React** avanzato con PWA capabilities
- **Backend Node.js** robusto e scalabile
- **Database MySQL** ben strutturato
- **Architettura modulare** e maintainable
- **Security best practices**
- **Offline-first approach**
- **Real-time synchronization**

L'architettura è progettata per essere **scalabile**, **maintainable** e **user-friendly**, con particolare attenzione alle funzionalità offline e all'esperienza utente su dispositivi mobili.

La separazione tra frontend e backend permette sviluppo indipendente e deploy flessibile, mentre l'utilizzo di tecnologie moderne garantisce performance e affidabilità del sistema.

---

## 🔍 AGGIORNAMENTI E OSSERVAZIONI TECNICHE

### **Service Worker Multi-Versione**

Il progetto implementa **tre varianti** del Service Worker:

- `service-worker.js`: Versione Workbox standard con import
- `service-worker-standalone.js`: Versione standalone senza dipendenze esterne
- `service-worker-fixed.js`: Versione ottimizzata con bugfix

**Strategia di Cache Implementata:**

```javascript
// API endpoints: NetworkFirst
- /timbrature, /requests, /commesse: Dati aggiornati con fallback cache

// Assets statici: CacheFirst
- CSS, JS, immagini: Cache persistente con aggiornamenti

// Background Sync: Queuing automatico
- Timbrature offline: Queue 'timbrature-queue'
- Richieste offline: Queue 'requests-queue'
```

### **IndexedDB Service Avanzato**

Il sistema offline utilizza `indexedDBService.js` con:

- **Store separati**: timbrature, richieste, notifiche
- **Sync intelligente**: Retry automatico con exponential backoff
- **Conflict resolution**: Gestione duplicati e timestamp
- **Network detection**: Multiple strategie di verifica connettività

### **Gestione Stato Online/Offline**

Implementazione robusta con:

```javascript
// Hook useOnlineStatus con fallback multipli
navigator.onLine + /api/health endpoint
Polling periodico ogni 30 secondi
Event listeners per online/offline
```

### **Custom Hooks Architetturali**

Il frontend utilizza pattern modulari:

- `useTimbrature`: Logica core timbrature + offline
- `useCommesse`: CRUD commesse con cache
- `usePushNotifications`: Notifiche native browser
- `useOnlineStatus`: Monitoraggio connettività

### **Security Implementation**

- **JWT Authentication**: Token 8h con refresh
- **HTTPS obbligatorio**: Certificati SSL/TLS
- **CORS configurato**: Origin-specific permissions
- **Input validation**: Middleware di validazione

### **Performance Optimizations**

- **Code splitting**: React.lazy + Suspense
- **Memoization**: React.memo, useMemo, useCallback
- **Virtual scrolling**: React-window per liste grandi
- **Cache busting**: Version.json per aggiornamenti

### **Database Relationships**

Schema relazionale ottimizzato:

```sql
Users (1:N) Timbrature, Requests, Notifications
Commesse (1:N) Locations, Tasks, Shifts
Tasks (N:N) Dipendenti via TaskDipendente
Dipendenti (N:N) Skills via tabelle ponte
```

### **Mobile-First PWA Features**

- **Installazione iOS/Android**: Add to Home Screen
- **Offline functionality**: Completa indipendenza rete
- **Background sync**: Sincronizzazione automatica
- **Push notifications**: FCM + VAPID keys
- **Responsive design**: Mobile-first approach

La documentazione existing cattura efficacemente l'architettura core, con queste osservazioni tecniche che completano il quadro implementativo.
