// timbrapp-backend/sequelize.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    dialect:  'mysql',
    logging:  false,
  }
);

module.exports = sequelize;
