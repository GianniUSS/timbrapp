// Migration per creare la tabella tasks
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fix: elimina la tabella se esiste già (per forzare la ricreazione pulita)
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS tasks');
    // Fix: elimina il tipo ENUM se esiste già (MySQL non lo fa in automatico)
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS 'enum_tasks_stato'").catch(() => {});
    await queryInterface.createTable('tasks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Nome del task/attività'
      },
      descrizione: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Descrizione dettagliata del task'
      },
      commessaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'commesse',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'Collegamento alla commessa di riferimento'
      },
      stato: {
        type: Sequelize.ENUM('attivo', 'completato', 'annullato'),
        allowNull: false,
        defaultValue: 'attivo',
        comment: 'Stato del task'
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
    await queryInterface.dropTable('tasks');
  }
};
