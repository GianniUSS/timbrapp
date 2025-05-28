// Server HTTP semplice per test
const express = require('express');
const path = require('path');
const app = express();

// Servizio file statici dalla build
app.use(express.static(path.join(__dirname, '../timbrapp-frontend/build')));

// Fallback per React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../timbrapp-frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Server HTTP di test avviato su http://192.168.1.12:${PORT}`);
});
