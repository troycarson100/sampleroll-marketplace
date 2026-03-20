/** Prevent open redirects: only same-origin relative paths allowed. */
export function safeNextPath(next: string | undefined, fallback = "/sounds"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }
  return next;
}
