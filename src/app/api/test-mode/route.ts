import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  isTestModeAllowed,
  isTestModeCookieOn,
  TEST_MODE_COOKIE,
} from "@/lib/test-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  const allowed = isTestModeAllowed();
  const enabled =
    allowed && isTestModeCookieOn(cookies().get(TEST_MODE_COOKIE)?.value);
  return NextResponse.json({ allowed, enabled });
}

export async function POST(request: Request) {
  const allowed = isTestModeAllowed();
  if (!allowed) {
    return NextResponse.json(
      { error: "Test mode is disabled on this environment." },
      { status: 403 },
    );
  }

  let body: { enabled?: boolean } = {};
  try {
    body = (await request.json()) as { enabled?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const enabled = Boolean(body.enabled);
  const res = NextResponse.json({ allowed, enabled });
  res.cookies.set({
    name: TEST_MODE_COOKIE,
    value: enabled ? "1" : "0",
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
