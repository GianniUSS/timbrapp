// run-task-migration.js
const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config/config.json')['development'];

async function runMigration() {
  // Connessione al database
  const sequelize = new Sequelize(
    config.database, 
    config.username, 
    config.password, 
    {
      host: config.host,
      dialect: config.dialect,
      logging: console.log
    }
  );

  try {
    // Verifica connessione
    console.log('Testing connection...');
    await sequelize.authenticate();
    console.log('Connection successful!');

    // Ottieni l'interfaccia di query
    const queryInterface = sequelize.getQueryInterface();

    // Aggiungi i campi manualmente
    console.log('Adding durataPrevista column...');
    await queryInterface.addColumn('tasks', 'durataPrevista', {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Durata prevista del task in ore'
    });
    console.log('durataPrevista column added.');
    
    console.log('Adding numeroRisorse column...');
    await queryInterface.addColumn('tasks', 'numeroRisorse', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: 'Numero di risorse necessarie per il task'
    });
    console.log('numeroRisorse column added.');
    
    console.log('Adding skills column...');
    await queryInterface.addColumn('tasks', 'skills', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Competenze richieste per il task (array di skills)'
    });
    console.log('skills column added.');
    
    console.log('Adding dataInizio column...');
    await queryInterface.addColumn('tasks', 'dataInizio', {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Data di inizio pianificata del task'
    });
    console.log('dataInizio column added.');
    
    console.log('Adding dataFine column...');
    await queryInterface.addColumn('tasks', 'dataFine', {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Data di fine pianificata del task'
    });
    console.log('dataFine column added.');

    console.log('All columns added successfully!');

  } catch (error) {
    console.error('Failed to add columns:', error);
  } finally {
    await sequelize.close();
    console.log('Connection closed');
  }
}

runMigration().catch(console.error);
