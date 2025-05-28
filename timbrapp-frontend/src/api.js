// src/api.js
// Configurazione Axios per chiamate API relative
import axios from 'axios';
// import { setupCacheInterceptor } from './utils/cacheInterceptor'; // Temporaneamente disabilitato

// Configurazione corretta dell'URL base dell'API
// Usa baseURL relativo: in sviluppo il proxy di CRACO lo inoltra al backend, in produzione il backend serve le API sulla stessa origine
const apiUrl = '';

const api = axios.create({
  // Utilizziamo l'URL relativo per risolvere problemi di connessione cross-origin
  baseURL: apiUrl
});

console.log('API configurata con baseURL:', api.defaults.baseURL);
console.log('API URL da env:', apiUrl);

// Setup cache interceptor per performance ottimizzate
// setupCacheInterceptor(api); // Temporaneamente disabilitato per risoluzione errori

// Interceptor per aggiungere il token JWT nelle intestazioni
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Logging per debug
  console.log(`API Request [${config.method?.toUpperCase()}]: ${config.url}`);
  console.log(`Full URL will be: ${config.baseURL}${config.url}`);
  
  return config;
}, error => {
  console.error('API request error interceptor:', error);
  return Promise.reject(error);
});

// Interceptor per la gestione delle risposte
api.interceptors.response.use(
  response => {
    console.log(`API Response [${response.config.method?.toUpperCase()}]: ${response.config.url}`, {
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  error => {
    console.error('API Response Error:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// API per le commesse
const commesseAPI = {
  getAll: () => api.get('/commesse'),
  getById: (id) => api.get(`/commesse/${id}`),
  create: (commessa) => api.post('/commesse', commessa),
  update: (id, commessa) => api.put(`/commesse/${id}`, commessa),
  delete: (id) => api.delete(`/commesse/${id}`),
  getLocations: (commessaId) => api.get(`/commesse/${commessaId}/locations`),
  addLocation: (commessaId, location) => api.post(`/commesse/${commessaId}/locations`, location),
  updateLocation: (commessaId, locationId, location) => api.put(`/commesse/${commessaId}/locations/${locationId}`, location),
  deleteLocation: (commessaId, locationId) => api.delete(`/commesse/${commessaId}/locations/${locationId}`),
  findNearby: (lat, lng, radius = 10) => api.get(`/commesse/near?lat=${lat}&lng=${lng}&radius=${radius}`)
};

// API per i task
const taskAPI = {
  getAll: () => api.get('/tasks'),
  getByCommessa: (commessaId) => api.get(`/commesse/${commessaId}/tasks`),
  getById: (id) => api.get(`/tasks/${id}`),
  // Modificare per usare l'endpoint commesse/:commessaId/tasks quando viene fornito un commessaId
  create: (task) => {
    if (task && task.commessaId) {
      console.log(`Creazione task per commessa ${task.commessaId} via /commesse/${task.commessaId}/tasks`);
      return api.post(`/commesse/${task.commessaId}/tasks`, task);
    } else {
      console.log('Creazione task generale via /tasks');
      return api.post('/tasks', task); 
    }
  },
  update: (id, task) => api.put(`/tasks/${id}`, task),
  delete: (id) => api.delete(`/tasks/${id}`),
  assignPersonale: (taskId, personaleIds) => api.post(`/tasks/${taskId}/personale`, { personaleIds }),
  getAssignedPersonale: (taskId) => api.get(`/tasks/${taskId}/personale`),
  getDipendenti: () => api.get('/dipendenti'),
  getShifts: (queryParams) => api.get(`/shifts${queryParams || ''}`),
  assignShift: (taskId, userId, shiftData) => api.post(`/tasks/${taskId}/shifts`, { userId, ...shiftData }),
  deleteShift: (shiftId) => api.delete(`/shifts/${shiftId}`)
};

// API per il personale
const personaleAPI = {
  getAll: () => api.get('/dipendenti'),
  getById: (id) => api.get(`/dipendenti/${id}`),
  create: (personale) => api.post('/dipendenti', personale),
  update: (id, personale) => api.put(`/dipendenti/${id}`, personale),
  delete: (id) => api.delete(`/dipendenti/${id}`),
  getCommesse: (personaleId) => api.get(`/dipendenti/${personaleId}/commesse`)
};

// API per funzioni e skill
const funzioniSkillAPI = {
  getAllFunzioni: () => api.get('/funzioniSkill/funzioni'),
  getFunzioneById: (id) => api.get(`/funzioniSkill/funzioni/${id}`),
  createFunzione: (funzione) => api.post('/funzioniSkill/funzioni', funzione),
  updateFunzione: (id, funzione) => api.put(`/funzioniSkill/funzioni/${id}`, funzione),
  deleteFunzione: (id) => api.delete(`/funzioniSkill/funzioni/${id}`),
  getAllSkill: () => api.get('/funzioniSkill/skill'),
  getSkillById: (id) => api.get(`/funzioniSkill/skill/${id}`),
  createSkill: (skill) => api.post('/funzioniSkill/skill', skill),
  updateSkill: (id, skill) => api.put(`/funzioniSkill/skill/${id}`, skill),
  deleteSkill: (id) => api.delete(`/funzioniSkill/skill/${id}`)
};

// API per pianificazione risorse
const resourcePlannerAPI = {
  getAssignments: (params) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/resourcePlanner/assignments${queryString}`);
  },
  createAssignment: (assignment) => api.post('/resourcePlanner/assignments', assignment),
  updateAssignment: (id, assignment) => api.put(`/resourcePlanner/assignments/${id}`, assignment),
  deleteAssignment: (id) => api.delete(`/resourcePlanner/assignments/${id}`),
  createShift: (taskId, shiftData) => api.post(`/resourcePlanner/tasks/${taskId}/shifts`, shiftData)
};

// Aggiungiamo i metodi API all'oggetto api
api.commesse = commesseAPI;
api.task = taskAPI;
api.personale = personaleAPI;
api.funzioniSkill = funzioniSkillAPI;
api.resourcePlanner = resourcePlannerAPI;

export default api;
