# Stripe Connect (creator payouts)

Creators onboard with **Stripe Connect Express**. Your platform charges buyers with Checkout; creator shares are recorded in `creator_earnings`. **Sending money to creators** via Connect (transfers or destination charges) is a follow-up step once Connect accounts are live.

## 1. Stripe Dashboard

1. Open [Stripe Dashboard](https://dashboard.stripe.com/) → **Connect** → **Get started**.
2. Choose **Express** accounts (typical for marketplaces).
3. Complete Connect branding / support settings if prompted.

## 2. Environment variables

Already used:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL` — must match the URL creators return to after Stripe onboarding (e.g. `http://localhost:3001` in dev).

Optional:

- `STRIPE_CONNECT_ACCOUNT_COUNTRY` — ISO country code for new connected accounts (default **`US`**). Creators outside that country may need different onboarding rules.

## 3. Webhook events

Your existing endpoint **`/api/stripe/marketplace-webhook`** must receive:

| Event                         | Purpose                                      |
| ----------------------------- | -------------------------------------------- |
| `checkout.session.completed`  | Purchases + `creator_earnings` (unchanged)   |
| `account.updated`             | Sync Connect status to `profiles_marketplace` |

In **Developers → Webhooks → [your endpoint]** add **`account.updated`** and use the same signing secret as `STRIPE_WEBHOOK_SECRET`.

## 4. App behavior

- **Onboarding** (`/creator/onboard`): saves profile, then opens a Stripe **Account Link** so the creator completes Express onboarding.
- **Dashboard**: shows a banner until `charges_enabled` is synced (via webhook).
- **Database**: migration adds `stripe_connect_*` columns on `profiles_marketplace` (see `supabase/migrations/`).

Apply the SQL migration (or `prisma db push` in dev) so Prisma and the DB match.

## 5. Destination charges (implemented)

Pack checkout (`/api/stripe/pack-checkout`) uses **Connect destination charges** when the creator has `stripe_connect_charges_enabled` and a `stripe_connect_account_id`:

- **`payment_intent_data.application_fee_amount`** = platform share (same math as `creator_earnings.platform_share_cents`, i.e. 100% − creator split, default creator **75%**).
- **`payment_intent_data.transfer_data.destination`** = creator’s Connect account.

If the creator is **not** Connect-ready, checkout falls back to a normal charge (full amount to the platform); the webhook still records earnings the same way.

**Note:** If you enable **Stripe Tax** or other line items so `amount_total` ≠ pack price, the fee computed at session creation may need a follow-up change to derive the fee from the final session total.
