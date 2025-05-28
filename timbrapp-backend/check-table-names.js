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

async function checkTableNames() {
    try {
        // Test connection
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Get all tables
        const [results] = await sequelize.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = '${dbConfig.database}';
        `);
        
        console.log('\nTables in database (exact case):');
        results.forEach(result => {
            console.log(result.TABLE_NAME);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkTableNames();