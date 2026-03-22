import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPackIfOwner } from "@/lib/creator/assert-pack-owner";
import { stripe } from "@/lib/stripe";
import { PRICE_MAX_CENTS, PRICE_MIN_CENTS } from "@/lib/constants";

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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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

  const owned = await getPackIfOwner(packId, userId);
  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pack = await prisma.samplePack.findUnique({
    where: { id: packId },
  });
  if (!pack) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const title = pack.title.trim();
  if (!title) {
    return NextResponse.json(
      { error: "Title is required before publishing" },
      { status: 400 },
    );
  }

  if (pack.sampleCount < 1) {
    return NextResponse.json(
      { error: "Add at least one sample before publishing" },
      { status: 400 },
    );
  }

  if (
    pack.priceCents < PRICE_MIN_CENTS ||
    pack.priceCents > PRICE_MAX_CENTS
  ) {
    return NextResponse.json(
      {
        error: `Price must be between $${(PRICE_MIN_CENTS / 100).toFixed(2)} and $${(PRICE_MAX_CENTS / 100).toFixed(2)}`,
      },
      { status: 400 },
    );
  }

  let stripePriceId = pack.stripePriceId;

  try {
    if (!stripePriceId) {
      const product = await stripe.products.create({
        name: title,
        description: pack.description?.trim().slice(0, 500) || undefined,
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.priceCents,
        currency: "usd",
      });
      stripePriceId = price.id;
    } else {
      const price = await stripe.prices.retrieve(stripePriceId);
      const productId =
        typeof price.product === "string"
          ? price.product
          : price.product.id;
      if (price.unit_amount !== pack.priceCents) {
        const newPrice = await stripe.prices.create({
          product: productId,
          unit_amount: pack.priceCents,
          currency: "usd",
        });
        stripePriceId = newPrice.id;
      }
    }
  } catch (e) {
    console.error("Stripe create-pack-product:", e);
    const message =
      e instanceof Error ? e.message : "Could not create Stripe price";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const updated = await prisma.samplePack.update({
    where: { id: packId },
    data: {
      stripePriceId,
      isPublished: true,
    },
  });

  return NextResponse.json({
    pack: {
      id: updated.id,
      isPublished: updated.isPublished,
      stripePriceId: updated.stripePriceId,
    },
  });
}
