-- ============================================
-- PARTNERS - Version PostgreSQL Standard (sans RLS ni auth.users)
-- ============================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLE: partners
-- Removed: RLS policies, auth.role() function
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments for documentation
COMMENT ON TABLE public.partners IS 'Partner organizations displayed on the website';
COMMENT ON COLUMN public.partners.name IS 'Partner organization name';
COMMENT ON COLUMN public.partners.description IS 'Brief description of the partner';
COMMENT ON COLUMN public.partners.website_url IS 'Partner website URL';
COMMENT ON COLUMN public.partners.logo_url IS 'URL to partner logo image';
COMMENT ON COLUMN public.partners.display_order IS 'Display order for sorting (lower = first)';
COMMENT ON COLUMN public.partners.is_active IS 'Whether the partner is currently active and visible';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partners_display_order ON public.partners(display_order);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON public.partners(is_active);
CREATE INDEX IF NOT EXISTS idx_partners_created_at ON public.partners(created_at DESC);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-update
DROP TRIGGER IF EXISTS update_partners_updated_at ON public.partners;
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_partners_updated_at();


-- ============================================
-- TABLE: partnership_requests
-- ============================================
CREATE TABLE IF NOT EXISTS public.partnership_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Section 1: Organization Information
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL CHECK (organization_type IN ('Entreprise', 'Université', 'ONG', 'Institution Publique', 'Autre')),
  organization_type_other TEXT,
  headquarters TEXT,
  website_url TEXT,
  sector TEXT,
  
  -- Section 2: Contact Person
  contact_name TEXT NOT NULL,
  contact_position TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  
  -- Section 3: Partnership Nature
  interests TEXT[] NOT NULL CHECK (array_length(interests, 1) >= 1),
  faculties TEXT[],
  
  -- Section 4: Proposal Details
  proposal_description TEXT NOT NULL,
  expected_benefits TEXT,
  proposed_duration INTEGER CHECK (proposed_duration > 0),
  proposed_start_date DATE,
  budget_range TEXT,
  
  -- Section 5: Additional Information
  experience_description TEXT,
  "references" TEXT,
  attachments JSONB,
  
  -- Metadata
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected', 'in_progress')),
  submitted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.partnership_requests IS 'Partnership request form submissions';
COMMENT ON COLUMN public.partnership_requests.organization_name IS 'Name of the organization';
COMMENT ON COLUMN public.partnership_requests.organization_type IS 'Type of organization (Entreprise, Université, ONG, etc.)';
COMMENT ON COLUMN public.partnership_requests.contact_email IS 'Email address of the contact person';
COMMENT ON COLUMN public.partnership_requests.interests IS 'Array of partnership interest areas';
COMMENT ON COLUMN public.partnership_requests.status IS 'Current status of the partnership request';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partnership_requests_status ON public.partnership_requests(status);
CREATE INDEX IF NOT EXISTS idx_partnership_requests_submitted_date ON public.partnership_requests(submitted_date DESC);
CREATE INDEX IF NOT EXISTS idx_partnership_requests_organization_name ON public.partnership_requests(organization_name);
CREATE INDEX IF NOT EXISTS idx_partnership_requests_contact_email ON public.partnership_requests(contact_email);

-- Function for auto-update timestamp
CREATE OR REPLACE FUNCTION public.update_partnership_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS update_partnership_requests_updated_at ON public.partnership_requests;
CREATE TRIGGER update_partnership_requests_updated_at
  BEFORE UPDATE ON public.partnership_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_partnership_requests_updated_at();

-- Sample data (optional - remove if not needed)
-- INSERT INTO public.partners (name, description, website_url, is_active) VALUES
-- ('Partner 1', 'Description 1', 'https://example1.com', true),
-- ('Partner 2', 'Description 2', 'https://example2.com', true);
