import type Stripe from "stripe";

/** Fields we store on `profiles_marketplace` from a Stripe Connect Account object. */
export function stripeConnectFieldsFromAccount(account: Stripe.Account) {
  return {
    stripeConnectAccountId: account.id,
    stripeConnectChargesEnabled: account.charges_enabled ?? false,
    stripeConnectPayoutsEnabled: account.payouts_enabled ?? false,
    stripeConnectDetailsSubmitted: account.details_submitted ?? false,
  };
}
