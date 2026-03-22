-- Stripe Connect (Express) — creator payout accounts
ALTER TABLE public.profiles_marketplace
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_details_submitted boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles_marketplace.stripe_connect_account_id IS 'Stripe Connect Express account id (acct_xxx)';
