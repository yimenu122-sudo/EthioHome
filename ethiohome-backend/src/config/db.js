/**
 * @file db.js
 * @description PostgreSQL Connection using Sequelize (Production Ready)
 * @author Senior Node.js Developer
 */

const { Sequelize, QueryTypes } = require('sequelize');
const { Pool } = require('pg');
const { 
  DB_NAME, 
  DB_USER, 
  DB_PASSWORD, 
  DB_HOST, 
  DB_PORT, 
  DB_SSL,
  NODE_ENV 
} = require('./env');

/**
 * 1️⃣ SEQUELIZE INSTANCE (For ORM features if needed)
 */
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: DB_SSL ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

/**
 * 2️⃣ PG POOL (For raw SQL models as requested)
 */
const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
  port: DB_PORT,
  ssl: DB_SSL ? { rejectUnauthorized: false } : false,
  max: 20, // Higher limit for raw queries
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * 3️⃣ CONNECTION TEST FUNCTION
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully (Sequelize + Pool)');
    client.release();
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL database:', error.message);
    throw error;
  }
};

module.exports = { 
  sequelize, 
  pool,
  connectDB 
};
