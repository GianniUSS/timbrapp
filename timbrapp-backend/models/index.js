// timbrapp-backend/models/index.js
const sequelize = require('../sequelize');
const fs = require('fs');
const path = require('path');

// Importa tutti i modelli dalla directory models
const models = {};
const modelsDir = __dirname;

// Escludi il file index.js e sequelize.js
const modelFiles = fs.readdirSync(modelsDir)
  .filter(file => 
    file.indexOf('.') !== 0 && 
    file !== 'index.js' && 
    file !== 'sequelize.js' &&
    file.slice(-3) === '.js'
  );

// Carica tutti i modelli
for (const file of modelFiles) {
  try {
    const modelName = file.split('.')[0];
    const modelDefinition = require(path.join(modelsDir, file));
    
    // Verifica se il modello è una funzione (factory function che richiede sequelize)
    // o un oggetto/classe già definito
    let model;
    if (typeof modelDefinition === 'function') {
      // È una factory function, chiama la funzione con sequelize come parametro
      model = modelDefinition(sequelize);
      console.log(`Modello ${file} inizializzato correttamente con sequelize`);
    } else {
      // È un oggetto/classe già definito
      model = modelDefinition;
      console.log(`Modello ${file} importato come oggetto già definito`);
    }
    
    models[modelName] = model;
  } catch (err) {
    console.error(`Errore nell'inizializzazione del modello ${file}:`, err);
  }
}

// Configura le associazioni per i modelli che supportano setupAssociations
console.log('Configurazione delle associazioni tra modelli...');
Object.entries(models).forEach(([name, model]) => {
  if (model && typeof model.setupAssociations === 'function') {
    try {
      console.log(`Configurazione associazioni per ${name}...`);
      model.setupAssociations(models);
    } catch (err) {
      console.error(`Errore nella configurazione delle associazioni per ${name}:`, err);
    }
  }
});

// Esporta i modelli e sequelize
module.exports = {
  sequelize,
  ...models
};
