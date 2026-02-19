// js/app.js - Main application logic
// Features: cookie page size, sorting, search, filter, pagination, images

const PAGE_SIZE_COOKIE = 'moviePageSize';
const PLACEHOLDER_IMG  = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="160" viewBox="0 0 300 160"%3E%3Crect width="300" height="160" fill="%23e2e8f0"/%3E%3Ctext x="150" y="80" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8"%3E🎬 No Image%3C/text%3E%3C/svg%3E';

let state = {
  page: 1,
  perPage: parseInt(Cookies.get(PAGE_SIZE_COOKIE) || '10'),
  genre: '',
  status: '',
  search: '',
  sortBy: 'dateAdded',
  sortDir: 'desc',
  pagination: null
};

document.addEventListener('DOMContentLoaded', function () {
  initControls();
  populateGenreFilter();
  loadMovies();
});

// ── Init Controls ─────────────────────────────────────────────────────────────
function initControls() {
  // Page size selector - restore from cookie
  const pageSizeEl = document.getElementById('pageSizeSelect');
  if (pageSizeEl) {
    pageSizeEl.value = state.perPage;
    pageSizeEl.addEventListener('change', () => {
      state.perPage = parseInt(pageSizeEl.value);
      state.page = 1;
      Cookies.set(PAGE_SIZE_COOKIE, state.perPage);
      loadMovies();
    });
  }

  document.getElementById('genreFilter')?.addEventListener('change', applyFilters);
  document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
  document.getElementById('sortBySelect')?.addEventListener('change', applyFilters);
  document.getElementById('sortDirSelect')?.addEventListener('change', applyFilters);
  document.getElementById('clearFilters')?.addEventListener('click', clearFilters);

  // Search - debounced
  const searchEl = document.getElementById('searchInput');
  if (searchEl) {
    let timer;
    searchEl.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(applyFilters, 350);
    });
  }
}

// ── Load Movies ───────────────────────────────────────────────────────────────
async function loadMovies() {
  showLoading(true);
  hideError();

  try {
    const result = await API.getMovies(
      state.page, state.genre, state.status,
      state.search, state.sortBy, state.sortDir, state.perPage
    );

    if (result.success) {
      state.pagination = result.data.pagination;
      displayMovies(result.data.movies);
      displayPagination(state.pagination);
    } else {
      showError('Failed to load movies. Please try again.');
    }
  } catch (err) {
    showError('Error: ' + err.message);
  } finally {
    showLoading(false);
  }
}

// ── Display Movies ────────────────────────────────────────────────────────────
function displayMovies(movies) {
  const grid = document.getElementById('moviesGrid');

  if (!movies.length) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🎬</div>
        <p>No movies found.</p>
        <p class="no-results-sub">Try adjusting your filters or <a href="add.html">add a new movie</a>.</p>
      </div>`;
    return;
  }

  grid.innerHTML = movies.map(movie => {
    const statusClass = 'status-' + (movie.watchStatus || '').toLowerCase().replace(/\s+/g, '-');
    const shortNotes = movie.reviewNotes
      ? `"${escapeHtml(movie.reviewNotes.substring(0, 100))}${movie.reviewNotes.length > 100 ? '…' : ''}"`
      : '';

    return `
      <div class="movie-card">
        <div class="movie-poster">
          <img
            src="${escapeHtml(movie.imageUrl || PLACEHOLDER_IMG)}"
            alt="${escapeHtml(movie.title)} poster"
            loading="lazy"
            onerror="this.src='${PLACEHOLDER_IMG}'"
          />
        </div>
        <div class="movie-body">
          <h3 title="${escapeHtml(movie.title)}">${escapeHtml(movie.title)}</h3>
          <p class="movie-meta">
            <strong>${escapeHtml(movie.director || 'Unknown Director')}</strong>
            ${movie.releaseYear ? `<span class="year">(${movie.releaseYear})</span>` : ''}
          </p>
          <div class="movie-tags">
            ${movie.genre ? `<span class="tag tag-genre">${escapeHtml(movie.genre)}</span>` : ''}
            ${movie.runtime ? `<span class="tag tag-runtime">⏱ ${movie.runtime} min</span>` : ''}
          </div>
          <div class="movie-status">
            <span class="status-badge ${statusClass}">${escapeHtml(movie.watchStatus)}</span>
          </div>
          ${movie.personalRating != null ? `
            <div class="movie-rating">⭐ ${movie.personalRating}<span class="rating-max">/10</span></div>
          ` : ''}
          ${shortNotes ? `<p class="movie-review">${shortNotes}</p>` : ''}
          <div class="movie-actions">
            <a href="edit.html?id=${movie.id}" class="btn btn-small">✏️ Edit</a>
            <button onclick="deleteMovie(${movie.id}, '${escapeHtml(movie.title).replace(/'/g, "\\'")}')" class="btn btn-small btn-danger">🗑 Delete</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Pagination ────────────────────────────────────────────────────────────────
function displayPagination(p) {
  const container = document.getElementById('paginationControls');
  if (!p || p.totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '<div class="pagination">';
  html += `<button onclick="goToPage(${p.currentPage - 1})" class="btn btn-small" ${!p.hasPrev ? 'disabled' : ''}>← Prev</button>`;

  // Page number buttons (show up to 5 around current)
  const start = Math.max(1, p.currentPage - 2);
  const end   = Math.min(p.totalPages, p.currentPage + 2);
  if (start > 1) html += `<button onclick="goToPage(1)" class="btn btn-small btn-page">1</button>${start > 2 ? '<span class="page-ellipsis">…</span>' : ''}`;
  for (let i = start; i <= end; i++) {
    html += `<button onclick="goToPage(${i})" class="btn btn-small btn-page ${i === p.currentPage ? 'active' : ''}">${i}</button>`;
  }
  if (end < p.totalPages) html += `${end < p.totalPages - 1 ? '<span class="page-ellipsis">…</span>' : ''}<button onclick="goToPage(${p.totalPages})" class="btn btn-small btn-page">${p.totalPages}</button>`;

  html += `<button onclick="goToPage(${p.currentPage + 1})" class="btn btn-small" ${!p.hasNext ? 'disabled' : ''}>Next →</button>`;
  html += `<span class="page-info">${p.totalRecords} movies · Page ${p.currentPage}/${p.totalPages} · ${p.perPage}/page</span>`;
  html += '</div>';
  container.innerHTML = html;
}

function goToPage(page) {
  state.page = page;
  loadMovies();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Genre Filter ──────────────────────────────────────────────────────────────
async function populateGenreFilter() {
  try {
    const result = await API.getGenres();
    if (!result.success) return;
    const select = document.getElementById('genreFilter');
    result.data.forEach(genre => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = genre;
      select.appendChild(opt);
    });
  } catch (e) { /* silent */ }
}

// ── Filters / Sort ────────────────────────────────────────────────────────────
function applyFilters() {
  state.genre   = document.getElementById('genreFilter')?.value   || '';
  state.status  = document.getElementById('statusFilter')?.value  || '';
  state.search  = document.getElementById('searchInput')?.value   || '';
  state.sortBy  = document.getElementById('sortBySelect')?.value  || 'dateAdded';
  state.sortDir = document.getElementById('sortDirSelect')?.value || 'desc';
  state.page = 1;
  loadMovies();
}

function clearFilters() {
  document.getElementById('genreFilter').value  = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('searchInput').value  = '';
  document.getElementById('sortBySelect').value  = 'dateAdded';
  document.getElementById('sortDirSelect').value = 'desc';
  state.genre = ''; state.status = ''; state.search = '';
  state.sortBy = 'dateAdded'; state.sortDir = 'desc';
  state.page = 1;
  loadMovies();
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteMovie(id, title) {
  if (!confirm(`Delete "${title}"?\n\nThis action cannot be undone.`)) return;
  showLoading(true);
  try {
    const result = await API.deleteMovie(id);
    if (result.success) {
      // Go back a page if we deleted the last item
      const moviesOnPage = document.querySelectorAll('.movie-card').length;
      if (moviesOnPage === 1 && state.page > 1) state.page--;
      loadMovies();
    } else {
      showError('Failed to delete movie.');
    }
  } catch (e) {
    showError('Error: ' + e.message);
  } finally {
    showLoading(false);
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function showLoading(show) {
  document.getElementById('loadingIndicator').style.display = show ? 'flex' : 'none';
}
function showError(msg) {
  const c = document.getElementById('errorContainer');
  c.innerHTML = `<div class="alert alert-error">${msg}</div>`;
  setTimeout(() => { c.innerHTML = ''; }, 6000);
}
function hideError() { document.getElementById('errorContainer').innerHTML = ''; }

function escapeHtml(t) {
  if (!t && t !== 0) return '';
  const d = document.createElement('div');
  d.textContent = String(t);
  return d.innerHTML;
}
