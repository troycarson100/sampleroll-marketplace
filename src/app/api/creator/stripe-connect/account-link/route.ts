import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Creates a Stripe Connect Express account (if needed) and returns an Account Link
 * URL for onboarding / refresh.
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) {
    return NextResponse.json(
      { error: "Account email missing" },
      { status: 400 },
    );
  }

  const profile = await prisma.profileMarketplace.findUnique({
    where: { id: userId },
    select: {
      isCreator: true,
      stripeConnectAccountId: true,
    },
  });

  if (!profile?.isCreator) {
    return NextResponse.json(
      { error: "Complete creator onboarding first" },
      { status: 403 },
    );
  }

  const country = (
    process.env.STRIPE_CONNECT_ACCOUNT_COUNTRY ?? "US"
  ).trim();

  let accountId = profile.stripeConnectAccountId;

  if (!accountId) {
    try {
      const account = await stripe.accounts.create({
        type: "express",
        country: country.toUpperCase(),
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          marketplace_user_id: userId,
        },
      });
      accountId = account.id;
      await prisma.profileMarketplace.update({
        where: { id: userId },
        data: { stripeConnectAccountId: accountId },
      });
    } catch (e) {
      console.error("stripe.accounts.create:", e);
      const message =
        e instanceof Error ? e.message : "Could not create Connect account";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ??
    "http://localhost:3001";

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/creator/dashboard?stripe_connect=refresh`,
      return_url: `${appUrl}/creator/dashboard?stripe_connect=return`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (e) {
    console.error("stripe.accountLinks.create:", e);
    const message =
      e instanceof Error ? e.message : "Could not create onboarding link";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
