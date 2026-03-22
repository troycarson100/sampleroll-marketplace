-- Undo accidental RLS enable in Supabase Dashboard.
-- Marketplace access is enforced in Next.js + Prisma (see 20260321140000_marketplace_nextauth_user_ids.sql).

ALTER TABLE public.individual_samples DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_staff DISABLE ROW LEVEL SECURITY;
