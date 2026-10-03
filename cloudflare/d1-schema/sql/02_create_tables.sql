-- =============================================================================
-- Cloudflare D1 — création des 12 tables (100 % des colonnes utilisées par le site)
-- Source : supabase/migrations + src/integrations/supabase/types.ts
-- Ne pas exécuter sur PostgreSQL / Supabase.
-- Ordre : blog_articles avant blog_comments (clé étrangère).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. blog_articles
-- Colonnes : id, title, excerpt, content, category, author, image_url, published,
--            published_at, created_at, updated_at
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  category TEXT,
  author TEXT,
  image_url TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  published_at TEXT DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------------------------
-- 2. blog_comments
-- Colonnes : id, article_id, author_name, author_email, content, approved, created_at
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_comments (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  approved INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (article_id) REFERENCES blog_articles(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 3. calendar_events
-- Colonnes : id, title, description, event_date, end_date, category, created_at
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL,
  end_date TEXT,
  category TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------------------------
-- 4. college_posts
-- Colonnes : id, title, content, author, image_url, published, created_at, updated_at
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS college_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  author TEXT,
  image_url TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------------------------
-- 5. faculty_content
-- Colonnes : id, slug, name, full_name, description, long_description, departments,
--            image_url, created_at, updated_at
-- departments : JSON tableau (ex. ["Dept A","Dept B"]) — équivalent Postgres text[]
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faculty_content (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  departments TEXT NOT NULL DEFAULT '[]',
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------------------------
-- 6. fees
-- Colonnes : id, faculty, cycle, amount, currency, description, display_order,
--            pdf_url, created_at, updated_at
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fees (
  id TEXT PRIMARY KEY,
  faculty TEXT NOT NULL,
  cycle TEXT NOT NULL DEFAULT 'Licence',
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  display_order INTEGER DEFAULT 0,
  pdf_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------------------------
-- 7. gallery
-- Colonnes : id, title, description, image_url, category, display_order, created_at
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------------------------
-- 8. library_books
-- Colonnes : id, title, author, description, category, pdf_url, cover_url,
--            published, display_order, created_at, updated_at
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  category TEXT,
  pdf_url TEXT,
  cover_url TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------------------------
-- 9. newsletter_subscribers
-- Colonnes : id, name, email, confirmed, confirmation_token, created_at, confirmed_at
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  confirmed INTEGER NOT NULL DEFAULT 0,
  confirmation_token TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT
);

-- -----------------------------------------------------------------------------
-- 10. personnel
-- Colonnes : id, name, role, bio, photo_url, email, linkedin_url, service_slug, display_order,
--            created_at, updated_at
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS personnel (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  email TEXT,
  linkedin_url TEXT,
  service_slug TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------------------------
-- 11. services
-- Colonnes : id, name, slug, description, long_description, image_url, display_order,
--            published, contact_email, created_at, updated_at
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  long_description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  contact_email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------------------------
-- 12. user_roles
-- Colonnes : id, user_id, role  (énumération app_role : admin, moderator, user)
-- Pas de FK vers auth.users — identifiant externe (Supabase Auth / JWT sub).
-- -----------------------------------------------------------------------------
-- Colonne "role" entre guillemets (évite ambiguïtés parseur SQLite / console D1)
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  "role" TEXT NOT NULL CHECK ("role" IN ('admin', 'moderator', 'user')),
  UNIQUE (user_id, "role")
);
