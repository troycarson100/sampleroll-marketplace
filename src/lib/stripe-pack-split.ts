import { DEFAULT_CREATOR_SPLIT } from "@/lib/constants";

/** Creator share % (0–100). Remainder is the platform share. */
export function resolveCreatorSplitPercent(
  customSplitPercentage: number | null | undefined,
): number {
  if (customSplitPercentage == null) {
    return DEFAULT_CREATOR_SPLIT;
  }
  return Math.min(100, Math.max(0, customSplitPercentage));
}

/**
 * For Connect destination charges: `application_fee_amount` is what the **platform** keeps.
 * Must match the same math as `creator_earnings` in the marketplace webhook.
 */
export function platformApplicationFeeCents(
  grossAmountCents: number,
  creatorSplitPercent: number,
): number {
  if (grossAmountCents <= 0) return 0;
  const creatorShare = Math.round((grossAmountCents * creatorSplitPercent) / 100);
  const platformShare = grossAmountCents - creatorShare;
  return Math.max(0, platformShare);
}
