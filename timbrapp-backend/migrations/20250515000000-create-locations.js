'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('locations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      commessaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'commesse', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false
      },
      indirizzo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lat: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: true
      },
      lng: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: true
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('locations');
  }
};
