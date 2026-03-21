# Fixing “Catalog unavailable” / database connection failures

That message means **`DATABASE_URL` is unset or wrong**, or **Prisma cannot connect** to Postgres (SSL, password encoding, firewall, or missing tables).

**If you already set `DATABASE_URL` and restarted:** the browse page still shows this banner when **any** Prisma query throws (not only a missing env var). In **development**, look at the terminal where `npm run dev` is running for a line like **`[prisma:fetchBrowsePageData]`** — that log is the real error (e.g. SSL, auth, or “relation does not exist”).

---

## Where to find the string in Supabase (you won’t see it under Settings → General)

Supabase’s **Project Settings** sidebar (General, Compute and Disk, …) often **does not** include a “Database” line or your Postgres URI.

- **Easiest:** open your **project** in the dashboard and click **Connect** at the **top** of the page. That opens the connection panel (direct, session pooler, transaction). [Supabase docs: Connect to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres).
- **Alternative:** in the **main left nav** (Table Editor, SQL Editor, …), open **Database** and use **Database settings** / connection info there.

---

## Local development + Supabase (most common for this repo)

### Important: direct host is often IPv6-only

Supabase’s **direct** connection uses host `db.[PROJECT-REF].supabase.co:5432`. That hostname is often **IPv6-only**. Many home / office / café networks (and some VPNs) are **IPv4-only**, so Prisma fails with **`P1001` Can’t reach database server** even with a correct password and `?sslmode=require`.

**Fix:** In the Supabase dashboard, click **Connect** (top of the project) → choose **Session pooler** / **Session mode** (shared pooler). It uses a hostname like `aws-0-REGION.pooler.supabase.com` on port **5432** and username **`postgres.[PROJECT-REF]`** — that path supports **IPv4**. Copy the full URI from the UI and set it as `DATABASE_URL`.

[Supabase: IPv4 and IPv6 compatibility](https://supabase.com/docs/guides/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP)

### Steps

1. **Create `.env.local`** in the **project root** (next to `package.json`). It is gitignored.
2. Add **`DATABASE_URL`** from **Connect**:
   - **If `npm run db:ping` / Prisma works with direct:**  
     `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - **If you see `P1001` on your Mac or Wi‑Fi:** use the **Session pooler** string from **Connect** (not the direct host).
3. Append **`?sslmode=require`** if the copied string does not already include it (use `&sslmode=require` if the URL already has a `?`).
4. **URL-encode** special characters in the password (`!` → `%21`, `#` → `%23`, `@` → `%40`, etc.).
5. **Restart** `npm run dev` after any change to `.env.local`.
6. Run the marketplace **SQL migrations** in `supabase/migrations/` (in order) in the **SQL Editor** so `sample_packs` and related tables exist. Connection can succeed but the catalog still fails if tables are missing.

**Sanity check (uses `.env.local`):**

```bash
cd /path/to/sampleroll-marketplace
npm run db:ping
```

You should see a successful `prisma db execute` (no `P1001` / auth errors).

### P1001 on the **pooler** host (`*.pooler.supabase.com`)

If **`npm run db:ping`** says **Can’t reach database server** on the **session pooler** (not `db.*.supabase.co`), the password is usually **not** the problem yet — something is blocking or timing out **before** auth.

Checklist:

1. **Copy the URI again** from **Dashboard → Connect → Session pooler** (host can differ from `aws-1-us-east-1`; use exactly what Supabase shows).
2. **Network / firewall** — Some Wi‑Fi, VPNs, school/work networks block **outbound port 5432**. Try another network or **phone hotspot**, or temporarily disable VPN.
3. **Quick TCP test** (Mac/Linux terminal):
   ```bash
   nc -z -v -w 5 aws-1-us-east-1.pooler.supabase.com 5432
   ```
   If this **fails**, Prisma will show P1001 until the path is open.
4. **Longer timeout** — append to your URL (after `?` use `&`):
   ```text
   &connect_timeout=60
   ```
5. **`.env.local` parsing** — Keep the whole URI in **double quotes**. A raw **`#`** inside an **unquoted** value can truncate the line (treats the rest as a comment). If the password contains `#`, **URL-encode** it as **`%23`** or ensure the value is fully quoted.

---

### Find the pooler hostname (linked Supabase project)

If you use the Supabase CLI (`supabase link` + `supabase login`), the CLI logs the exact session pooler base URL in debug output:

```bash
npm run db:pooler-host
```

Or manually:

```bash
supabase inspect db table-stats --linked --debug 2>&1 | grep "Using connection pooler"
```

Use that host with your **database password** from the dashboard (**Connect → Session pooler** shows the full URI). If `db:ping` returns **P1000** (authentication failed), reset the database password under **Project Settings → Database** and update `DATABASE_URL`.

---

## Deployed apps (Vercel, Fly, Railway, etc.)

The variable must exist in the **runtime** environment (not only on your laptop). After changing env vars, **redeploy**.

---

## Supabase: direct vs poolers

| Where the app runs | Typical choice |
|--------------------|----------------|
| **Your machine** (`next dev`), IPv6 OK | **Direct** URI → `db.*.supabase.co:5432` |
| **Your machine**, **IPv4-only network** (common) | **Session pooler** from **Connect** → `aws-*-*.pooler.supabase.com:5432`, user `postgres.[ref]` |
| **Serverless** (short-lived functions) | **Transaction pooler**, port **6543**, plus Prisma params below |

For **Prisma + transaction pooler (6543)**, add:

```txt
?pgbouncer=true&connection_limit=1
```

Often also:

```txt
&sslmode=require
```

Example:

```txt
postgresql://postgres.PROJECTREF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require
```

---

## Quick checks

| Check | What to do |
|--------|------------|
| Variable name | Must be exactly `DATABASE_URL` (see `prisma/schema.prisma`). |
| Quotes in `.env.local` | Use `DATABASE_URL="postgresql://..."` — avoid stray spaces. |
| Schema / migrations | Connection can succeed but queries fail if tables are missing — run migrations. |
