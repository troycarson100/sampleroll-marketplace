import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import {
  authSecretMissingResponse,
  emptySessionResponse,
  isProductionAuthSecretMissing,
} from "@/lib/auth-env";

function isSessionGet(req: NextRequest) {
  return req.nextUrl.pathname.endsWith("/session");
}

export async function GET(req: NextRequest) {
  if (isProductionAuthSecretMissing()) {
    if (isSessionGet(req)) {
      return emptySessionResponse();
    }
    return authSecretMissingResponse();
  }
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  if (isProductionAuthSecretMissing()) {
    return authSecretMissingResponse();
  }
  return handlers.POST(req);
}
