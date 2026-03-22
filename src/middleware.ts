import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * NextAuth uses JWT cookies. Creator routes require a session (portal layout
 * also checks `is_creator`).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/platform")) {
    const secret =
      process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
    if (secret) {
      const token = await getToken({ req: request, secret });
      const userId = (token?.sub as string) || (token?.id as string);
      if (!userId) {
        const login = new URL("/login", request.url);
        login.searchParams.set(
          "next",
          pathname + request.nextUrl.search,
        );
        return NextResponse.redirect(login);
      }
    }
  }

  if (pathname.startsWith("/creator")) {
    const secret =
      process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
    if (secret) {
      const token = await getToken({ req: request, secret });
      const userId = (token?.sub as string) || (token?.id as string);
      if (!userId) {
        const login = new URL("/login", request.url);
        login.searchParams.set(
          "next",
          pathname + request.nextUrl.search,
        );
        return NextResponse.redirect(login);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
