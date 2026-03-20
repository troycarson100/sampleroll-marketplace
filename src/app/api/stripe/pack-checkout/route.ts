import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";
  const base = appUrl.replace(/\/$/, "");

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: pack, error: packError } = await supabase
    .from("sample_packs")
    .select("id, title, description, price_cents, creator_id, is_published")
    .eq("id", packId)
    .maybeSingle();

  if (packError) {
    return NextResponse.json(
      { error: "Failed to load pack" },
      { status: 500 },
    );
  }
  if (!pack) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }
  if (!pack.is_published) {
    return NextResponse.json({ error: "Pack is not available" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("user_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("pack_id", packId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You already own this pack" },
      { status: 409 },
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: pack.title,
            description: pack.description || undefined,
          },
          unit_amount: pack.price_cents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: user.id,
      packId: pack.id,
      creatorId: pack.creator_id,
    },
    success_url: `${base}/sounds/packs/${packId}?purchased=true`,
    cancel_url: `${base}/sounds/packs/${packId}`,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Checkout session missing URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url });
}
