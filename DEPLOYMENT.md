# DEPLOYMENT.md - Solo Project 3: Movie Collection Manager

## 🌐 Live Application

**URL:** https://your-domain.com  
*(Replace with your actual custom domain after setup)*

---

## 🏷 Domain

- **Domain Name:** your-domain.com *(replace)*
- **Registrar:** Namecheap / Google Domains / Cloudflare *(update with yours)*
- **DNS / HTTPS:** Managed by Netlify (automatic Let's Encrypt SSL)

---

## 🖥 Hosting Provider

**Netlify** — Static site hosting with serverless functions

- Free tier supports custom domains, HTTPS, and serverless functions
- Frontend static files served from the `public/` directory
- Backend logic runs as Netlify Functions (Node.js)

---

## 🛠 Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | HTML5, CSS3, Vanilla JavaScript   |
| Backend   | Node.js (Netlify Serverless Functions) |
| Database  | PostgreSQL (hosted on Neon)       |
| Hosting   | Netlify                           |
| Domain    | Custom domain via registrar       |

---

## 🗄 Database

- **Type:** PostgreSQL
- **Provider:** [Neon](https://neon.tech) (serverless Postgres — free tier)
- **Schema:** Single `movies` table (auto-created on first request)
- **Seed data:** 30 movies inserted automatically when the table is empty

### Schema

```sql
CREATE TABLE movies (
  id             SERIAL PRIMARY KEY,
  title          VARCHAR(255) NOT NULL,
  director       VARCHAR(255),
  release_year   INT CHECK (release_year BETWEEN 1888 AND 2030),
  genre          VARCHAR(100),
  runtime        INT CHECK (runtime > 0),
  watch_status   VARCHAR(50) DEFAULT 'Want to Watch',
  personal_rating NUMERIC(3,1) CHECK (personal_rating BETWEEN 0 AND 10),
  review_notes   TEXT,
  image_url      TEXT,
  date_added     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 Configuration & Secrets

All secrets are stored as **Netlify Environment Variables** — never committed to Git.

### Required Environment Variable

| Variable       | Description                                  |
|----------------|----------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string from Neon       |

### How to set in Netlify

1. Go to **Site Settings → Environment Variables**
2. Add `DATABASE_URL` = your Neon connection string (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)

---

## 🚀 How to Deploy

### First-time setup

1. **Create a Neon account** at https://neon.tech and create a new project
2. Copy the connection string from your Neon dashboard
3. **Push repo to GitHub**
4. **Connect GitHub repo to Netlify** (New site → Import from Git)
5. Set `DATABASE_URL` environment variable in Netlify site settings
6. Deploy — Netlify runs `npm install` (installs `pg` package), then serves the site
7. **Add custom domain** in Netlify → Domain Management → Add custom domain
8. Point your domain's DNS to Netlify nameservers (Netlify provides these)
9. HTTPS is enabled automatically via Let's Encrypt

### Updating the app

```bash
git add .
git commit -m "Your message"
git push origin main
```

Netlify auto-deploys on every push to `main`.

---

## 📂 Project Structure

```
├── netlify.toml              # Netlify config (build, functions, redirects)
├── package.json              # Node dependencies (pg)
├── DEPLOYMENT.md             # This file
├── public/                   # Static frontend (served by Netlify)
│   ├── index.html            # Movie list: search, filter, sort, pagination
│   ├── add.html              # Add new movie form
│   ├── edit.html             # Edit existing movie form
│   ├── stats.html            # Collection statistics
│   ├── css/style.css         # All styles
│   └── js/
│       ├── api.js            # Frontend API service + cookie helpers
│       └── app.js            # Main app logic (state, rendering, pagination)
└── netlify/
    └── functions/
        └── api.js            # Serverless backend: all CRUD + stats endpoints
```

---

## ✅ Feature Checklist

- [x] Full CRUD persisted to PostgreSQL
- [x] 30+ seeded records
- [x] Search by title / director
- [x] Filter by genre and watch status
- [x] Sorting by title, year, rating, runtime, date added
- [x] Pagination with configurable page size (5 / 10 / 20 / 50)
- [x] Page size saved in cookie and restored on reload
- [x] Image per record with broken-image placeholder
- [x] Stats view: total records, current page size, avg rating, completion rate
- [x] Delete confirmation dialog
- [x] HTTPS via Netlify / Let's Encrypt
- [x] Custom domain
- [x] Secrets via environment variables (no passwords in Git)
- [x] Responsive design (mobile + desktop)
