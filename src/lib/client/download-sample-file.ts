/**
 * Client-side: fetch same-origin sample file and trigger a browser download (no new tab).
 */

function sanitizeFilename(name: string): string {
  const trimmed = name.trim() || "sample.wav";
  return trimmed.replace(/[/\\?%*:|"<>]+/g, "_");
}

export async function downloadSampleFileFromApi(
  sampleId: string,
  filename: string,
): Promise<void> {
  const res = await fetch(`/api/samples/download/${sampleId}/file`, {
    credentials: "include",
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Download failed");
  }

  const blob = await res.blob();
  const safe = sanitizeFilename(filename);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = safe;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

const BETWEEN_BULK_MS = 450;

export async function downloadSampleFilesSequentially(
  items: { id: string; filename: string }[],
  options?: {
    onProgress?: (done: number, total: number) => void;
    delayMs?: number;
  },
): Promise<{ ok: number; failed: number }> {
  const delayMs = options?.delayMs ?? BETWEEN_BULK_MS;
  let ok = 0;
  let failed = 0;
  const total = items.length;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;
    try {
      await downloadSampleFileFromApi(item.id, item.filename);
      ok++;
      options?.onProgress?.(ok + failed, total);
    } catch {
      failed++;
      options?.onProgress?.(ok + failed, total);
    }
    if (i < items.length - 1 && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return { ok, failed };
}
