/**
 * Parse a fetch Response as JSON without throwing on empty body or HTML error pages.
 */
export async function parseFetchJson<T>(res: Response): Promise<
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string }
> {
  const text = await res.text();
  const trimmed = text.trim();

  if (!trimmed) {
    if (res.ok) {
      return { ok: true, status: res.status, data: {} as T };
    }
    return {
      ok: false,
      status: res.status,
      error: `Request failed (${res.status} ${res.statusText || ""}). Empty response.`,
    };
  }

  try {
    return { ok: true, status: res.status, data: JSON.parse(trimmed) as T };
  } catch {
    return {
      ok: false,
      status: res.status,
      error: `Server returned non-JSON (${res.status}). Try: npm run clean:dev, then restart dev.`,
    };
  }
}
