'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('dipendenti', 'ruolo', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'Altro'
    });

    await queryInterface.addColumn('dipendenti', 'skills', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('dipendenti', 'ruolo');
    await queryInterface.removeColumn('dipendenti', 'skills');
    
    return Promise.resolve();
  }
};
