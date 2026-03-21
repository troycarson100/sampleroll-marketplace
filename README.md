# SampleRoll Marketplace

Sample pack marketplace built with **Next.js 14**, **NextAuth**, **Prisma** (Postgres aligned with Sample Dig `public.users`), **Supabase Storage** (service role on the server), and **Stripe**.

**Repository:** [github.com/troycarson100/sampleroll-marketplace](https://github.com/troycarson100/sampleroll-marketplace)

## Setup

```bash
npm install
# Create .env.local — see .env.example (DATABASE_URL, NextAuth, Supabase service role, Stripe)
npm run dev
```

- **`DATABASE_URL`** must point at a Postgres that has Dig-compatible `public.users` and marketplace tables (see `supabase/migrations/`). **Local + Supabase:** set it in **`.env.local`** (project root), paste the URI from Supabase **Connect** (if Prisma shows **`P1001`**, use **Session pooler** — direct `db.*` is often IPv6-only). Run **`npm run db:ping`** to verify, then restart `npm run dev`; see [`docs/DATABASE_URL.md`](docs/DATABASE_URL.md). Use an **isolated** dev project until production cutover; see [`docs/PRODUCTION_CUTOVER.md`](docs/PRODUCTION_CUTOVER.md).
- **NextAuth** — **`AUTH_SECRET` or `NEXTAUTH_SECRET` (required for sign-in, non-empty).** Use `openssl rand -base64 32`. Set `NEXTAUTH_URL` to your site origin (e.g. `https://your-domain.com` in production). If this is missing in production, **browse pages still load** (session is treated as logged out), but **sign-in and other auth routes return 503** with a JSON hint until you add the variable and redeploy.
- **Supabase** — `NEXT_PUBLIC_SUPABASE_URL` and **`SUPABASE_SERVICE_ROLE_KEY`** for storage signed URLs and webhook writes. Optional **publishable** or **anon** key for Data API / client helpers: see [`docs/SUPABASE_SSR_HELPERS.md`](docs/SUPABASE_SSR_HELPERS.md) and `src/lib/supabase/{client,server,middleware}.ts`.
- **Stripe** keys and webhook secret for checkout and webhooks.
- **Never commit** `.env.local` (it is gitignored).

### MCP (optional): Stitch + Supabase

- **`.cursor/mcp.json`** is gitignored (API keys). Copy **`.cursor/mcp.json.example`** → **`.cursor/mcp.json`** and fill in values.
- **Supabase MCP** — hosted URL `https://mcp.supabase.com/mcp` with optional `?project_ref=...`. After saving, use **Cursor Settings → Tools & MCP** to authenticate (browser flow). See **[`docs/MCP_SUPABASE.md`](docs/MCP_SUPABASE.md)** for Cursor + **Claude Code** (`claude mcp add` / `claude /mcp`) and optional **`npx skills add supabase/agent-skills -y`**.

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run db:ping` | Prisma `SELECT 1` using `DATABASE_URL` from `.env.local` (checks connectivity) |
| `npm run db:pooler-host` | Prints the session pooler base URL the Supabase CLI uses (needs `supabase link` + login) |
| `npm run dev`  | Next.js dev server             |
| `npm run dev:clean` | Delete `.next` + `node_modules/.cache`, then dev (fixes missing `./682.js` chunk / webpack-runtime errors) |
| `npm run build`| Production build               |
| `npm run lint` | ESLint                         |

Database migrations live under `supabase/migrations/`.
