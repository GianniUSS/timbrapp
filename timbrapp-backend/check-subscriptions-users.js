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

async function checkSubscriptionsTable() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Verifica struttura della tabella subscriptions
        const [subscriptionsStructure] = await sequelize.query(`
            DESCRIBE subscriptions;
        `);
        console.log('\nStructure of subscriptions table:');
        console.log(subscriptionsStructure);

        // Verifica struttura della tabella users
        const [usersStructure] = await sequelize.query(`
            DESCRIBE users;
        `);
        console.log('\nStructure of users table:');
        console.log(usersStructure);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkSubscriptionsTable();
