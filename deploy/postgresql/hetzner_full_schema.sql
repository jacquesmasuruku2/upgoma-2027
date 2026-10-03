-- =============================================================================
-- UPG — Schéma PostgreSQL complet (serveur dédié, ex. Hetzner)
-- =============================================================================
-- Ce script regroupe les migrations Supabase du dépôt en un seul fichier exécutable
-- sur PostgreSQL 14+ (recommandé : 15 ou 16).
--
-- Contenu :
--   - Extension pgcrypto (gen_random_uuid)
--   - Schéma auth minimal + table auth.users (FK user_roles, aligné Supabase)
--   - Fonction auth.uid() de secours (session / claims — voir commentaires)
--   - Schéma public : types, tables, clés étrangères, uniques, index
--   - Triggers updated_at
--   - Fonctions métier (has_role, compteurs, assignation de rôles)
--   - Vues de jointure (lisibles dans pgAdmin / requêtes)
--
-- Exécution (exemple) :
--   psql -U postgres -d upg_db -f hetzner_full_schema.sql
--
-- Important : ce script ne reproduit pas storage.buckets ni les rôles Supabase
-- (anon / authenticated). Les politiques RLS sont fournies en fin de fichier,
-- commentées, pour référence si vous activez RLS avec vos propres rôles applicatifs.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- Schéma auth (minimal — compatible FK user_roles → auth.users)
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;

-- Table minimale : l’application peut insérer des utilisateurs ici ou synchroniser
-- depuis votre couche d’authentification (JWT, Keycloak, etc.).
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  encrypted_password text,
  email_confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE auth.users IS
  'Comptes applicatifs (équivalent minimal Supabase auth.users). user_roles.user_id y fait référence.';

CREATE INDEX IF NOT EXISTS idx_auth_users_email_lower ON auth.users (lower(trim(email)));

-- -----------------------------------------------------------------------------
-- auth.uid() — remplacement minimal pour les fonctions qui appellent auth.uid()
-- -----------------------------------------------------------------------------
-- Sur Supabase, auth.uid() est injecté par la plateforme. Ici, on lit d’abord
-- une variable de session optionnelle (utile pour tests / backend maison).
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    NULLIF(trim(both from current_setting('request.jwt.claim.sub', true)), '')::uuid,
    NULLIF(trim(both from current_setting('app.current_user_id', true)), '')::uuid
  );
$$;

COMMENT ON FUNCTION auth.uid() IS
  'Retourne l’utilisateur courant : claim JWT sub (si configuré) ou app.current_user_id.';

-- -----------------------------------------------------------------------------
-- Types énumérés
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
                 WHERE n.nspname = 'public' AND t.typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- Fonction : mise à jour automatique de updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Tables public (ordre : sans dépendances FK d’abord)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.personnel (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  bio text,
  photo_url text,
  display_order integer DEFAULT 0,
  email text,
  linkedin_url text,
  service_slug text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_articles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  excerpt text,
  content text,
  category text,
  author text,
  image_url text,
  published boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  views_count integer NOT NULL DEFAULT 0,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  category text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.college_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text,
  author text,
  image_url text,
  published boolean DEFAULT false,
  views_count integer NOT NULL DEFAULT 0,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  end_date date,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty text NOT NULL,
  cycle text NOT NULL DEFAULT 'Licence',
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  description text,
  pdf_url text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.faculty_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  full_name text NOT NULL,
  description text,
  long_description text,
  departments text[] DEFAULT '{}',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.library_books (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  author text,
  description text,
  category text,
  pdf_url text,
  cover_url text,
  published boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  confirmed boolean NOT NULL DEFAULT false,
  confirmation_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  long_description text,
  image_url text,
  display_order integer DEFAULT 0,
  published boolean DEFAULT true,
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Dépend de auth.users
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Dépend de blog_articles
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid NOT NULL REFERENCES public.blog_articles (id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text,
  content text NOT NULL,
  approved boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Index (performances + visibilité des relations dans les outils)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_blog_comments_article_id ON public.blog_comments (article_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_blog_articles_published ON public.blog_articles (published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_college_posts_published ON public.college_posts (published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_date ON public.calendar_events (event_date);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON public.gallery (category);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_confirmed ON public.newsletter_subscribers (confirmed);

-- -----------------------------------------------------------------------------
-- Triggers updated_at
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_personnel_updated_at ON public.personnel;
CREATE TRIGGER update_personnel_updated_at
  BEFORE UPDATE ON public.personnel
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_articles_updated_at ON public.blog_articles;
CREATE TRIGGER update_blog_articles_updated_at
  BEFORE UPDATE ON public.blog_articles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_college_posts_updated_at ON public.college_posts;
CREATE TRIGGER update_college_posts_updated_at
  BEFORE UPDATE ON public.college_posts
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fees_updated_at ON public.fees;
CREATE TRIGGER update_fees_updated_at
  BEFORE UPDATE ON public.fees
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_faculty_content_updated_at ON public.faculty_content;
CREATE TRIGGER update_faculty_content_updated_at
  BEFORE UPDATE ON public.faculty_content
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_library_books_updated_at ON public.library_books;
CREATE TRIGGER update_library_books_updated_at
  BEFORE UPDATE ON public.library_books
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_auth_users_updated_at ON auth.users;
CREATE TRIGGER update_auth_users_updated_at
  BEFORE UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Fonctions métier
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.increment_blog_article_views(p_article_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.blog_articles
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_article_id
    AND published = true
  RETURNING views_count INTO v_count;

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_blog_article_likes(p_article_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.blog_articles
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = p_article_id
    AND published = true
  RETURNING likes_count INTO v_count;

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_college_post_views(p_post_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.college_posts
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_post_id
    AND published = true
  RETURNING views_count INTO v_count;

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_college_post_likes(p_post_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.college_posts
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = p_post_id
    AND published = true
  RETURNING likes_count INTO v_count;

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_user_role_by_email(
  p_email text,
  p_role public.app_role
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor uuid;
  v_target_user_id uuid;
  v_existing_role_id uuid;
  v_new_role_id uuid;
BEGIN
  v_actor := auth.uid();
  IF v_actor IS NULL OR NOT public.has_role(v_actor, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT id
  INTO v_target_user_id
  FROM auth.users
  WHERE lower(trim(email)) = lower(trim(p_email))
  LIMIT 1;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur auth.users trouvé pour cet email';
  END IF;

  SELECT id
  INTO v_existing_role_id
  FROM public.user_roles
  WHERE user_id = v_target_user_id
    AND role::text = p_role::text
  LIMIT 1;

  IF v_existing_role_id IS NOT NULL THEN
    RETURN v_existing_role_id;
  END IF;

  INSERT INTO public.user_roles (id, user_id, role)
  VALUES (gen_random_uuid(), v_target_user_id, p_role)
  RETURNING id INTO v_new_role_id;

  RETURN v_new_role_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_user_role_by_personnel_id(
  p_personnel_id uuid,
  p_role public.app_role
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email
  INTO v_email
  FROM public.personnel
  WHERE id = p_personnel_id
  LIMIT 1;

  IF v_email IS NULL OR length(trim(v_email)) = 0 THEN
    RAISE EXCEPTION 'Cet ID personnel n''a pas d''email exploitable';
  END IF;

  RETURN public.assign_user_role_by_email(v_email, p_role);
END;
$$;

-- -----------------------------------------------------------------------------
-- Vues « jointures » — utiles dans pgAdmin (requêtes) et documentation du modèle
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_blog_comments_with_articles AS
SELECT
  c.id AS comment_id,
  c.article_id,
  a.title AS article_title,
  c.author_name,
  c.author_email,
  c.content,
  c.approved,
  c.created_at AS comment_created_at,
  a.published AS article_published
FROM public.blog_comments c
INNER JOIN public.blog_articles a ON a.id = c.article_id;

COMMENT ON VIEW public.v_blog_comments_with_articles IS
  'Commentaires de blog avec titre d’article (jointure article ↔ commentaire).';

CREATE OR REPLACE VIEW public.v_user_roles_with_auth_email AS
SELECT
  ur.id AS user_role_row_id,
  ur.user_id,
  u.email AS auth_email,
  ur.role::text AS role
FROM public.user_roles ur
LEFT JOIN auth.users u ON u.id = ur.user_id;

COMMENT ON VIEW public.v_user_roles_with_auth_email IS
  'Rôles applicatifs avec email issu de auth.users.';

-- -----------------------------------------------------------------------------
-- Données initiales (services — identique à la migration Supabase)
-- -----------------------------------------------------------------------------
INSERT INTO public.services (name, slug, description, display_order)
VALUES
  ('Enseignement et Formation de cadres', 'enseignement-formation', 'Formation académique et professionnelle de haut niveau.', 1),
  ('Recherche académique & Innovation', 'recherche-innovation', 'Recherche scientifique et innovation technologique.', 2),
  ('Rectorat', 'rectorat', 'Direction et administration de l''université.', 3),
  ('SGAc', 'sgac', 'Secrétariat Général Académique.', 4),
  ('LABO INFO', 'labo-info', 'Laboratoire informatique de l''université.', 5),
  ('APPARITORAT', 'apparitorat', 'Service de l''apparitorat.', 6)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Droits d’exécution (ajustez le rôle applicatif selon votre déploiement)
-- -----------------------------------------------------------------------------
-- Rôle applicatif (sans mot de passe dans ce fichier — définissez-le avec ALTER ROLE).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'upg_app') THEN
    CREATE ROLE upg_app WITH LOGIN;
  END IF;
END
$$;
COMMENT ON ROLE upg_app IS 'Application role; set password with ALTER ROLE upg_app WITH PASSWORD ''...'';';

GRANT USAGE ON SCHEMA public TO upg_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO upg_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO upg_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO upg_app;

GRANT USAGE ON SCHEMA auth TO upg_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO upg_app;

GRANT SELECT ON public.v_blog_comments_with_articles TO upg_app;
GRANT SELECT ON public.v_user_roles_with_auth_email TO upg_app;

-- Fonctions RPC utilisées par le front (lecture anonyme possible selon votre politique)
GRANT EXECUTE ON FUNCTION public.increment_blog_article_views(uuid) TO upg_app;
GRANT EXECUTE ON FUNCTION public.increment_blog_article_likes(uuid) TO upg_app;
GRANT EXECUTE ON FUNCTION public.increment_college_post_views(uuid) TO upg_app;
GRANT EXECUTE ON FUNCTION public.increment_college_post_likes(uuid) TO upg_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO upg_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO upg_app;

COMMIT;

-- =============================================================================
-- RLS (référence Supabase) — NON activé par défaut sur PostgreSQL nu.
-- Décommentez et adaptez les rôles (authenticated / anon) si vous les créez.
-- =============================================================================
/*
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
-- ... reprendre les policies depuis supabase/migrations si besoin ...
*/
