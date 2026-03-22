-- Platform staff (supervisors). Owners are defined via PLATFORM_OWNER_EMAILS in app env.
CREATE TABLE IF NOT EXISTS public.platform_staff (
  id text PRIMARY KEY,
  user_id text NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_staff_user_id ON public.platform_staff (user_id);

-- Creator revenue-share contracts (admin → creator; acceptance updates custom_split_percentage)
CREATE TYPE public.creator_contract_status AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'DECLINED',
  'VOID'
);

CREATE TABLE IF NOT EXISTS public.creator_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id text NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  invite_email_norm text NOT NULL,
  split_percentage integer NOT NULL CHECK (split_percentage >= 0 AND split_percentage <= 100),
  title text NOT NULL DEFAULT 'Revenue share agreement',
  notes text NOT NULL DEFAULT '',
  legal_object_path text,
  legal_filename text,
  status public.creator_contract_status NOT NULL DEFAULT 'DRAFT',
  acceptance_token text NOT NULL UNIQUE,
  created_by_user_id text NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  sent_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creator_contracts_creator ON public.creator_contracts (creator_user_id);
CREATE INDEX IF NOT EXISTS idx_creator_contracts_invite_email ON public.creator_contracts (invite_email_norm);
CREATE INDEX IF NOT EXISTS idx_creator_contracts_status ON public.creator_contracts (status);
CREATE INDEX IF NOT EXISTS idx_creator_contracts_token ON public.creator_contracts (acceptance_token);

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at_creator_contracts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_creator_contracts_updated_at ON public.creator_contracts;
CREATE TRIGGER trg_creator_contracts_updated_at
  BEFORE UPDATE ON public.creator_contracts
  FOR EACH ROW
  EXECUTE PROCEDURE public.trigger_set_updated_at_creator_contracts();

-- Private bucket for contract PDFs (server uploads via service role only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-legal', 'contract-legal', false)
ON CONFLICT (id) DO NOTHING;
