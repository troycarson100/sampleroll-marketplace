/**
 * Prisma errors are intentionally swallowed in some query helpers so pages stay up.
 * In development, log the underlying error to the terminal (Next dev server output).
 */
export function logPrismaCatalogError(context: string, err: unknown): void {
  if (process.env.NODE_ENV === "production") return;
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : JSON.stringify(err);
  console.error(`[prisma:${context}]`, message);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
}
