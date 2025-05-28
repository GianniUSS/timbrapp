const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class TipologiaDocumento extends Model {
    static setupAssociations(models) {
      const { DocumentoUser } = models;
      
      if (DocumentoUser) {
        TipologiaDocumento.hasMany(DocumentoUser, { foreignKey: 'tipologiaId', as: 'documenti' });
      }
    }
  }
  
  TipologiaDocumento.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }  
  }, {
    sequelize,
    modelName: 'TipologiaDocumento',
    tableName: 'tipologiedocumento',
    timestamps: true
  });
  
  return TipologiaDocumento;
};