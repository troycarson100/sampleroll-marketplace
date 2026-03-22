"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDropzone } from "react-dropzone";
import type { PackEditorSample } from "./types";
import { SortableSampleRow } from "./sortable-sample-row";
import { DeleteSampleModal } from "./delete-sample-modal";
import { cn } from "@/lib/utils";

type Props = {
  packId: string;
  samples: PackEditorSample[];
  onSamplesChange: (next: PackEditorSample[]) => void;
  appendSamples: (more: PackEditorSample[]) => void;
  onIncrementSampleCount: (delta: number) => void;
};

function loadDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const a = new Audio();
    a.preload = "metadata";
    a.src = url;
    a.onloadedmetadata = () => {
      const d = a.duration;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) ? d : null);
    };
    a.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
  });
}

export function SamplesSection({
  packId,
  samples,
  onSamplesChange,
  appendSamples,
  onIncrementSampleCount,
}: Props) {
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackEditorSample | null>(
    null,
  );
  const [deleteBusy, setDeleteBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(() => samples.map((s) => s.id), [samples]);

  const onDropFiles = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;
      setUploadBusy(true);
      setUploadMsg(null);
      try {
        const durations: (number | null)[] = [];
        for (const f of accepted) {
          durations.push(await loadDuration(f));
        }
        const fd = new FormData();
        for (const f of accepted) {
          fd.append("files", f);
        }
        fd.set("durations", JSON.stringify(durations));
        const res = await fetch(`/api/creator/packs/${packId}/samples`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const data = (await res.json()) as {
          error?: string;
          samples?: PackEditorSample[];
        };
        if (!res.ok) {
          setUploadMsg(data.error ?? "Upload failed");
          return;
        }
        if (data.samples?.length) {
          appendSamples(data.samples);
          onIncrementSampleCount(data.samples.length);
        }
      } catch {
        setUploadMsg("Upload failed");
      } finally {
        setUploadBusy(false);
      }
    },
    [packId, appendSamples, onIncrementSampleCount],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropFiles,
    accept: {
      "audio/wav": [".wav"],
      "audio/x-wav": [".wav"],
      "audio/mpeg": [".mp3"],
      "audio/mp3": [".mp3"],
      "audio/aiff": [".aiff", ".aif"],
      "audio/x-aiff": [".aiff", ".aif"],
    },
    disabled: uploadBusy,
  });

  async function persistOrder(next: PackEditorSample[]) {
    const orderedIds = next.map((s) => s.id);
    const res = await fetch(
      `/api/creator/packs/${packId}/samples/reorder`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
        credentials: "include",
      },
    );
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setUploadMsg(data.error ?? "Could not save order");
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(samples, oldIndex, newIndex).map((s, i) => ({
      ...s,
      sortOrder: i,
    }));
    onSamplesChange(next);
    void persistOrder(next);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(
        `/api/creator/packs/${packId}/samples/${deleteTarget.id}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setUploadMsg(data.error ?? "Delete failed");
        return;
      }
      const next = samples.filter((s) => s.id !== deleteTarget.id);
      onSamplesChange(next);
      onIncrementSampleCount(-1);
      setDeleteTarget(null);
    } catch {
      setUploadMsg("Delete failed");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-sr bg-sr-card p-4">
      <h2 className="font-display text-xl text-sr-ink">Samples</h2>
      <p className="mt-1 text-sm text-sr-muted">
        WAV, AIFF, or MP3 · max 50MB each · drag rows to reorder
      </p>

      <div
        {...getRootProps()}
        className={cn(
          "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-sr bg-sr-bg px-4 py-8 text-center text-sm text-sr-muted",
          isDragActive && "border-sr-gold text-sr-gold",
          uploadBusy && "pointer-events-none opacity-50",
        )}
      >
        <input {...getInputProps()} />
        {uploadBusy ? (
          <p>Uploading…</p>
        ) : (
          <p>Drop audio files here or click to select (multi-file)</p>
        )}
      </div>
      {uploadMsg ? (
        <p className="mt-2 text-sm text-red-400">{uploadMsg}</p>
      ) : null}

      <div className="mt-6 space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {samples.map((s) => (
              <SortableSampleRow
                key={s.id}
                sample={s}
                packId={packId}
                onUpdate={(updated) => {
                  onSamplesChange(
                    samples.map((x) => (x.id === updated.id ? updated : x)),
                  );
                }}
                onDeleteClick={setDeleteTarget}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <DeleteSampleModal
        open={!!deleteTarget}
        filename={deleteTarget?.filename ?? ""}
        busy={deleteBusy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
