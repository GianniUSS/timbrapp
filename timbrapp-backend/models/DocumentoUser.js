const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class DocumentoUser extends Model {
    static setupAssociations(models) {
      const { User, TipologiaDocumento } = models;
      
      if (User) {
        DocumentoUser.belongsTo(User, { foreignKey: 'userId', as: 'user' });
      }
      
      if (TipologiaDocumento) {
        DocumentoUser.belongsTo(TipologiaDocumento, { foreignKey: 'tipologiaId', as: 'tipologia' });
      }
    }
  }
  
  DocumentoUser.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tipologiaId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    stato_lettura: {
      type: DataTypes.ENUM('letto', 'non letto'),
      allowNull: false,
      defaultValue: 'non letto'
    }  
  }, {
    sequelize,
    modelName: 'DocumentoUser',
    tableName: 'documentiuser',
    timestamps: true
  });
  
  return DocumentoUser;
};