/** Public object URL for Supabase Storage (public buckets). */
export function supabasePublicObjectUrl(bucket: string, objectPath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()?.replace(/\/$/, "") ?? "";
  const path = objectPath.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
