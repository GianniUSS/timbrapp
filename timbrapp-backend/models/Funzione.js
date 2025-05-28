const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Funzione extends Model {
    static setupAssociations(models) {
      const { Skill, Task } = models;
      
      // Associazioni tra Funzione e Skill (molti-a-molti)
      if (Skill) {
        Funzione.belongsToMany(Skill, {
          through: 'FunzioneSkill',
          foreignKey: 'funzioneId',
          otherKey: 'skillId',
        });
      }
      
      // Associazione Funzione -> Task
      if (Task) {
        Funzione.hasMany(Task, {
          foreignKey: 'funzioneId',
        });
      }
    }
  }

  Funzione.init(
    {
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      descrizione: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Funzione',
      tableName: 'funzioni',
      timestamps: true,
    }
  );

  return Funzione;
};
