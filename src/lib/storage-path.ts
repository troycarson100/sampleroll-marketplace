/**
 * Normalize a stored `file_url` value to the object path inside the `sample-files` bucket.
 * Accepts either a bare path (`userId/file.wav`) or a full Supabase Storage URL.
 */
export function sampleFilesObjectPath(fileUrl: string): string {
  const trimmed = fileUrl.trim();
  const needles = [
    "/storage/v1/object/public/sample-files/",
    "/storage/v1/object/sign/sample-files/",
    "/storage/v1/object/sample-files/",
    "/sample-files/",
  ];
  for (const n of needles) {
    const i = trimmed.indexOf(n);
    if (i >= 0) {
      return decodeURIComponent(trimmed.slice(i + n.length).split("?")[0] ?? "");
    }
  }
  return trimmed.replace(/^\/+/, "");
}
