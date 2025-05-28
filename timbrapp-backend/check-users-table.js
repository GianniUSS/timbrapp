const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect
    }
);

async function checkUsersTable() {
    try {
        const [results] = await sequelize.query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${dbConfig.database}' 
            AND TABLE_NAME = 'Users';
        `);
        
        console.log('Users table structure:');
        console.log(results);

        const [createTable] = await sequelize.query(`SHOW CREATE TABLE users;`);
        console.log('CREATE TABLE users SQL:');
        console.log(createTable[0]['Create Table']);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkUsersTable();
