require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

// Конфигурация подключения с обработкой ошибок
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
};

const pool = new Pool(poolConfig);

// Обработчик ошибок пула
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Проверка подключения с ретраями
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('Database connection test failed:', err);
    return false;
  } finally {
    if (client) client.release();
  }
}
