# SampleRoll Marketplace

Sample pack marketplace built with **Next.js 14**, **Supabase**, and **Stripe**.

**Repository:** [github.com/troycarson100/sampleroll-marketplace](https://github.com/troycarson100/sampleroll-marketplace)

## Setup

```bash
npm install
# Create .env.local with Supabase + Stripe vars (see project docs / Supabase dashboard)
npm run dev
```

- Copy **Supabase** URL + anon key into `.env.local` (see `src/lib/supabase/client.ts` for required vars).
- **Stripe** keys and webhook secret for checkout and webhooks.
- **Never commit** `.env.local` (it is gitignored).

### Cursor + Google Stitch MCP (optional)

`.cursor/mcp.json` is gitignored because it can hold API keys. Copy `.cursor/mcp.json.example` to `.cursor/mcp.json` and add your key.

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Next.js dev server             |
| `npm run dev:clean` | Clear `.next`, then dev   |
| `npm run build`| Production build               |
| `npm run lint` | ESLint                         |

Database migrations live under `supabase/migrations/`.
