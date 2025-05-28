// migrations/20250521000000-create-task-dipendenti.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('task_dipendenti', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      taskId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      dipendenteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'dipendenti',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ruolo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Creazione indici per migliorare le performance
    await queryInterface.addIndex('task_dipendenti', ['taskId']);
    await queryInterface.addIndex('task_dipendenti', ['dipendenteId']);
    await queryInterface.addIndex('task_dipendenti', ['taskId', 'dipendenteId'], {
      unique: true,
      name: 'task_dipendenti_unique'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('task_dipendenti');
  }
};
