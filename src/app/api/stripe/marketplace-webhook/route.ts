import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { resolveCreatorSplitPercent } from "@/lib/stripe-pack-split";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

async function handleCheckoutSessionCompleted(
  event: Stripe.Event,
): Promise<NextResponse> {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;
  const packId = session.metadata?.packId;
  const creatorId = session.metadata?.creatorId;

  if (!userId || !packId || !creatorId) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntentId) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const amountCents = session.amount_total ?? 0;
  if (amountCents <= 0) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const supabase = createServiceClient();

  const { data: existingPurchase } = await supabase
    .from("user_purchases")
    .select("id")
    .eq("user_id", userId)
    .eq("pack_id", packId)
    .maybeSingle();

  let purchaseId: string;

  if (existingPurchase) {
    purchaseId = existingPurchase.id;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("user_purchases")
      .insert({
        user_id: userId,
        pack_id: packId,
        stripe_payment_intent_id: paymentIntentId,
        amount_cents: amountCents,
      })
      .select("id")
      .single();

    if (insertError?.code === "23505") {
      const { data: raced } = await supabase
        .from("user_purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("pack_id", packId)
        .single();
      if (!raced) {
        return NextResponse.json({ received: true }, { status: 200 });
      }
      purchaseId = raced.id;
    } else if (insertError) {
      console.error("user_purchases insert:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    } else {
      purchaseId = inserted!.id;
    }
  }

  const { data: existingEarning } = await supabase
    .from("creator_earnings")
    .select("id")
    .eq("purchase_id", purchaseId)
    .maybeSingle();

  if (existingEarning) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const { data: profile } = await supabase
    .from("profiles_marketplace")
    .select("custom_split_percentage")
    .eq("id", creatorId)
    .maybeSingle();

  const split = resolveCreatorSplitPercent(
    profile?.custom_split_percentage ?? undefined,
  );

  const creatorShareCents = Math.round((amountCents * split) / 100);
  const platformShareCents = amountCents - creatorShareCents;

  const { error: earningsError } = await supabase.from("creator_earnings").insert({
    creator_id: creatorId,
    pack_id: packId,
    purchase_id: purchaseId,
    sale_amount_cents: amountCents,
    creator_share_cents: creatorShareCents,
    platform_share_cents: platformShareCents,
    split_percentage: split,
  });

  if (earningsError) {
    console.error("creator_earnings insert:", earningsError);
    return NextResponse.json({ error: earningsError.message }, { status: 500 });
  }

  const { data: packRow } = await supabase
    .from("sample_packs")
    .select("total_sales")
    .eq("id", packId)
    .single();

  const nextTotal = (packRow?.total_sales ?? 0) + 1;

  const { error: packUpdateError } = await supabase
    .from("sample_packs")
    .update({ total_sales: nextTotal })
    .eq("id", packId);

  if (packUpdateError) {
    console.error("sample_packs update:", packUpdateError);
    return NextResponse.json({ error: packUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleAccountUpdated(event: Stripe.Event): Promise<NextResponse> {
  const account = event.data.object as Stripe.Account;
  const userId = account.metadata?.marketplace_user_id;

  const data = {
    stripeConnectAccountId: account.id,
    stripeConnectChargesEnabled: account.charges_enabled ?? false,
    stripeConnectPayoutsEnabled: account.payouts_enabled ?? false,
    stripeConnectDetailsSubmitted: account.details_submitted ?? false,
  };

  try {
    const conditions: Array<
      { id: string } | { stripeConnectAccountId: string }
    > = [{ stripeConnectAccountId: account.id }];
    if (userId) {
      conditions.push({ id: userId });
    }

    const result = await prisma.profileMarketplace.updateMany({
      where: { OR: conditions },
      data,
    });

    if (result.count === 0) {
      console.warn(
        "account.updated: no profiles_marketplace row matched",
        account.id,
        userId,
      );
    }
  } catch (e) {
    console.error("profile Connect sync:", e);
    return NextResponse.json({ error: "Profile update failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutSessionCompleted(event);
    case "account.updated":
      return handleAccountUpdated(event);
    default:
      return NextResponse.json({ received: true }, { status: 200 });
  }
}
