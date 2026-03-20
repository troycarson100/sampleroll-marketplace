-- SampleRoll Phase 1: marketplace tables, RLS, storage buckets/policies.
-- Safe to apply to an existing project: creates only NEW objects in public + storage.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles_marketplace (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
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
  creator_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
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
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES public.sample_packs (id) ON DELETE RESTRICT,
  stripe_payment_intent_id text NOT NULL,
  amount_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_purchases_user_pack_unique UNIQUE (user_id, pack_id)
);

CREATE TABLE public.creator_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
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

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_sample_packs_creator_id ON public.sample_packs (creator_id);

CREATE INDEX idx_sample_packs_is_published ON public.sample_packs (is_published);

CREATE INDEX idx_individual_samples_pack_id ON public.individual_samples (pack_id);

CREATE INDEX idx_user_purchases_user_id ON public.user_purchases (user_id);

CREATE INDEX idx_creator_earnings_creator_id ON public.creator_earnings (creator_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger (profiles_marketplace, sample_packs)
-- ---------------------------------------------------------------------------

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
  EXECUTE PROCEDURE public.trigger_set_updated_at();

CREATE TRIGGER trg_sample_packs_updated_at
  BEFORE UPDATE ON public.sample_packs
  FOR EACH ROW
  EXECUTE PROCEDURE public.trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — public tables
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles_marketplace ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sample_packs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.individual_samples ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

-- profiles_marketplace
CREATE POLICY "profiles_marketplace_select_own"
  ON public.profiles_marketplace
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_marketplace_select_creators_public"
  ON public.profiles_marketplace
  FOR SELECT
  USING (is_creator = true);

CREATE POLICY "profiles_marketplace_insert_own"
  ON public.profiles_marketplace
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_marketplace_update_own"
  ON public.profiles_marketplace
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- sample_packs
CREATE POLICY "sample_packs_select_published"
  ON public.sample_packs
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "sample_packs_select_own"
  ON public.sample_packs
  FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "sample_packs_insert_own"
  ON public.sample_packs
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "sample_packs_update_own"
  ON public.sample_packs
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "sample_packs_delete_own"
  ON public.sample_packs
  FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- individual_samples
CREATE POLICY "individual_samples_select_visible"
  ON public.individual_samples
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.sample_packs sp
      WHERE sp.id = individual_samples.pack_id
        AND (
          sp.is_published = true
          OR sp.creator_id = auth.uid()
        )
    )
  );

CREATE POLICY "individual_samples_insert_own_pack"
  ON public.individual_samples
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.sample_packs sp
      WHERE sp.id = pack_id
        AND sp.creator_id = auth.uid()
    )
  );

CREATE POLICY "individual_samples_update_own_pack"
  ON public.individual_samples
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.sample_packs sp
      WHERE sp.id = individual_samples.pack_id
        AND sp.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.sample_packs sp
      WHERE sp.id = pack_id
        AND sp.creator_id = auth.uid()
    )
  );

CREATE POLICY "individual_samples_delete_own_pack"
  ON public.individual_samples
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.sample_packs sp
      WHERE sp.id = individual_samples.pack_id
        AND sp.creator_id = auth.uid()
    )
  );

-- user_purchases: clients read own rows only; inserts from service role (webhook)
CREATE POLICY "user_purchases_select_own"
  ON public.user_purchases
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- creator_earnings: creators read own; inserts from service role
CREATE POLICY "creator_earnings_select_own"
  ON public.creator_earnings
  FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants (RLS still applies)
-- ---------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles_marketplace TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sample_packs TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.individual_samples TO authenticated;

GRANT SELECT ON TABLE public.user_purchases TO authenticated;

GRANT SELECT ON TABLE public.creator_earnings TO authenticated;

GRANT ALL ON TABLE public.profiles_marketplace TO service_role;

GRANT ALL ON TABLE public.sample_packs TO service_role;

GRANT ALL ON TABLE public.individual_samples TO service_role;

GRANT ALL ON TABLE public.user_purchases TO service_role;

GRANT ALL ON TABLE public.creator_earnings TO service_role;

-- Anonymous reads for marketplace + public creator profiles (RLS still applies)
GRANT SELECT ON TABLE public.profiles_marketplace TO anon;

GRANT SELECT ON TABLE public.sample_packs TO anon;

GRANT SELECT ON TABLE public.individual_samples TO anon;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('sample-previews', 'sample-previews', true),
  ('sample-files', 'sample-files', false),
  ('pack-artwork', 'pack-artwork', true)
ON CONFLICT (id) DO NOTHING;

-- Path convention for creator uploads:
--   {auth.uid()}/...   OR   {pack_id}/...   where sample_packs.creator_id = auth.uid()

-- Public read: sample-previews, pack-artwork
CREATE POLICY "storage_sample_previews_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'sample-previews');

CREATE POLICY "storage_pack_artwork_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'pack-artwork');

-- Authenticated uploads: pack-artwork (own user folder or owned pack folder)
CREATE POLICY "storage_pack_artwork_insert_authenticated"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pack-artwork'
    AND (
      (storage.foldername (name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.sample_packs sp
        WHERE sp.id::text = (storage.foldername (name))[1]
          AND sp.creator_id = auth.uid()
      )
    )
  );

CREATE POLICY "storage_pack_artwork_update_authenticated"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pack-artwork'
    AND (
      (storage.foldername (name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.sample_packs sp
        WHERE sp.id::text = (storage.foldername (name))[1]
          AND sp.creator_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'pack-artwork'
    AND (
      (storage.foldername (name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.sample_packs sp
        WHERE sp.id::text = (storage.foldername (name))[1]
          AND sp.creator_id = auth.uid()
      )
    )
  );

CREATE POLICY "storage_pack_artwork_delete_authenticated"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pack-artwork'
    AND (
      (storage.foldername (name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.sample_packs sp
        WHERE sp.id::text = (storage.foldername (name))[1]
          AND sp.creator_id = auth.uid()
      )
    )
  );

-- sample-previews: public read (above); creators manage objects under allowed paths
CREATE POLICY "storage_sample_previews_insert_creator"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'sample-previews'
    AND (
      (storage.foldername (name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.sample_packs sp
        WHERE sp.id::text = (storage.foldername (name))[1]
          AND sp.creator_id = auth.uid()
      )
    )
  );

CREATE POLICY "storage_sample_previews_update_creator"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'sample-previews'
    AND (
      (storage.foldername (name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.sample_packs sp
        WHERE sp.id::text = (storage.foldername (name))[1]
          AND sp.creator_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'sample-previews'
    AND (
      (storage.foldername (name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.sample_packs sp
        WHERE sp.id::text = (storage.foldername (name))[1]
          AND sp.creator_id = auth.uid()
      )
    )
  );

CREATE POLICY "storage_sample_previews_delete_creator"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'sample-previews'
    AND (
      (storage.foldername (name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.sample_packs sp
        WHERE sp.id::text = (storage.foldername (name))[1]
          AND sp.creator_id = auth.uid()
      )
    )
  );

-- sample-files (private): no anonymous read; creators read/write allowed paths
CREATE POLICY "storage_sample_files_select_creator"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'sample-files'
    AND (
      (storage.foldername (name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.sample_packs sp
        WHERE sp.id::text = (storage.foldername (name))[1]
          AND sp.creator_id = auth.uid()
      )
    )
  );

CREATE POLICY "storage_sample_files_insert_creator"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'sample-files'
    AND (
      (storage.foldername (name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.sample_packs sp
        WHERE sp.id::text = (storage.foldername (name))[1]
          AND sp.creator_id = auth.uid()
      )
    )
  );

CREATE POLICY "storage_sample_files_update_creator"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'sample-files'
    AND (
      (storage.foldername (name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.sample_packs sp
        WHERE sp.id::text = (storage.foldername (name))[1]
          AND sp.creator_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'sample-files'
    AND (
      (storage.foldername (name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.sample_packs sp
        WHERE sp.id::text = (storage.foldername (name))[1]
          AND sp.creator_id = auth.uid()
      )
    )
  );

CREATE POLICY "storage_sample_files_delete_creator"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'sample-files'
    AND (
      (storage.foldername (name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.sample_packs sp
        WHERE sp.id::text = (storage.foldername (name))[1]
          AND sp.creator_id = auth.uid()
      )
    )
  );
