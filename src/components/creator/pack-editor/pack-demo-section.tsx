"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import type { PackEditorPack } from "./types";

type Props = {
  pack: PackEditorPack;
  onPackUpdate: (p: Partial<PackEditorPack>) => void;
};

export function PackDemoSection({ pack, onPackUpdate }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      setBusy(true);
      setMessage(null);
      try {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch(`/api/creator/packs/${pack.id}/demo`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok) {
          setMessage(data.error ?? "Demo upload failed");
          return;
        }
        if (data.url) {
          onPackUpdate({ demoPreviewUrl: data.url });
        }
      } catch {
        setMessage("Demo upload failed");
      } finally {
        setBusy(false);
      }
    },
    [pack.id, onPackUpdate],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/wav": [],
      "audio/x-wav": [],
      "audio/mpeg": [],
      "audio/mp3": [],
      "audio/aiff": [],
      "audio/x-aiff": [],
    },
    maxFiles: 1,
    disabled: busy,
  });

  async function removeDemo() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/creator/packs/${pack.id}/demo`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Could not remove demo");
        return;
      }
      onPackUpdate({ demoPreviewUrl: null });
    } catch {
      setMessage("Could not remove demo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-sr bg-sr-card p-6">
      <h2 className="font-display text-xl text-sr-ink">Marketplace demo</h2>
      <p className="mt-2 text-sm text-sr-muted">
        Upload a single mixed demo track for the pack page. This is separate from
        your individual samples — buyers use it to preview the vibe before
        purchasing.
      </p>

      {message ? (
        <p className="mt-3 text-sm text-red-300">{message}</p>
      ) : null}

      {pack.demoPreviewUrl ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <audio controls className="h-9 max-w-full" src={pack.demoPreviewUrl} />
          <button
            type="button"
            onClick={() => void removeDemo()}
            disabled={busy}
            className="rounded-md border border-red-900/50 px-3 py-1.5 text-sm text-red-200 hover:bg-red-950/40 disabled:opacity-50"
          >
            Remove demo
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-sr-dim px-4 py-8 transition-colors",
            isDragActive && "border-sr-gold bg-sr-panel/50",
            busy && "pointer-events-none opacity-50",
          )}
        >
          <input {...getInputProps()} />
          <p className="text-sm text-sr-muted">
            Drop a demo WAV/MP3/AIFF here, or click to choose
          </p>
          <p className="mt-1 text-xs text-sr-dim">Max 25MB</p>
        </div>
      )}
    </section>
  );
}
