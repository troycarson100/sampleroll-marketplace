# Stripe quick setup (SampleRoll marketplace)

Your **Stripe MCP** is linked to this account (verify in Cursor → MCP):

- **Display name:** Sample Roll sandbox  
- **Manage API keys:** [Dashboard → API keys](https://dashboard.stripe.com/acct_1TD7rYB60xu9oJCL/apikeys) (path includes your account id)

MCP can **inspect** Stripe (account info, docs search, etc.). It **cannot** create webhooks or Connect settings—you do those in the Dashboard (or Stripe CLI) once per environment.

---

## 1. Environment variables (`.env.local`)

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | **Secret key** from [API keys](https://dashboard.stripe.com/test/apikeys) (use **Test** while developing) |
| `STRIPE_WEBHOOK_SECRET` | **Signing secret** from the webhook destination (see below)—**different for Test vs Live** and **different for CLI vs Dashboard** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **Publishable** key (client-side if you use Elements later) |
| `NEXT_PUBLIC_APP_URL` | Must match your app URL (dev: `http://localhost:3001` — this repo’s dev server uses **3001**) |

Optional:

| Variable | Purpose |
|----------|---------|
| `STRIPE_CONNECT_ACCOUNT_COUNTRY` | ISO country for new Connect accounts (default `US`) |

---

## 2. Webhook endpoint (required for purchases + Connect sync)

**Your app route:** `POST /api/stripe/marketplace-webhook`

### Events to send

| Event | Why |
|-------|-----|
| `checkout.session.completed` | Record purchase + `creator_earnings` |
| `account.updated` | Sync Stripe Connect status to `profiles_marketplace` |

### Production / staging (HTTPS)

1. Open [Webhooks](https://dashboard.stripe.com/test/webhooks) (Test mode) or Live webhooks for production.  
2. **Create destination** (or **Add endpoint**).  
3. **Endpoint URL:** `https://YOUR_DOMAIN/api/stripe/marketplace-webhook`  
4. Select the events above.  
5. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`.

> If Stripe asks **Account** vs **Connect**: use your **platform account** endpoint unless Stripe specifically requires listening on connected accounts. This app handles platform Checkout and Connect account updates for creators you onboard.

### Local development (Stripe CLI)

Install [Stripe CLI](https://stripe.com/docs/stripe-cli), then:

```bash
npm run stripe:listen
```

Copy the **`whsec_...`** the CLI prints and set it as `STRIPE_WEBHOOK_SECRET` in `.env.local` while testing locally.

---

## 3. Connect (creator payouts / Express)

1. [Connect → Overview](https://dashboard.stripe.com/test/connect/accounts/overview) — complete any platform prompts.  
2. Creators complete onboarding via your app (**Become a creator** → Stripe hosted flow).  
3. Ensure the **same** webhook receives **`account.updated`** (step 2).

Splitting **75% / 25% in Stripe** (destination charges + application fee) is a **code change** on Checkout—not something MCP or “Add product” configures. Until then, the app records splits in `creator_earnings`; funds settle on the platform balance.

---

## 4. What you do **not** need in the Dashboard

- A manual Product for **every** pack (your app can create Product/Price on **publish**).  
- Payment Links as the main flow (you use **Checkout Sessions**).

---

## 5. Smoke test (Test mode)

1. `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` set; `NEXT_PUBLIC_APP_URL=http://localhost:3001`  
2. `npm run dev` (or `npm run dev:clean`)  
3. `npm run stripe:listen` in another terminal  
4. Complete a test Checkout for a published pack  
5. Confirm webhook delivery in CLI output and purchase row in DB  

---

## 6. Cursor Stripe MCP

If you add the Stripe MCP server in Cursor, point it at the same Stripe account and keep keys out of git. Project file `.cursor/mcp.json` may list other servers; Stripe is often configured under **Cursor Settings → MCP** with your secret key.
