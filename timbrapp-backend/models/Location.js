// timbrapp-backend/models/Location.js
const { Model, DataTypes } = require('sequelize');

/**
 * Modello Location
 * Rappresenta la sede di una commessa
 */
module.exports = (sequelize) => {
  class Location extends Model {
    // La funzione setupAssociations verrà chiamata dopo che tutti i modelli sono stati definiti
    static setupAssociations(models) {
      const { Commessa } = models;
      // Associazione con Commessa (una location appartiene a una commessa)
      if (Commessa) {
        Location.belongsTo(Commessa, { foreignKey: 'commessaId', as: 'commessa' });
      }
    }
  }
  
  Location.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    commessaId: { type: DataTypes.INTEGER, allowNull: false },
    nome: { type: DataTypes.STRING, allowNull: false, comment: 'Nome della location' },
    indirizzo: { type: DataTypes.STRING, allowNull: true, comment: 'Indirizzo della location' },
    lat: { type: DataTypes.DECIMAL(10, 6), allowNull: true, comment: 'Latitudine' },
    lng: { type: DataTypes.DECIMAL(10, 6), allowNull: true, comment: 'Longitudine' }
  }, {
    sequelize,
    modelName: 'Location',
    tableName: 'locations',
    timestamps: false
  });
  
  return Location;
};
