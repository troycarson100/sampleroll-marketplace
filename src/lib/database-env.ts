/** True when Prisma can run queries (Postgres URL present). */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
