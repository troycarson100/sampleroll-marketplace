# Supabase JS helpers in this repo

## Auth model

- **Login / sessions:** **NextAuth** + Prisma + `DATABASE_URL` (Sample Dig–aligned).  
- **Supabase public key:** optional — for PostgREST, Realtime, Storage from the browser, or SSR examples that talk to Supabase over HTTP.

## Env vars

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` **or** `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key (new publishable or legacy anon JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** — storage signed URLs, webhooks (`createServiceClient`) |

## Files

- `src/lib/supabase/client.ts` — `createClient()` for **Client Components** (`@supabase/ssr` browser client).
- `src/lib/supabase/server.ts` — `createClient()` for **Server Components / Route Handlers** (reads cookies; `set` may no-op in RSC).
- `src/lib/supabase/middleware.ts` — `updateSupabaseSession()` for **Supabase Auth** cookie refresh. **Not wired** in root `middleware.ts` because this app uses NextAuth.
- `src/lib/supabase/service.ts` — `createServiceClient()` service role (unchanged).

## Wizard / docs that say “middleware + session refresh”

That pattern is for apps that use **Supabase Auth**. If you follow it literally here, you risk **two auth systems** fighting over cookies. Use the SSR clients above only for data features that need the **anon/publishable** key; keep NextAuth for sign-in.

## Security

Do **not** commit real keys. If a key was pasted into chat or committed, **rotate** it in the Supabase dashboard.
