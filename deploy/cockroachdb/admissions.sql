-- Admissions submitted by the public website.
-- Run once against the CockroachDB database configured in DATABASE_URL.

CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule TEXT,
  nom TEXT NOT NULL,
  postnom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  sexe TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  lieu_naissance TEXT NOT NULL,
  nationalite TEXT NOT NULL DEFAULT 'Congolaise',
  telephone TEXT NOT NULL,
  email TEXT NOT NULL,
  adresse TEXT NOT NULL,
  domaine TEXT NOT NULL,
  filiere TEXT NOT NULL,
  promotion TEXT NOT NULL,
  annee_academique TEXT NOT NULL DEFAULT '2025-2026',
  photo_url TEXT,
  diplome_url TEXT,
  bulletin_url TEXT,
  attestation_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_status_created_at
  ON public.students (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_students_email
  ON public.students (email);
