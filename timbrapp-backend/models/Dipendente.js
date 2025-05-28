const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Dipendente extends Model {}
  Dipendente.init(
    {
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cognome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      telefono: {
        type: DataTypes.STRING,
        allowNull: true,
      },      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },      ruolo: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Altro',
      },
      skills: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      sequelize,
      modelName: 'Dipendente',
      tableName: 'dipendenti',
      timestamps: true,
    }
  );
  return Dipendente;
};
