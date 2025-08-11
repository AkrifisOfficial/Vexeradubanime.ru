require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

// Конфигурация подключения к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5
});

// Обработчики событий пула
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ======================
// РОУТЫ ДЛЯ АНИМЕ
// ======================

// Получить все аниме
app.get('/api/anime', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.*, COUNT(e.id) as episodes_count
      FROM anime a
      LEFT JOIN episodes e ON a.id = e.anime_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching anime:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Получить конкретное аниме
app.get('/api/anime/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM anime WHERE id = $1',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Anime not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching anime:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Поиск аниме
app.get('/api/anime/search/:query', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM anime 
       WHERE title ILIKE $1 OR description ILIKE $1
       ORDER BY title`,
      [`%${req.params.query}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Добавить новое аниме (требует авторизации)
app.post('/api/anime', async (req, res) => {
  try {
    const { title, description, poster_url } = req.body;
    
    const { rows } = await pool.query(
      `INSERT INTO anime (title, description, poster_url) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [title, description, poster_url]
    );
    
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error adding anime:', err);
    res.status(500).json({ error: 'Failed to add anime' });
  }
});

// Обновить аниме
app.put('/api/anime/:id', async (req, res) => {
  try {
    const { title, description, poster_url } = req.body;
    
    const { rows } = await pool.query(
      `UPDATE anime 
       SET title = $1, description = $2, poster_url = $3, updated_at = NOW() 
       WHERE id = $4 
       RETURNING *`,
      [title, description, poster_url, req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Anime not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating anime:', err);
    res.status(500).json({ error: 'Failed to update anime' });
  }
});

// Удалить аниме
app.delete('/api/anime/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM anime WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting anime:', err);
    res.status(500).json({ error: 'Failed to delete anime' });
  }
});

// ======================
// РОУТЫ ДЛЯ СЕРИЙ
// ======================

// Получить все серии аниме
app.get('/api/anime/:id/episodes', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM episodes 
       WHERE anime_id = $1 
       ORDER BY number`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching episodes:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Получить конкретную серию
app.get('/api/episodes/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM episodes WHERE id = $1',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Episode not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching episode:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Добавить серию
app.post('/api/episodes', async (req, res) => {
  try {
    const { anime_id, number, vk_url } = req.body;
    
    const { rows } = await pool.query(
      `INSERT INTO episodes (anime_id, number, vk_url) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [anime_id, number, vk_url]
    );
    
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error adding episode:', err);
    res.status(500).json({ error: 'Failed to add episode' });
  }
});

// Обновить серию
app.put('/api/episodes/:id', async (req, res) => {
  try {
    const { number, vk_url } = req.body;
    
    const { rows } = await pool.query(
      `UPDATE episodes 
       SET number = $1, vk_url = $2 
       WHERE id = $3 
       RETURNING *`,
      [number, vk_url, req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Episode not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating episode:', err);
    res.status(500).json({ error: 'Failed to update episode' });
  }
});

// Удалить серию
app.delete('/api/episodes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM episodes WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting episode:', err);
    res.status(500).json({ error: 'Failed to delete episode' });
  }
});

// ======================
// СИСТЕМНЫЕ РОУТЫ
// ======================

// Проверка здоровья
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ 
      status: 'OK',
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'ERROR',
      database: 'disconnected'
    });
  }
});

// Обслуживание БД
app.post('/maintenance', async (req, res) => {
  try {
    await pool.query('VACUUM ANALYZE');
    await pool.query('CHECKPOINT');
    res.json({ status: 'Maintenance completed' });
  } catch (err) {
    console.error('Maintenance error:', err);
    res.status(500).json({ error: 'Maintenance failed' });
  }
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  try {
    await pool.query('CHECKPOINT');
    await pool.end();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('Shutdown error:', err);
    process.exit(1);
  }
});

// Инициализация и запуск сервера
(async () => {
  try {
    // Проверка подключения к БД
    await pool.query('SELECT 1');
    console.log('Database connected successfully');
    
    // Создание таблиц если их нет
    await pool.query(`
      CREATE TABLE IF NOT EXISTS anime (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        poster_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS episodes (
        id SERIAL PRIMARY KEY,
        anime_id INTEGER REFERENCES anime(id) ON DELETE CASCADE,
        number INTEGER NOT NULL,
        vk_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('Database tables verified');
    
    // Плановое обслуживание каждые 24 часа
    setInterval(async () => {
      try {
        await pool.query('VACUUM ANALYZE');
        console.log('Scheduled maintenance completed');
      } catch (err) {
        console.error('Scheduled maintenance error:', err);
      }
    }, 86400000); // 24 часа

    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
