// add-sample-task-data.js
const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config/config.json')['development'];

async function addSampleTaskData() {
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
    console.log('Verifica connessione al database...');
    await sequelize.authenticate();
    console.log('Connessione al database riuscita ✅');

    // Definiamo il modello Task direttamente per evitare problemi di importazione
    const Task = sequelize.define('Task', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nome: DataTypes.STRING,
      descrizione: DataTypes.STRING,
      commessaId: DataTypes.INTEGER,
      stato: DataTypes.ENUM('attivo', 'completato', 'annullato'),
      durataPrevista: DataTypes.FLOAT,
      numeroRisorse: DataTypes.INTEGER,
      skills: DataTypes.JSON,
      dataInizio: DataTypes.DATEONLY,
      dataFine: DataTypes.DATEONLY
    }, {
      tableName: 'tasks',
      timestamps: true
    });

    // Skills comuni per vari ruoli
    const skillsList = [
      ['sviluppo web', 'frontend', 'react'],
      ['backend', 'database', 'api'],
      ['devops', 'cloud', 'deployment'],
      ['ui/ux', 'design', 'figma'],
      ['project management', 'documentazione'],
      ['testing', 'qa', 'automazione'],
      ['mobile', 'flutter', 'react native'],
      ['sicurezza', 'performance', 'ottimizzazione']
    ];

    // Ottieni tutti i task esistenti
    const tasks = await Task.findAll();
    console.log(`Trovati ${tasks.length} task da aggiornare`);

    if (tasks.length === 0) {
      console.log('⚠️ Nessun task trovato. Verificare che la tabella contenga dati.');
    }

    // Aggiorna ogni task con dati di esempio
    let updateCount = 0;
    for (const task of tasks) {
      try {
        // Genera valori casuali per i nuovi campi
        const durataPrevista = Math.floor(Math.random() * 40) + 1; // Da 1 a 40 ore
        const numeroRisorse = Math.floor(Math.random() * 5) + 1; // Da 1 a 5 risorse
        
        // Seleziona un set casuale di skills
        const skillIndex = task.id % skillsList.length;
        const skills = skillsList[skillIndex];

        // Crea date di inizio e fine casuali per il task
        const oggi = new Date();
        const inizio = new Date();
        inizio.setDate(oggi.getDate() + Math.floor(Math.random() * 10)); // Inizia nei prossimi 10 giorni
        
        const fine = new Date(inizio);
        fine.setDate(inizio.getDate() + Math.floor(Math.random() * 20) + 5); // Dura tra 5 e 25 giorni
        
        // Aggiorna il task con i nuovi dati
        await task.update({
          durataPrevista,
          numeroRisorse,
          skills,
          dataInizio: inizio,
          dataFine: fine
        });
        
        updateCount++;
        
        if (updateCount % 5 === 0 || updateCount === tasks.length) {
          console.log(`Aggiornati ${updateCount}/${tasks.length} task`);
        }
      } catch (taskError) {
        console.error(`Errore durante l'aggiornamento del task ID ${task.id}:`, taskError);
      }
    }

    console.log('✅ Tutti i task sono stati aggiornati con dati di esempio per i nuovi campi!');

  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento dei task:', error);
  } finally {
    await sequelize.close();
    console.log('Connessione al database chiusa');
  }
}

// Esegui la funzione
addSampleTaskData().catch(console.error);
