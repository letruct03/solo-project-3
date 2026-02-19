# Solo Project 3: Production Collection Manager

## Live Application

**URL:** https://truc-movie-collection.netlify.app

---

## Domain

- **Domain Name:** truc-movie-collection.netlify.app
- **Registrar:** Netlify free subdomain
- **DNS / HTTPS:** Managed automatically by Netlify with Let's Encrypt SSL

---

## Hosting Provider

**Netlify** — https://www.netlify.com

- Free tier used (no credit card required)
- Frontend static files served from the `public/` directory
- Backend API runs as a Netlify Serverless Function (Node.js 18)
- Auto-deploys on every push to the `main` branch on GitHub
- HTTPS is provisioned automatically via Let's Encrypt

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript (ES6+)  |
| Backend    | Node.js 18 (Netlify Serverless Function)|
| Database   | PostgreSQL (hosted on Neon)             |
| Hosting    | Netlify                                 |
| Domain/DNS | Netlify (or custom registrar)           |

---

## Database

- **Type:** PostgreSQL
- **Provider:** Neon (https://neon.tech) — serverless Postgres, free tier
- **Connection:** Via `DATABASE_URL` environment variable
- **Schema:** Auto-created on first request if it does not exist
- **Seed data:** 30 movies inserted automatically when the table is empty; duplicate-safe via `ON CONFLICT (title) DO NOTHING`

### Schema

```sql
CREATE TABLE IF NOT EXISTS movies (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  director        VARCHAR(255),
  release_year    INT CHECK (release_year BETWEEN 1888 AND 2030),
  genre           VARCHAR(100),
  runtime         INT CHECK (runtime > 0),
  watch_status    VARCHAR(50) DEFAULT 'Want to Watch',
  personal_rating NUMERIC(3,1) CHECK (personal_rating BETWEEN 0 AND 10),
  review_notes    TEXT,
  image_url       TEXT,
  date_added      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT movies_title_unique UNIQUE (title)
);
```

---

## Configuration & Secrets

All secrets are stored as **Netlify Environment Variables** and are never committed to Git.

### Required Environment Variable

| Variable       | Description                                      |
|----------------|--------------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string provided by Neon    |

### How to set in Netlify

1. Go to your Netlify site → **Site configuration → Environment variables**
2. Click **Add a variable**
3. Key: `DATABASE_URL`
4. Value: your Neon connection string, which looks like:
   ```
   postgresql://user:password@ep-something.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Save, then trigger a new deploy for the variable to take effect

---

## How to Deploy

### First-time setup

1. **Create a Neon account** at https://neon.tech
2. Create a new project, then copy the connection string from the dashboard
3. **Push this repo to GitHub**
4. Go to https://app.netlify.com → **Add new site → Import from Git → GitHub**
5. Select this repository
6. Netlify auto-detects settings from `netlify.toml`:
   - Build command: `npm install`
   - Publish directory: `public`
7. Before deploying, add `DATABASE_URL` under **Environment variables**
8. Click **Deploy site** — build completes in ~30 seconds
9. The database schema and 30 seed movies are created automatically on the first request

### Updating the app

```bash
git add .
git commit -m "Your message"
git push origin main
```

Netlify auto-deploys on every push to `main`. Deploys typically complete in under 60 seconds.

---
