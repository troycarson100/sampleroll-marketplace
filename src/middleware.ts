import { NextResponse, type NextRequest } from "next/server";

/**
 * NextAuth uses JWT cookies. We do not call `updateSupabaseSession` from
 * `@/lib/supabase/middleware` here — that helper is for Supabase Auth only.
 * See `docs/SUPABASE_SSR_HELPERS.md`.
 */
export function middleware(_request: NextRequest) {
  void _request;
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
