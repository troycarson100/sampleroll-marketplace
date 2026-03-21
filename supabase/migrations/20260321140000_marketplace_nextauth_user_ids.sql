-- Marketplace: bind to public.users (Sample Dig / NextAuth CUID ids), not auth.users.
-- Destructive to prior marketplace-only tables that used uuid FK to auth.users.
-- Apply on dev/staging first. On production Dig DB, public.users already exists — skip user creation.

-- ---------------------------------------------------------------------------
-- Storage: remove Supabase-Auth (auth.uid()) policies; uploads use service role from server.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "storage_sample_files_delete_creator" ON storage.objects;
DROP POLICY IF EXISTS "storage_sample_files_update_creator" ON storage.objects;
DROP POLICY IF EXISTS "storage_sample_files_insert_creator" ON storage.objects;
DROP POLICY IF EXISTS "storage_sample_files_select_creator" ON storage.objects;
DROP POLICY IF EXISTS "storage_sample_previews_delete_creator" ON storage.objects;
DROP POLICY IF EXISTS "storage_sample_previews_update_creator" ON storage.objects;
DROP POLICY IF EXISTS "storage_sample_previews_insert_creator" ON storage.objects;
DROP POLICY IF EXISTS "storage_pack_artwork_delete_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_pack_artwork_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_pack_artwork_insert_authenticated" ON storage.objects;

-- Public read remains (previews + pack artwork)

-- ---------------------------------------------------------------------------
-- Drop marketplace public tables (order: dependents first)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "creator_earnings_select_own" ON public.creator_earnings;
DROP POLICY IF EXISTS "user_purchases_select_own" ON public.user_purchases;
DROP POLICY IF EXISTS "individual_samples_delete_own_pack" ON public.individual_samples;
DROP POLICY IF EXISTS "individual_samples_update_own_pack" ON public.individual_samples;
DROP POLICY IF EXISTS "individual_samples_insert_own_pack" ON public.individual_samples;
DROP POLICY IF EXISTS "individual_samples_select_visible" ON public.individual_samples;
DROP POLICY IF EXISTS "sample_packs_delete_own" ON public.sample_packs;
DROP POLICY IF EXISTS "sample_packs_update_own" ON public.sample_packs;
DROP POLICY IF EXISTS "sample_packs_insert_own" ON public.sample_packs;
DROP POLICY IF EXISTS "sample_packs_select_own" ON public.sample_packs;
DROP POLICY IF EXISTS "sample_packs_select_published" ON public.sample_packs;
DROP POLICY IF EXISTS "profiles_marketplace_update_own" ON public.profiles_marketplace;
DROP POLICY IF EXISTS "profiles_marketplace_insert_own" ON public.profiles_marketplace;
DROP POLICY IF EXISTS "profiles_marketplace_select_creators_public" ON public.profiles_marketplace;
DROP POLICY IF EXISTS "profiles_marketplace_select_own" ON public.profiles_marketplace;

DROP TRIGGER IF EXISTS trg_sample_packs_updated_at ON public.sample_packs;
DROP TRIGGER IF EXISTS trg_profiles_marketplace_updated_at ON public.profiles_marketplace;

DROP TABLE IF EXISTS public.creator_earnings CASCADE;
DROP TABLE IF EXISTS public.user_purchases CASCADE;
DROP TABLE IF EXISTS public.individual_samples CASCADE;
DROP TABLE IF EXISTS public.sample_packs CASCADE;
DROP TABLE IF EXISTS public.profiles_marketplace CASCADE;

-- ---------------------------------------------------------------------------
-- users (Sample Dig compatible) — only when missing (standalone marketplace DB)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text,
  stripe_customer_id text,
  subscription_status text,
  subscription_current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  email_verified timestamptz,
  email_verification_token text UNIQUE,
  email_verification_expires timestamptz,
  password_reset_token text UNIQUE,
  password_reset_expires timestamptz
);

-- ---------------------------------------------------------------------------
-- Marketplace tables: user FKs are text → public.users(id)
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles_marketplace (
  id text PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  is_creator boolean NOT NULL DEFAULT false,
  creator_display_name text,
  creator_bio text,
  creator_avatar_url text,
  custom_split_percentage integer,
  paypal_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sample_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id text NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  genre text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  cover_art_url text,
  price_cents integer NOT NULL DEFAULT 1499,
  stripe_price_id text,
  sample_count integer NOT NULL DEFAULT 0,
  total_sales integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.individual_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid NOT NULL REFERENCES public.sample_packs (id) ON DELETE CASCADE,
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_url text NOT NULL,
  preview_url text,
  duration_seconds double precision,
  bpm integer,
  musical_key text,
  instrument_tags text[] NOT NULL DEFAULT '{}',
  genre_tags text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES public.sample_packs (id) ON DELETE RESTRICT,
  stripe_payment_intent_id text NOT NULL,
  amount_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_purchases_user_pack_unique UNIQUE (user_id, pack_id)
);

CREATE TABLE public.creator_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id text NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES public.sample_packs (id) ON DELETE RESTRICT,
  purchase_id uuid NOT NULL REFERENCES public.user_purchases (id) ON DELETE RESTRICT,
  sale_amount_cents integer NOT NULL,
  creator_share_cents integer NOT NULL,
  platform_share_cents integer NOT NULL,
  split_percentage integer NOT NULL,
  is_paid_out boolean NOT NULL DEFAULT false,
  paid_out_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sample_packs_creator_id ON public.sample_packs (creator_id);
CREATE INDEX idx_sample_packs_is_published ON public.sample_packs (is_published);
CREATE INDEX idx_individual_samples_pack_id ON public.individual_samples (pack_id);
CREATE INDEX idx_user_purchases_user_id ON public.user_purchases (user_id);
CREATE INDEX idx_creator_earnings_creator_id ON public.creator_earnings (creator_id);

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
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

CREATE TRIGGER trg_profiles_marketplace_updated_at
  BEFORE UPDATE ON public.profiles_marketplace
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER trg_sample_packs_updated_at
  BEFORE UPDATE ON public.sample_packs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- RLS off: app enforces access via Next.js + Prisma; Storage writes use service role.
ALTER TABLE public.profiles_marketplace DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_packs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_samples DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.profiles_marketplace TO service_role;
GRANT ALL ON TABLE public.sample_packs TO service_role;
GRANT ALL ON TABLE public.individual_samples TO service_role;
GRANT ALL ON TABLE public.user_purchases TO service_role;
GRANT ALL ON TABLE public.creator_earnings TO service_role;

GRANT SELECT ON TABLE public.profiles_marketplace TO anon, authenticated;
GRANT SELECT ON TABLE public.sample_packs TO anon, authenticated;
GRANT SELECT ON TABLE public.individual_samples TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('sample-previews', 'sample-previews', true),
  ('sample-files', 'sample-files', false),
  ('pack-artwork', 'pack-artwork', true)
ON CONFLICT (id) DO NOTHING;
