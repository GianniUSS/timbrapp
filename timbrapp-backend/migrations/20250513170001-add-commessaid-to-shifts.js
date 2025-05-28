// Migration: aggiunge la colonna commessaId a shifts
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('shifts', 'commessaId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'commesse',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('shifts', 'commessaId');
  }
};
