import axios from 'axios';

// Configurazione di base per axios
const api = axios.create({
  // Usa baseURL relativa per sfruttare il proxy in sviluppo e il percorso reale in produzione
  baseURL: '/api'
});

// Interceptor per gestire token e autenticazione
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API per le commesse
const commesseAPI = {
  getAll: () => api.get('/commesse'),
  getById: (id) => api.get(`/commesse/${id}`),
  create: (commessa) => api.post('/commesse', commessa),
  update: (id, commessa) => api.put(`/commesse/${id}`, commessa),
  delete: (id) => api.delete(`/commesse/${id}`),
  getLocations: (commessaId) => api.get(`/commesse/${commessaId}/locations`)
};

// API per i task
const taskAPI = {
  getAll: () => api.get('/tasks'),
  getByCommessa: (commessaId) => api.get(`/commesse/${commessaId}/tasks`),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (task) => api.post('/tasks', task),
  update: (id, task) => api.put(`/tasks/${id}`, task),
  delete: (id) => api.delete(`/tasks/${id}`),
  assignPersonale: (taskId, personaleIds) => api.post(`/tasks/${taskId}/personale`, { personaleIds }),
  getAssignedPersonale: (taskId) => api.get(`/tasks/${taskId}/personale`),
  getDipendenti: () => api.get('/dipendenti')
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

// Aggiungiamo i metodi API all'oggetto api
api.commesse = commesseAPI;
api.task = taskAPI;
api.personale = personaleAPI;
api.funzioniSkill = funzioniSkillAPI;

export default api;
