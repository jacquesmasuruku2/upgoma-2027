-- ═══════════════════════════════════════════════════════════════════════════════
-- Cloudflare D1 — PARTIE 1 / 3 : TABLES SEULEMENT
--
-- Pourquoi plusieurs fichiers ?
--   • La console D1 peut mal gérer un très long script (PRAGMA + tables + triggers
--     + index). Un échec partiel laisse par ex. les index sans la dernière table.
--   • PRAGMA journal_mode / foreign_keys peut renvoyer SQLITE_AUTH ou n’agir que
--     sur la transaction courante : on les évite ici (les FK sont appliquées par
--     défaut sur D1, voir doc Cloudflare « Foreign keys »).
--
-- Après exécution réussie de CE fichier, enchaîner SANS modifier le résultat :
--   2) sql/d1_console_02_triggers.sql
--   3) sql/d1_console_03_indexes.sql
--
-- Vérification : SELECT name FROM sqlite_schema WHERE type='table' ORDER BY 1;
--   → 12 tables dont user_roles
-- ═══════════════════════════════════════════════════════════════════════════════

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

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL,
  end_date TEXT,
  category TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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

CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  confirmed INTEGER NOT NULL DEFAULT 0,
  confirmation_token TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT
);

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

CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  "role" TEXT NOT NULL CHECK ("role" IN ('admin', 'moderator', 'user')),
  UNIQUE (user_id, "role")
);
