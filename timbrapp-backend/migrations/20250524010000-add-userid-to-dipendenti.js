// migration per aggiungere il campo userId alla tabella dipendenti
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('dipendenti', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'telefono', // posiziona la colonna dopo telefono
    });
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('dipendenti', 'userId');
    return Promise.resolve();
  }
};
