import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe =
  secretKey != null && secretKey.length > 0
    ? new Stripe(secretKey, {
        apiVersion: "2026-02-25.clover",
        typescript: true,
      })
    : null;
