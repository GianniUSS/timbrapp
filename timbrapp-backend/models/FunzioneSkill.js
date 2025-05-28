const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class FunzioneSkill extends Model {
    static setupAssociations(models) {
      // Non ha bisogno di associazioni proprie, poiché è una tabella di join
    }
  }

  FunzioneSkill.init(
    {
      funzioneId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'funzioni', // nome tabella minuscolo
          key: 'id',
        },
      },
      skillId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'skill', // nome tabella minuscolo
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'FunzioneSkill',
      tableName: 'funzioneskill',
      timestamps: true,
    }
  );

  return FunzioneSkill;
};
