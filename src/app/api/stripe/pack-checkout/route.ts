import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import {
  platformApplicationFeeCents,
  resolveCreatorSplitPercent,
} from "@/lib/stripe-pack-split";

type Body = { packId?: string };

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const packId = body.packId?.trim();
  if (!packId) {
    return NextResponse.json({ error: "packId is required" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pack = await prisma.samplePack.findFirst({
    where: { id: packId, isPublished: true },
    select: {
      id: true,
      title: true,
      description: true,
      priceCents: true,
      creatorId: true,
      stripePriceId: true,
    },
  });

  if (!pack) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  const existing = await prisma.userPurchase.findUnique({
    where: { userId_packId: { userId, packId: pack.id } },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You already own this pack" },
      { status: 409 },
    );
  }

  const creatorProfile = await prisma.profileMarketplace.findUnique({
    where: { id: pack.creatorId },
    select: {
      customSplitPercentage: true,
      stripeConnectAccountId: true,
      stripeConnectChargesEnabled: true,
    },
  });

  let grossCents = pack.priceCents;
  if (pack.stripePriceId) {
    const price = await stripe.prices.retrieve(pack.stripePriceId);
    if (price.unit_amount != null) {
      grossCents = price.unit_amount;
    }
  }

  const splitPercent = resolveCreatorSplitPercent(
    creatorProfile?.customSplitPercentage,
  );
  const applicationFeeCents = platformApplicationFeeCents(
    grossCents,
    splitPercent,
  );

  const useConnectDestination =
    Boolean(creatorProfile?.stripeConnectAccountId) &&
    Boolean(creatorProfile?.stripeConnectChargesEnabled) &&
    applicationFeeCents >= 0 &&
    applicationFeeCents < grossCents;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3001";
  const base = appUrl.replace(/\/$/, "");

  const lineItems = pack.stripePriceId
    ? [{ price: pack.stripePriceId, quantity: 1 }]
    : [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pack.title,
              description: pack.description || undefined,
            },
            unit_amount: pack.priceCents,
          },
          quantity: 1,
        },
      ];

  const paymentIntentData:
    | {
        application_fee_amount: number;
        transfer_data: { destination: string };
      }
    | undefined =
    useConnectDestination && creatorProfile?.stripeConnectAccountId
      ? {
          application_fee_amount: applicationFeeCents,
          transfer_data: {
            destination: creatorProfile.stripeConnectAccountId,
          },
        }
      : undefined;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    ...(paymentIntentData
      ? { payment_intent_data: paymentIntentData }
      : {}),
    metadata: {
      userId,
      packId: pack.id,
      creatorId: pack.creatorId,
      ...(useConnectDestination ? { connectDestination: "1" } : {}),
    },
    success_url: `${base}/sounds/packs/${packId}?purchased=true`,
    cancel_url: `${base}/sounds/packs/${packId}`,
  });

  if (!checkoutSession.url) {
    return NextResponse.json(
      { error: "Checkout session missing URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: checkoutSession.url });
}
