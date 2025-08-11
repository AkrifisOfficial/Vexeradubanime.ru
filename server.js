require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { Pool } = require('pg');

const app = express();

// Подключение к PostgreSQL из Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Проверка подключения к БД
pool.connect((err, client, done) => {
  if (err) {
    console.error('Ошибка подключения к PostgreSQL:', err);
  } else {
    console.log('Успешное подключение к PostgreSQL');
    // Создание таблиц при первом запуске
    initializeDatabase();
  }
});

async function initializeDatabase() {
  try {
    // Создание таблицы аниме
    await pool.query(`
      CREATE TABLE IF NOT EXISTS anime (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        poster_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Создание таблицы серий
    await pool.query(`
      CREATE TABLE IF NOT EXISTS episodes (
        id SERIAL PRIMARY KEY,
        anime_id INTEGER REFERENCES anime(id) ON DELETE CASCADE,
        number INTEGER NOT NULL,
        vk_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Таблицы успешно созданы или уже существуют');
  } catch (err) {
    console.error('Ошибка при инициализации базы данных:', err);
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Получить все аниме с количеством серий
app.get('/api/anime', async (req, res) => {
  try {
    const { rows: animeRows } = await pool.query(`
      SELECT a.*, COUNT(e.id) as episodes_count
      FROM anime a
      LEFT JOIN episodes e ON a.id = e.anime_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);
    res.json(animeRows);
  } catch (err) {
    console.error('Ошибка при получении аниме:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Добавить новое аниме
app.post('/api/anime', async (req, res) => {
  const { title, description, poster } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO anime (title, description, poster_url) VALUES ($1, $2, $3) RETURNING *',
      [title, description, poster]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Ошибка при добавлении аниме:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Удалить аниме
app.delete('/api/anime/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await pool.query('DELETE FROM anime WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Ошибка при удалении аниме:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить серии для аниме
app.get('/api/anime/:id/episodes', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { rows } = await pool.query(
      'SELECT * FROM episodes WHERE anime_id = $1 ORDER BY number',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при получении серий:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Добавить серию
app.post('/api/episodes', async (req, res) => {
  const { animeId, number, vkUrl } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO episodes (anime_id, number, vk_url) VALUES ($1, $2, $3) RETURNING *',
      [animeId, number, vkUrl]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Ошибка при добавлении серии:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Удалить серию
app.delete('/api/episodes/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await pool.query('DELETE FROM episodes WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Ошибка при удалении серии:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
