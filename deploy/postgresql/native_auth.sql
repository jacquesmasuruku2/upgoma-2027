BEGIN;

CREATE TABLE IF NOT EXISTS auth.app_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id ON auth.app_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_app_sessions_expires_at ON auth.app_sessions (expires_at);

CREATE TABLE IF NOT EXISTS auth.account_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('invite', 'password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_tokens_user_purpose ON auth.account_tokens (user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_account_tokens_expires_at ON auth.account_tokens (expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_users_email_normalized ON auth.users (lower(trim(email)));

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid();
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;
UPDATE public.newsletter_subscribers SET unsubscribe_token = gen_random_uuid() WHERE unsubscribe_token IS NULL;
ALTER TABLE public.newsletter_subscribers ALTER COLUMN unsubscribe_token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscribers_unsubscribe_token
  ON public.newsletter_subscribers (unsubscribe_token);

CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('blog', 'communique', 'custom')),
  source_id UUID,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  source_url TEXT,
  image_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('sending', 'sent', 'partial', 'failed')),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_at
  ON public.newsletter_campaigns (created_at DESC);

COMMIT;