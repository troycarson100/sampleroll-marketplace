# Production cutover (Sample Dig + marketplace)

When the marketplace is ready to share the **live** Sample Roll user base:

1. **Back up** the production Dig database.
2. Apply [`supabase/migrations/20260321140000_marketplace_nextauth_user_ids.sql`](../supabase/migrations/20260321140000_marketplace_nextauth_user_ids.sql) on that database (or run an equivalent migration).  
   - If marketplace tables from the older `auth.users` migration already exist, this migration **drops and recreates** them — only safe if you have no production marketplace data to keep.
3. Set deployment env:
   - `DATABASE_URL` — **same** Postgres connection Sample Dig uses (includes `public.users`).
   - `AUTH_SECRET` / `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (storage + webhook inserts only)
4. Deploy the marketplace app and smoke-test: register (if allowed), login with an existing Dig user, browse packs, Stripe test checkout, sample download.

Existing Dig users can sign in immediately; no Supabase Auth migration is required.
