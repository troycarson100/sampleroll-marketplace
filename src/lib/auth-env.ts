import { NextResponse } from "next/server";

export function isProductionAuthSecretMissing(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }
  return !(
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()
  );
}

/** Non-session auth routes when secret is missing (sign-in, callbacks, etc.). */
export function authSecretMissingResponse() {
  return NextResponse.json(
    {
      error: "AUTH_SECRET_MISSING",
      message:
        "Set AUTH_SECRET or NEXTAUTH_SECRET in your hosting environment (e.g. Vercel → Settings → Environment Variables), then redeploy. Generate a value with: openssl rand -base64 32",
    },
    { status: 503 },
  );
}

/**
 * Lets `useSession` / `getSession` succeed as “logged out” so public pages don’t
 * hard-error when someone deploys without secrets yet.
 */
export function emptySessionResponse() {
  return NextResponse.json({});
}
