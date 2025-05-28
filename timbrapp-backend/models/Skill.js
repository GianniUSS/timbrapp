const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Skill extends Model {
    static setupAssociations(models) {
      const { Funzione } = models;
      
      if (Funzione) {
        Skill.belongsToMany(Funzione, {
          through: 'FunzioneSkill',
          foreignKey: 'skillId',
          otherKey: 'funzioneId',
        });
      }
    }
  }

  Skill.init(
    {
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Skill',
      tableName: 'skill',
      timestamps: true,
    }
  );

  return Skill;
};
