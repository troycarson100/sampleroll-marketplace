-- Separate marketplace demo track (not tied to pack samples)
ALTER TABLE public.sample_packs
  ADD COLUMN IF NOT EXISTS demo_preview_url text;

COMMENT ON COLUMN public.sample_packs.demo_preview_url IS 'Public URL for pack demo/preview audio (separate from individual sample previews)';
