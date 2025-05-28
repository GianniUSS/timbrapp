const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  class User extends Model {
    // helper per creare un utente con hash
    static async register(email, plainPassword, nome, role = 'user') {
      const hash = await bcrypt.hash(plainPassword, 10);
      return this.create({ nome, email, passwordHash: hash, role });
    }

    // helper per verificare password
    async verifyPassword(plain) {
      return bcrypt.compare(plain, this.passwordHash);
    }

    // Configurazione delle associazioni con il nuovo sistema
    static setupAssociations(models) {
      const { Notification, Timbratura, Request, DocumentoUser } = models;
      
      User.hasMany(Notification, { foreignKey: 'userId' });
      User.hasMany(Timbratura, { foreignKey: 'userId' });
      User.hasMany(Request, { foreignKey: 'userId' });
      User.hasMany(DocumentoUser, { foreignKey: 'userId' });
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { isEmail: true }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'user'
    }
  }, {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    timestamps: true
  });

  return User;
};
