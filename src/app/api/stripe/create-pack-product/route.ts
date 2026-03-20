import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Phase 0 - Coming soon" },
    { status: 501 },
  );
}
