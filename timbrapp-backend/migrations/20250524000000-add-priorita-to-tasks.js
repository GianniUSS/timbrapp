// migration per aggiungere il campo priorita alla tabella tasks
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tasks', 'priorita', {
      type: Sequelize.ENUM('bassa', 'media', 'alta', 'urgente'),
      allowNull: false,
      defaultValue: 'media',
      after: 'funzioneId', // posiziona la colonna dopo funzioneId
    });
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tasks', 'priorita');
    return Promise.resolve();
  }
};
