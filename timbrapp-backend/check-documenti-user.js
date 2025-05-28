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

async function checkDocumentiUserTable() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Get the structure of the DocumentiUser table
        const [columns] = await sequelize.query(`
            DESCRIBE documentiuser;
        `);
        
        console.log('\nStructure of documentiuser table:');
        console.log(columns);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkDocumentiUserTable();
