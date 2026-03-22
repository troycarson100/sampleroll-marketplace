"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { PackEditorSample } from "./types";
import { cn } from "@/lib/utils";

type Props = {
  sample: PackEditorSample;
  packId: string;
  onUpdate: (s: PackEditorSample) => void;
  onDeleteClick: (s: PackEditorSample) => void;
};

function formatDuration(sec: number | null) {
  if (sec == null || !Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SortableSampleRow({
  sample,
  packId,
  onUpdate,
  onDeleteClick,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sample.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [filename, setFilename] = useState(sample.filename);
  const [bpm, setBpm] = useState(sample.bpm?.toString() ?? "");
  const [musicalKey, setMusicalKey] = useState(sample.musicalKey ?? "");
  const [instInput, setInstInput] = useState("");
  const [instrumentTags, setInstrumentTags] = useState(sample.instrumentTags);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function saveRow() {
    setBusy(true);
    setMsg(null);
    const bpmVal =
      bpm.trim() === "" ? null : parseInt(bpm, 10);
    if (bpmVal !== null && (!Number.isInteger(bpmVal) || bpmVal < 0 || bpmVal > 999)) {
      setMsg("Invalid BPM");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/creator/packs/${packId}/samples/${sample.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: filename.trim(),
            bpm: bpmVal,
            musicalKey: musicalKey.trim() || null,
            instrumentTags,
          }),
          credentials: "include",
        },
      );
      const data = (await res.json()) as {
        error?: string;
        sample?: PackEditorSample;
      };
      if (!res.ok) {
        setMsg(data.error ?? "Save failed");
        return;
      }
      if (data.sample) {
        onUpdate(data.sample);
        setFilename(data.sample.filename);
        setBpm(data.sample.bpm?.toString() ?? "");
        setMusicalKey(data.sample.musicalKey ?? "");
        setInstrumentTags(data.sample.instrumentTags);
      }
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  }

  function addInst() {
    const t = instInput.trim();
    if (!t || instrumentTags.includes(t) || instrumentTags.length >= 30) return;
    setInstrumentTags((prev) => [...prev, t]);
    setInstInput("");
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-sr bg-sr-bg p-3",
        isDragging && "opacity-60 ring-1 ring-sr-gold",
      )}
    >
      <div className="flex gap-2">
        <button
          type="button"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded border border-sr text-sr-muted hover:bg-sr-panel"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-sr-dim">
            <span>Duration {formatDuration(sample.durationSeconds)}</span>
            {sample.previewUrl ? (
              <audio
                controls
                src={sample.previewUrl}
                className="h-8 max-w-[200px]"
              />
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase text-sr-muted">
                Filename
              </label>
              <input
                className="mt-0.5 w-full rounded border border-sr bg-sr-card px-2 py-1.5 text-sm text-sr-ink"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                maxLength={200}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-sr-muted">BPM</label>
              <input
                className="mt-0.5 w-full rounded border border-sr bg-sr-card px-2 py-1.5 text-sm text-sr-ink"
                value={bpm}
                onChange={(e) => setBpm(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="optional"
                inputMode="numeric"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase text-sr-muted">
                Musical key
              </label>
              <input
                className="mt-0.5 w-full rounded border border-sr bg-sr-card px-2 py-1.5 text-sm text-sr-ink"
                value={musicalKey}
                onChange={(e) => setMusicalKey(e.target.value)}
                placeholder="e.g. C major"
                maxLength={32}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase text-sr-muted">
              Instrument tags
            </label>
            <div className="mt-1 flex flex-wrap gap-1">
              {instrumentTags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-sr-panel px-2 py-0.5 text-xs text-sr-ink"
                >
                  {t}
                  <button
                    type="button"
                    className="text-sr-muted hover:text-sr-ink"
                    onClick={() =>
                      setInstrumentTags((prev) => prev.filter((x) => x !== t))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-1 flex gap-1">
              <input
                className="flex-1 rounded border border-sr bg-sr-card px-2 py-1 text-sm text-sr-ink"
                value={instInput}
                onChange={(e) => setInstInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addInst();
                  }
                }}
                placeholder="Enter to add"
              />
              <button
                type="button"
                onClick={addInst}
                className="rounded border border-sr px-2 py-1 text-xs text-sr-ink hover:bg-sr-panel"
              >
                Add
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void saveRow()}
              disabled={busy}
              className="rounded-md bg-sr-panel px-3 py-1.5 text-sm text-sr-ink hover:bg-sr/80 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save sample"}
            </button>
            <button
              type="button"
              onClick={() => onDeleteClick(sample)}
              className="text-sm text-red-400 hover:underline"
            >
              Delete
            </button>
            {msg ? <span className="text-xs text-red-400">{msg}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
