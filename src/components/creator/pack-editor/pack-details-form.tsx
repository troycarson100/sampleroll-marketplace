"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import {
  CREATOR_PACK_GENRES,
  PRICE_MAX_CENTS,
  PRICE_MIN_CENTS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PackEditorPack } from "./types";

type Props = {
  pack: PackEditorPack;
  onPackUpdate: (p: Partial<PackEditorPack>) => void;
};

function centsToDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

function parseDollarsToCents(s: string): number | null {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function PackDetailsForm({ pack, onPackUpdate }: Props) {
  const [title, setTitle] = useState(pack.title);
  const [description, setDescription] = useState(pack.description);
  const [genre, setGenre] = useState(pack.genre);

  const genreOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const g of [genre, ...CREATOR_PACK_GENRES]) {
      if (!seen.has(g)) {
        seen.add(g);
        out.push(g);
      }
    }
    return out;
  }, [genre]);
  const [tags, setTags] = useState<string[]>(pack.tags);
  const [tagInput, setTagInput] = useState("");
  const [priceStr, setPriceStr] = useState(centsToDollars(pack.priceCents));
  const [coverUrl, setCoverUrl] = useState(pack.coverArtUrl);
  const [busy, setBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onDropCover = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      setCoverBusy(true);
      setMessage(null);
      try {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch(`/api/creator/packs/${pack.id}/cover`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok) {
          setMessage(data.error ?? "Cover upload failed");
          return;
        }
        if (data.url) {
          setCoverUrl(data.url);
          onPackUpdate({ coverArtUrl: data.url });
        }
      } catch {
        setMessage("Cover upload failed");
      } finally {
        setCoverBusy(false);
      }
    },
    [pack.id, onPackUpdate],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCover,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
    disabled: coverBusy,
  });

  function addTag() {
    const t = tagInput.trim();
    if (!t || tags.includes(t) || tags.length >= 40) return;
    setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  async function savePack() {
    setBusy(true);
    setMessage(null);
    const priceCents = parseDollarsToCents(priceStr);
    if (priceCents == null) {
      setMessage("Invalid price");
      setBusy(false);
      return;
    }
    if (priceCents < PRICE_MIN_CENTS || priceCents > PRICE_MAX_CENTS) {
      setMessage(
        `Price must be between $${(PRICE_MIN_CENTS / 100).toFixed(2)} and $${(PRICE_MAX_CENTS / 100).toFixed(2)}`,
      );
      setBusy(false);
      return;
    }

    try {
      const res = await fetch(`/api/creator/packs/${pack.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description,
          genre,
          tags,
          priceCents,
        }),
        credentials: "include",
      });
      const data = (await res.json()) as {
        error?: string;
        pack?: PackEditorPack;
      };
      if (!res.ok) {
        setMessage(data.error ?? "Save failed");
        return;
      }
      if (data.pack) {
        onPackUpdate(data.pack);
        setTitle(data.pack.title);
        setDescription(data.pack.description);
        setGenre(data.pack.genre);
        setTags(data.pack.tags);
        setPriceStr(centsToDollars(data.pack.priceCents));
        setCoverUrl(data.pack.coverArtUrl);
      }
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-sr bg-sr-card p-4">
      <h2 className="font-display text-xl text-sr-ink">Pack details</h2>
      <p className="mt-1 text-sm text-sr-muted">
        Save changes before publishing. Cover uploads apply immediately.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_200px]">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-sr-muted">
              Title
            </label>
            <input
              className="mt-1 w-full rounded-md border border-sr bg-sr-bg px-3 py-2 text-sm text-sr-ink"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-sr-muted">
              Description
            </label>
            <textarea
              className="mt-1 min-h-[120px] w-full rounded-md border border-sr bg-sr-bg px-3 py-2 text-sm text-sr-ink"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-sr-muted">
              Genre
            </label>
            <select
              className="mt-1 w-full rounded-md border border-sr bg-sr-bg px-3 py-2 text-sm text-sr-ink"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              {genreOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-sr-muted">
              Tags
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-sr-panel px-2 py-0.5 text-xs text-sr-ink"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="text-sr-muted hover:text-sr-ink"
                    aria-label={`Remove ${t}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 rounded-md border border-sr bg-sr-bg px-3 py-2 text-sm text-sr-ink"
                placeholder="Add tag, press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-md border border-sr px-3 py-2 text-sm text-sr-ink hover:bg-sr-panel"
              >
                Add
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-sr-muted">
              Price (USD)
            </label>
            <input
              className="mt-1 w-full max-w-[200px] rounded-md border border-sr bg-sr-bg px-3 py-2 text-sm text-sr-ink"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-sr-muted">
            Cover art
          </label>
          <div
            {...getRootProps()}
            className={cn(
              "mt-1 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-sr bg-sr-bg p-4 text-center text-sm text-sr-muted transition-colors",
              isDragActive && "border-sr-gold text-sr-gold",
              coverBusy && "pointer-events-none opacity-50",
            )}
          >
            <input {...getInputProps()} />
            {coverUrl ? (
              <div className="relative h-40 w-full">
                <Image
                  src={coverUrl}
                  alt="Cover"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <p>Drop an image or click to upload</p>
            )}
            <p className="mt-2 text-xs">JPEG, PNG, WebP · max 8MB</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void savePack()}
          disabled={busy}
          className="rounded-md bg-sr-gold px-4 py-2 text-sm font-medium text-sr-bg hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save pack details"}
        </button>
        {message ? (
          <span className="text-sm text-red-400">{message}</span>
        ) : null}
      </div>
    </section>
  );
}
