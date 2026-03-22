"use client";

type Props = {
  open: boolean;
  filename: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteSampleModal({
  open,
  filename,
  busy,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div
        className="w-full max-w-md rounded-lg border border-sr bg-sr-card p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-sample-title"
      >
        <h2
          id="delete-sample-title"
          className="font-display text-lg text-sr-ink"
        >
          Remove sample?
        </h2>
        <p className="mt-2 text-sm text-sr-muted">
          This will delete{" "}
          <span className="font-medium text-sr-ink">{filename}</span> from the
          pack and storage. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-sr px-3 py-2 text-sm text-sr-ink hover:bg-sr-panel disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md bg-red-900/80 px-3 py-2 text-sm text-red-100 hover:bg-red-800 disabled:opacity-50"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
