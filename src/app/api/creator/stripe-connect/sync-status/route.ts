import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { stripeConnectFieldsFromAccount } from "@/lib/stripe-connect-profile-fields";

export const dynamic = "force-dynamic";

/**
 * Pulls the latest Connect account state from Stripe and updates this user's profile.
 * Use when webhooks are missing (local dev) or right after returning from Account Link.
 */
export async function POST() {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 },
    );
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profileMarketplace.findUnique({
    where: { id: userId },
    select: { stripeConnectAccountId: true },
  });

  if (!profile?.stripeConnectAccountId) {
    return NextResponse.json(
      {
        error:
          "No Connect account yet. Use “Continue with Stripe” on the dashboard first.",
      },
      { status: 400 },
    );
  }

  try {
    const account = await stripe.accounts.retrieve(profile.stripeConnectAccountId);
    const data = stripeConnectFieldsFromAccount(account);
    await prisma.profileMarketplace.update({
      where: { id: userId },
      data,
    });
    return NextResponse.json({
      ok: true,
      chargesEnabled: data.stripeConnectChargesEnabled,
      payoutsEnabled: data.stripeConnectPayoutsEnabled,
      detailsSubmitted: data.stripeConnectDetailsSubmitted,
    });
  } catch (e) {
    console.error("[sync-status] stripe.accounts.retrieve:", e);
    const message =
      e instanceof Error ? e.message : "Could not load Connect account from Stripe";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
