require('dotenv').config();
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
        dialect: dbConfig.dialect,
        dialectOptions: {
            connectTimeout: 60000
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 60000,
            idle: 10000
        }
    }
);

async function runMigrations() {
    try {
        console.log('Testing connection...');
        await sequelize.authenticate();
        console.log('Connection successful!');

        console.log('Running migrations...');
        const [results] = await sequelize.query('DROP TABLE IF EXISTS SequelizeMeta');
        console.log('Cleaned SequelizeMeta table');

        const { exec } = require('child_process');
        exec('npx sequelize-cli db:migrate', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

runMigrations();
