// Migration per creare la tabella commesse
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('commesse', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      codice: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Codice identificativo della commessa'
      },
      descrizione: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Descrizione della commessa'
      },
      cliente: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Nome del cliente'
      },
      dataInizio: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Data di inizio della commessa'
      },
      dataFine: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Data di fine della commessa (opzionale)'
      },
      budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Budget allocato per la commessa'
      },
      stato: {
        type: Sequelize.ENUM('attiva', 'completata', 'sospesa', 'annullata'),
        allowNull: false,
        defaultValue: 'attiva',
        comment: 'Stato corrente della commessa'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('commesse');
  }
};
