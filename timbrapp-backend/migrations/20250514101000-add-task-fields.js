// migrations/20250514101000-add-task-fields.js
'use strict';

/**
 * Migration per aggiungere campi aggiuntivi alla tabella dei task
 * - durataPrevista: durata prevista del task in ore
 * - numeroRisorse: numero di risorse richieste per il task
 * - skills: competenze necessarie per svolgere il task
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tasks', 'durataPrevista', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Durata prevista del task in ore'
    });
    
    await queryInterface.addColumn('tasks', 'numeroRisorse', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: 'Numero di risorse necessarie per il task'
    });
    
    await queryInterface.addColumn('tasks', 'skills', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Competenze richieste per il task (array di skills)'
    });
    
    await queryInterface.addColumn('tasks', 'dataInizio', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Data di inizio pianificata del task'
    });
    
    await queryInterface.addColumn('tasks', 'dataFine', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Data di fine pianificata del task'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tasks', 'durataPrevista');
    await queryInterface.removeColumn('tasks', 'numeroRisorse');
    await queryInterface.removeColumn('tasks', 'skills');
    await queryInterface.removeColumn('tasks', 'dataInizio');
    await queryInterface.removeColumn('tasks', 'dataFine');
  }
};
