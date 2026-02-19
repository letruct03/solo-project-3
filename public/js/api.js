// js/api.js - Frontend API service layer

const API_BASE = '/api';

const API = {
  // GET /api/movies with full filter/sort/page support
  async getMovies(page = 1, genre = '', status = '', search = '', sortBy = 'dateAdded', sortDir = 'desc', perPage = 10) {
    const params = new URLSearchParams({ page, perPage, genre, status, search, sortBy, sortDir });
    const res = await fetch(`${API_BASE}/movies?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  // GET /api/movies/:id
  async getMovie(id) {
    const res = await fetch(`${API_BASE}/movies/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  // GET /api/genres
  async getGenres() {
    const res = await fetch(`${API_BASE}/genres`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  // GET /api/stats
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  // POST /api/movies
  async createMovie(data) {
    const res = await fetch(`${API_BASE}/movies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // PUT /api/movies/:id
  async updateMovie(id, data) {
    const res = await fetch(`${API_BASE}/movies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // DELETE /api/movies/:id
  async deleteMovie(id) {
    const res = await fetch(`${API_BASE}/movies/${id}`, { method: 'DELETE' });
    return res.json();
  }
};

// ── Cookie helpers ────────────────────────────────────────────────────────────
const Cookies = {
  set(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
  },
  get(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }
};
