-- ============================================
-- STUDENTS ADMISSIONS - Version PostgreSQL Standard
-- ============================================
-- Removed: RLS policies, auth.uid(), storage.buckets
-- Compatible: PostgreSQL 14+
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLE: students
-- For storing student admission form submissions
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  postnom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  sexe TEXT NOT NULL CHECK (sexe IN ('M', 'F', 'Autre')),
  date_naissance DATE NOT NULL,
  lieu_naissance TEXT NOT NULL,
  nationalite TEXT,
  telephone TEXT NOT NULL,
  email TEXT NOT NULL,
  adresse TEXT NOT NULL,
  domaine TEXT NOT NULL,
  filiere TEXT NOT NULL,
  promotion TEXT NOT NULL,
  annee_academique TEXT NOT NULL DEFAULT '2025-2026',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlist', 'enrolled')),
  photo_url TEXT,
  diplome_url TEXT,
  bulletin_url TEXT,
  attestation_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.students IS 'Student admission form submissions';
COMMENT ON COLUMN public.students.nom IS 'Last name';
COMMENT ON COLUMN public.students.postnom IS 'Post name';
COMMENT ON COLUMN public.students.prenom IS 'First name';
COMMENT ON COLUMN public.students.sexe IS 'Gender (M, F, Autre)';
COMMENT ON COLUMN public.students.email IS 'Student email address';
COMMENT ON COLUMN public.students.status IS 'Application status: pending, approved, rejected, waitlist, enrolled';
COMMENT ON COLUMN public.students.annee_academique IS 'Academic year (e.g., 2025-2026)';

-- Indexes for performance and lookups
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students (lower(trim(email)));
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students (status);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_filiere ON public.students (filiere);
CREATE INDEX IF NOT EXISTS idx_students_promotion ON public.students (promotion);
CREATE INDEX IF NOT EXISTS idx_students_annee_academique ON public.students (annee_academique);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-update
DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_students_updated_at();

-- View: Pending applications (admin dashboard)
CREATE OR REPLACE VIEW public.v_pending_applications AS
SELECT 
  id,
  prenom,
  nom,
  postnom,
  email,
  filiere,
  promotion,
  created_at,
  status
FROM public.students
WHERE status = 'pending'
ORDER BY created_at DESC;

COMMENT ON VIEW public.v_pending_applications IS 'View of pending student applications for admin dashboard';

-- View: Application statistics
CREATE OR REPLACE VIEW public.v_application_stats AS
SELECT 
  annee_academique,
  filiere,
  status,
  COUNT(*) as count
FROM public.students
GROUP BY annee_academique, filiere, status
ORDER BY annee_academique DESC, filiere, status;

COMMENT ON VIEW public.v_application_stats IS 'Statistics on student applications by year, filiere, and status';

-- Utility functions

-- Function: Get student full name
CREATE OR REPLACE FUNCTION public.get_student_full_name(p_student_id UUID)
RETURNS TEXT AS $$
SELECT CONCAT(nom, ' ', postnom, ' ', prenom)
FROM public.students
WHERE id = p_student_id;
$$ LANGUAGE SQL STABLE;

-- Function: Check if email already exists (for preventing duplicates)
CREATE OR REPLACE FUNCTION public.check_student_email_exists(p_email TEXT)
RETURNS BOOLEAN AS $$
SELECT EXISTS(SELECT 1 FROM public.students WHERE lower(trim(email)) = lower(trim(p_email)));
$$ LANGUAGE SQL STABLE;

-- Function: Count students by status
CREATE OR REPLACE FUNCTION public.count_students_by_status(p_status TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
SELECT COUNT(*)::INTEGER
FROM public.students
WHERE p_status IS NULL OR status = p_status;
$$ LANGUAGE SQL STABLE;

-- Optional: Insert a test record (comment out if not needed)
-- INSERT INTO public.students (
--   nom, postnom, prenom, sexe, date_naissance, lieu_naissance,
--   nationalite, telephone, email, adresse, domaine, filiere, promotion,
--   annee_academique, status
-- ) VALUES (
--   'Doe', 'Smith', 'John', 'M', '2000-01-15', 'New York',
--   'Américain', '+1234567890', 'john.doe@example.com', '123 Main St',
--   'Informatique', 'Génie Logiciel', '2025',
--   '2025-2026', 'pending'
-- );
