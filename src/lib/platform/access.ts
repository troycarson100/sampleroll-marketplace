import { prisma } from "@/lib/db";

export function parsePlatformOwnerEmails(): string[] {
  return (process.env.PLATFORM_OWNER_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformOwnerEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  const norm = email.trim().toLowerCase();
  return parsePlatformOwnerEmails().includes(norm);
}

/** Owner (env allowlist) or supervisor row in DB */
export async function isPlatformStaff(
  userId: string,
  email: string | null | undefined,
): Promise<boolean> {
  if (isPlatformOwnerEmail(email)) return true;
  const row = await prisma.platformStaff.findUnique({
    where: { userId },
    select: { id: true },
  });
  return !!row;
}

/** Only PLATFORM_OWNER_EMAILS — supervisors cannot manage staff */
export function isPlatformOwner(
  email: string | null | undefined,
): boolean {
  return isPlatformOwnerEmail(email);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
