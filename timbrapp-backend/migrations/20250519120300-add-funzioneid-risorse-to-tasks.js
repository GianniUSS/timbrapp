'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Tasks', 'funzioneId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Funzioni',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
    await queryInterface.addColumn('Tasks', 'risorseNecessarie', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Tasks', 'funzioneId');
    await queryInterface.removeColumn('Tasks', 'risorseNecessarie');
  }
};
