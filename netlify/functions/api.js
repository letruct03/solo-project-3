// netlify/functions/api.js
// Solo Project 3 - Movie Collection Manager
// Backend: Node.js Serverless | Database: PostgreSQL (Neon)

const { Client } = require('pg');

// Module-level flag — only initialize DB schema+seed once per cold start
let dbInitialized = false;

// CORS headers
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Create DB client — use verify-full to match pg v8 actual behavior and silence warning
function getClient() {
  // Replace sslmode=require with sslmode=verify-full in the connection string
  const connStr = (process.env.DATABASE_URL || '').replace('sslmode=require', 'sslmode=verify-full');
  return new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });
}

// Run a query with automatic connect/disconnect
async function query(sql, params = []) {
  const client = getClient();
  await client.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    await client.end();
  }
}

// Initialize DB schema + seed data — only runs once per Lambda cold start
async function initDB() {
  if (dbInitialized) return;

  await query(`
    CREATE TABLE IF NOT EXISTS movies (
      id         SERIAL PRIMARY KEY,
      title      VARCHAR(255) NOT NULL,
      director   VARCHAR(255),
      release_year INT CHECK (release_year BETWEEN 1888 AND 2030),
      genre      VARCHAR(100),
      runtime    INT CHECK (runtime > 0),
      watch_status VARCHAR(50) DEFAULT 'Want to Watch',
      personal_rating NUMERIC(3,1) CHECK (personal_rating BETWEEN 0 AND 10),
      review_notes TEXT,
      image_url  TEXT,
      date_added TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT movies_title_unique UNIQUE (title)
    )
  `);
  // Add unique constraint to existing tables that were created without it
  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'movies_title_unique'
      ) THEN
        ALTER TABLE movies ADD CONSTRAINT movies_title_unique UNIQUE (title);
      END IF;
    END $$;
  `);

  // Seed only if empty
  const { rows } = await query('SELECT COUNT(*) AS cnt FROM movies');
  if (parseInt(rows[0].cnt) === 0) {
    const seed = [
      ['Dune: Part Two', 'Denis Villeneuve', 2024, 'Sci-Fi', 166, 'Completed', 9.2, 'Epic continuation of the saga. Stunning visuals and performances.', 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg'],
      ['The Wild Robot', 'Chris Sanders', 2024, 'Animation', 102, 'Completed', 8.8, 'Heartwarming story about a robot adapting to nature.', 'https://image.tmdb.org/t/p/w500/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg'],
      ['Inside Out 2', 'Kelsey Mann', 2024, 'Animation', 96, 'Completed', 8.5, 'Excellent sequel exploring teenage emotions.', 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg'],
      ['Deadpool & Wolverine', 'Shawn Levy', 2024, 'Action', 128, 'Completed', 8.3, 'Hilarious team-up with great chemistry.', 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg'],
      ['Wicked', 'Jon M. Chu', 2024, 'Musical', 160, 'Completed', 8.9, 'Stunning musical adaptation. Cynthia and Ariana are perfect.', 'https://image.tmdb.org/t/p/w500/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg'],
      ['Gladiator II', 'Ridley Scott', 2024, 'Action', 148, 'Completed', 8.0, 'Solid sequel with impressive action sequences.', 'https://image.tmdb.org/t/p/w500/f9iJgbVsHFMBqlNTDe4kJ5jhBgo.jpg'],
      ['A Quiet Place: Day One', 'Michael Sarnoski', 2024, 'Horror', 99, 'Completed', 7.8, 'Tense prequel showing the invasion beginning.', 'https://image.tmdb.org/t/p/w500/yrpPYKijwdMHyTGIOd1iK1h0Xno.jpg'],
      ['Furiosa: A Mad Max Saga', 'George Miller', 2024, 'Action', 148, 'Watching', 8.4, 'Anya Taylor-Joy is phenomenal as young Furiosa.', 'https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg'],
      ['Twisters', 'Lee Isaac Chung', 2024, 'Action', 122, 'Completed', 7.5, 'Fun summer blockbuster with great storm effects.', 'https://image.tmdb.org/t/p/w500/pjscCCCyBGGOz5XtbEUAMvWBRFW.jpg'],
      ['Nosferatu', 'Robert Eggers', 2024, 'Horror', 132, 'Want to Watch', null, '', 'https://image.tmdb.org/t/p/w500/5qGIxdEO841C0tdY8vOdLoRVrr0.jpg'],
      ['Beetlejuice Beetlejuice', 'Tim Burton', 2024, 'Comedy', 104, 'Completed', 7.9, 'Nostalgic fun with classic Burton weirdness.', 'https://image.tmdb.org/t/p/w500/b49ISsGkiHfzRkE3D5QGOeEXJEl.jpg'],
      ['The Fall Guy', 'David Leitch', 2024, 'Action', 126, 'Completed', 7.6, 'Ryan Gosling brings charm to action-comedy.', 'https://image.tmdb.org/t/p/w500/tSz1qsmSJon0rqjHBxXZmrotUQd.jpg'],
      ['Oppenheimer', 'Christopher Nolan', 2023, 'Drama', 180, 'Completed', 9.5, 'Masterpiece. Cillian Murphy performance is incredible.', 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'],
      ['Civil War', 'Alex Garland', 2024, 'Thriller', 109, 'Completed', 8.2, 'Intense journalism thriller with thought-provoking themes.', 'https://image.tmdb.org/t/p/w500/sh7Rg8Er3tFcN9BpKIPU9xFr4ua.jpg'],
      ['Bad Boys: Ride or Die', 'Adil El Arbi', 2024, 'Action', 115, 'Completed', 7.4, 'Will Smith and Martin Lawrence still have it.', 'https://image.tmdb.org/t/p/w500/oGythE98MYleE6mZlGs5oBGkux1.jpg'],
      ['Longlegs', 'Osgood Perkins', 2024, 'Horror', 101, 'Completed', 8.1, 'Nicolas Cage delivers a creepy performance.', 'https://image.tmdb.org/t/p/w500/kwh7A01JzPWtCKOGkJfXMXCjuUo.jpg'],
      ['Kung Fu Panda 4', 'Mike Mitchell', 2024, 'Animation', 94, 'Completed', 7.3, 'Fun addition to the franchise for kids.', 'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg'],
      ['Challengers', 'Luca Guadagnino', 2024, 'Romance', 131, 'Watching', 8.0, 'Stylish love triangle drama with tennis backdrop.', 'https://image.tmdb.org/t/p/w500/H0bHFpHmGCxBCZjGNkMzaerJJjI.jpg'],
      ['The Substance', 'Coralie Fargeat', 2024, 'Horror', 140, 'Completed', 8.6, 'Demi Moore is fearless. Body horror at its finest.', 'https://image.tmdb.org/t/p/w500/lqoMzCcZYEFK729d6qzt349fB4o.jpg'],
      ['Moana 2', 'David Derrick Jr.', 2024, 'Animation', 100, 'Completed', 7.7, 'Beautiful animation and catchy songs.', 'https://image.tmdb.org/t/p/w500/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg'],
      ['Alien: Romulus', 'Fede Alvarez', 2024, 'Horror', 119, 'Completed', 8.3, 'Return to form for the Alien franchise.', 'https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg'],
      ['Smile 2', 'Parker Finn', 2024, 'Horror', 127, 'Want to Watch', null, '', 'https://image.tmdb.org/t/p/w500/ht8Uv9QPv9y7K0RygTp4rYjBVwf.jpg'],
      ['Wicked Little Letters', 'Thea Sharrock', 2024, 'Comedy', 100, 'Completed', 7.8, 'Olivia Colman is delightful in this mystery comedy.', 'https://image.tmdb.org/t/p/w500/n3nASFUDWl3zq8I3eJPsm23FpyT.jpg'],
      ['The Beekeeper', 'David Ayer', 2024, 'Action', 105, 'Completed', 7.1, 'Jason Statham doing what he does best.', 'https://image.tmdb.org/t/p/w500/A7EByudX0eOzlkQ2FIbogzyazm2.jpg'],
      ['Mufasa: The Lion King', 'Barry Jenkins', 2024, 'Animation', 118, 'Want to Watch', null, '', 'https://image.tmdb.org/t/p/w500/lurEK87kukWNaHd0zYnsi3yzJrs.jpg'],
      ['The Apprentice', 'Ali Abbasi', 2024, 'Drama', 120, 'Watching', 7.6, 'Sebastian Stan transformation is impressive.', 'https://image.tmdb.org/t/p/w500/zMPOY3RQ4FRWQ3cHMcVFY7GsMuN.jpg'],
      ['Terrifier 3', 'Damien Leone', 2024, 'Horror', 125, 'Completed', 7.2, 'Not for the faint of heart. Extremely gory.', 'https://image.tmdb.org/t/p/w500/l1175hgL5DoXnqeZQCcU3eKGBaG.jpg'],
      ['Speak No Evil', 'James Watkins', 2024, 'Horror', 110, 'Completed', 7.9, 'Tense psychological thriller that keeps you on edge.', 'https://image.tmdb.org/t/p/w500/oVDLCMHAaGMC2pVBIIcbJVNdSFb.jpg'],
      ['Migration', 'Benjamin Renner', 2023, 'Animation', 83, 'Completed', 7.4, 'Charming family film about ducks migrating.', 'https://image.tmdb.org/t/p/w500/ldfCF9RhR40mppkzmftxapaHeTo.jpg'],
      ['Sonic the Hedgehog 3', 'Jeff Fowler', 2024, 'Action', 109, 'Want to Watch', null, '', 'https://image.tmdb.org/t/p/w500/d8Ryb8AunYAuycVKDp5HpdWPKgC.jpg'],
    ];

    for (const row of seed) {
      await query(
        `INSERT INTO movies (title, director, release_year, genre, runtime, watch_status, personal_rating, review_notes, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (title) DO NOTHING`,
        row
      );
    }
  }
  dbInitialized = true;
}

// Validate movie input
function validateMovie(data) {
  const errors = [];
  if (!data.title || !data.title.trim()) errors.push('Title is required');
  if (data.releaseYear && (data.releaseYear < 1888 || data.releaseYear > 2030)) errors.push('Release year must be between 1888 and 2030');
  if (data.runtime && data.runtime <= 0) errors.push('Runtime must be positive');
  if (data.personalRating !== null && data.personalRating !== undefined && (data.personalRating < 0 || data.personalRating > 10)) errors.push('Rating must be between 0 and 10');
  return errors;
}

// Map DB row to API object
function mapRow(row) {
  return {
    id: row.id,
    title: row.title,
    director: row.director || '',
    releaseYear: row.release_year,
    genre: row.genre || '',
    runtime: row.runtime,
    watchStatus: row.watch_status,
    personalRating: row.personal_rating !== null ? parseFloat(row.personal_rating) : null,
    reviewNotes: row.review_notes || '',
    imageUrl: row.image_url || '',
    dateAdded: row.date_added
  };
}

// ── Main Handler ─────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  try {
    await initDB();

    const method = event.httpMethod;
    const qs = event.queryStringParameters || {};

    // Derive path from event.path, stripping function/api prefixes
    // Works with both direct function calls and /api/* redirects
    const rawPath = (event.path || '')
      .replace('/.netlify/functions/api', '')
      .replace(/^\/api/, '')
      .replace(/^\/+/, '');
    const parts = rawPath.split('/').filter(Boolean);

    // ── GET /api/movies ──────────────────────────────────────────────────────
    if (method === 'GET' && parts[0] === 'movies' && !parts[1]) {
      const page    = Math.max(1, parseInt(qs.page  || '1'));
      const perPage = Math.min(50, Math.max(1, parseInt(qs.perPage || '10')));
      const genre   = qs.genre   || '';
      const status  = qs.status  || '';
      const search  = qs.search  || '';
      const sortBy  = qs.sortBy  || 'date_added';
      const sortDir = qs.sortDir === 'asc' ? 'ASC' : 'DESC';

      // Whitelist sortBy to prevent SQL injection
      const validSorts = { title: 'title', releaseYear: 'release_year', personalRating: 'personal_rating', runtime: 'runtime', dateAdded: 'date_added' };
      const safeSort = validSorts[sortBy] || 'date_added';

      const conditions = [];
      const params = [];

      if (genre) {
        params.push(genre);
        conditions.push(`genre = $${params.length}`);
      }
      if (status) {
        params.push(status);
        conditions.push(`watch_status = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(title ILIKE $${params.length} OR director ILIKE $${params.length})`);
      }

      const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

      // Count total
      const countResult = await query(`SELECT COUNT(*) AS cnt FROM movies ${where}`, params);
      const total = parseInt(countResult.rows[0].cnt);
      const totalPages = Math.ceil(total / perPage) || 1;
      const offset = (page - 1) * perPage;

      // Fetch page
      const dataResult = await query(
        `SELECT * FROM movies ${where} ORDER BY ${safeSort} ${sortDir} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, perPage, offset]
      );

      return {
        statusCode: 200, headers: HEADERS,
        body: JSON.stringify({
          success: true,
          data: {
            movies: dataResult.rows.map(mapRow),
            pagination: { currentPage: page, totalPages, totalRecords: total, perPage, hasNext: page < totalPages, hasPrev: page > 1 }
          }
        })
      };
    }

    // ── GET /api/movies/:id ──────────────────────────────────────────────────
    if (method === 'GET' && parts[0] === 'movies' && parts[1]) {
      const id = parseInt(parts[1]);
      const { rows } = await query('SELECT * FROM movies WHERE id = $1', [id]);
      if (!rows.length) return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ success: false, error: 'Movie not found' }) };
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ success: true, data: mapRow(rows[0]) }) };
    }

    // ── GET /api/genres ──────────────────────────────────────────────────────
    if (method === 'GET' && parts[0] === 'genres') {
      const { rows } = await query(`SELECT DISTINCT genre FROM movies WHERE genre IS NOT NULL AND genre != '' ORDER BY genre`);
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ success: true, data: rows.map(r => r.genre) }) };
    }

    // ── GET /api/stats ───────────────────────────────────────────────────────
    if (method === 'GET' && parts[0] === 'stats') {
      const [totals, genreRows, yearRows, ratingRow, runtimeRow] = await Promise.all([
        query(`SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE watch_status = 'Completed')     AS completed,
          COUNT(*) FILTER (WHERE watch_status = 'Watching')      AS watching,
          COUNT(*) FILTER (WHERE watch_status = 'Want to Watch') AS want_to_watch
        FROM movies`),
        query(`SELECT genre, COUNT(*) AS cnt FROM movies WHERE genre IS NOT NULL AND genre != '' GROUP BY genre ORDER BY cnt DESC`),
        query(`SELECT release_year, COUNT(*) AS cnt FROM movies WHERE release_year IS NOT NULL GROUP BY release_year ORDER BY release_year DESC`),
        query(`SELECT AVG(personal_rating) AS avg_rating FROM movies WHERE personal_rating IS NOT NULL`),
        query(`SELECT SUM(runtime) AS total_runtime FROM movies WHERE runtime IS NOT NULL`)
      ]);

      const t = totals.rows[0];
      const genreBreakdown = {};
      genreRows.rows.forEach(r => { genreBreakdown[r.genre] = parseInt(r.cnt); });
      const yearBreakdown = {};
      yearRows.rows.forEach(r => { yearBreakdown[r.release_year] = parseInt(r.cnt); });

      return {
        statusCode: 200, headers: HEADERS,
        body: JSON.stringify({
          success: true,
          data: {
            total: parseInt(t.total),
            completed: parseInt(t.completed),
            watching: parseInt(t.watching),
            wantToWatch: parseInt(t.want_to_watch),
            averageRating: ratingRow.rows[0].avg_rating ? parseFloat(parseFloat(ratingRow.rows[0].avg_rating).toFixed(1)) : null,
            totalRuntime: parseInt(runtimeRow.rows[0].total_runtime) || 0,
            genreBreakdown,
            yearBreakdown
          }
        })
      };
    }

    // ── POST /api/movies ─────────────────────────────────────────────────────
    if (method === 'POST' && parts[0] === 'movies') {
      const input = JSON.parse(event.body);
      const errors = validateMovie(input);
      if (errors.length) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ success: false, error: 'Validation failed', errors }) };

      const { rows } = await query(
        `INSERT INTO movies (title, director, release_year, genre, runtime, watch_status, personal_rating, review_notes, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          input.title.trim(),
          input.director?.trim() || null,
          input.releaseYear || null,
          input.genre?.trim() || null,
          input.runtime || null,
          input.watchStatus || 'Want to Watch',
          input.personalRating ?? null,
          input.reviewNotes?.trim() || null,
          input.imageUrl?.trim() || null
        ]
      );
      return { statusCode: 201, headers: HEADERS, body: JSON.stringify({ success: true, data: mapRow(rows[0]) }) };
    }

    // ── PUT /api/movies/:id ──────────────────────────────────────────────────
    if (method === 'PUT' && parts[0] === 'movies' && parts[1]) {
      const id = parseInt(parts[1]);
      const input = JSON.parse(event.body);
      const errors = validateMovie(input);
      if (errors.length) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ success: false, error: 'Validation failed', errors }) };

      const { rows } = await query(
        `UPDATE movies SET title=$1, director=$2, release_year=$3, genre=$4, runtime=$5, watch_status=$6, personal_rating=$7, review_notes=$8, image_url=$9
         WHERE id=$10 RETURNING *`,
        [
          input.title.trim(),
          input.director?.trim() || null,
          input.releaseYear || null,
          input.genre?.trim() || null,
          input.runtime || null,
          input.watchStatus || 'Want to Watch',
          input.personalRating ?? null,
          input.reviewNotes?.trim() || null,
          input.imageUrl?.trim() || null,
          id
        ]
      );
      if (!rows.length) return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ success: false, error: 'Movie not found' }) };
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ success: true, data: mapRow(rows[0]) }) };
    }

    // ── DELETE /api/movies/:id ───────────────────────────────────────────────
    if (method === 'DELETE' && parts[0] === 'movies' && parts[1]) {
      const id = parseInt(parts[1]);
      const { rowCount } = await query('DELETE FROM movies WHERE id = $1', [id]);
      if (!rowCount) return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ success: false, error: 'Movie not found' }) };
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ success: true, data: { message: 'Movie deleted' } }) };
    }

    return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ success: false, error: 'Endpoint not found' }) };

  } catch (err) {
    console.error('API Error:', err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
