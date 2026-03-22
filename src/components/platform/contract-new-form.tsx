"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ContractNewForm() {
  const router = useRouter();
  const [creatorEmail, setCreatorEmail] = useState("");
  const [splitPercentage, setSplitPercentage] = useState("75");
  const [title, setTitle] = useState("Revenue share agreement");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);

  async function createDraft() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/platform/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorEmail,
          splitPercentage: parseInt(splitPercentage, 10),
          title,
          notes,
        }),
        credentials: "include",
      });
      const data = (await res.json()) as {
        error?: string;
        contract?: { id: string };
      };
      if (!res.ok) {
        setMessage(data.error ?? "Failed");
        return;
      }
      if (data.contract?.id) {
        setContractId(data.contract.id);
        setStep(2);
      }
    } finally {
      setBusy(false);
    }
  }

  async function uploadPdf() {
    if (!contractId || !file) {
      setMessage("Choose a PDF");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch(`/api/platform/contracts/${contractId}/legal`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Upload failed");
        return;
      }
      setStep(3);
    } finally {
      setBusy(false);
    }
  }

  async function sendInvite() {
    if (!contractId) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/platform/contracts/${contractId}/send`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as {
        error?: string;
        email?: { acceptUrl?: string; sent?: boolean; hint?: string };
      };
      if (!res.ok) {
        setMessage(data.error ?? "Send failed");
        return;
      }
      setAcceptUrl(data.email?.acceptUrl ?? null);
      setMessage(
        data.email?.sent
          ? "Email sent to the creator."
          : data.email?.hint ?? "Copy the link below for the creator.",
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-lg border border-sr bg-sr-card p-6">
      <h1 className="font-display text-2xl text-sr-ink">New contract</h1>
      <p className="mt-1 text-sm text-sr-muted">
        Step {step} of 3: draft → upload PDF → send for approval
      </p>

      {message ? (
        <p className="mt-4 rounded border border-sr bg-sr-bg px-3 py-2 text-sm text-sr-muted">
          {message}
        </p>
      ) : null}
      {acceptUrl ? (
        <p className="mt-2 break-all text-xs text-sr-dim">
          <span className="font-medium text-sr-ink">Review link: </span>
          {acceptUrl}
        </p>
      ) : null}

      {step === 1 ? (
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs uppercase text-sr-muted">
              Creator email (registered user)
            </label>
            <input
              className="mt-1 w-full rounded border border-sr bg-sr-bg px-3 py-2 text-sm text-sr-ink"
              type="email"
              value={creatorEmail}
              onChange={(e) => setCreatorEmail(e.target.value)}
              placeholder="creator@example.com"
            />
          </div>
          <div>
            <label className="text-xs uppercase text-sr-muted">
              Creator revenue share %
            </label>
            <input
              className="mt-1 w-full max-w-[120px] rounded border border-sr bg-sr-bg px-3 py-2 text-sm text-sr-ink"
              type="number"
              min={0}
              max={100}
              value={splitPercentage}
              onChange={(e) => setSplitPercentage(e.target.value)}
            />
            <p className="mt-1 text-xs text-sr-dim">
              Platform keeps the rest (e.g. 75 → 25% platform).
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-sr-muted">Title</label>
            <input
              className="mt-1 w-full rounded border border-sr bg-sr-bg px-3 py-2 text-sm text-sr-ink"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase text-sr-muted">
              Internal notes (optional)
            </label>
            <textarea
              className="mt-1 min-h-[80px] w-full rounded border border-sr bg-sr-bg px-3 py-2 text-sm text-sr-ink"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void createDraft()}
            className="rounded-md bg-sr-gold px-4 py-2 text-sm font-medium text-sr-bg hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Continue"}
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-sr-muted">
            Upload the legal agreement as PDF (max 15MB).
          </p>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void uploadPdf()}
              className="rounded-md bg-sr-gold px-4 py-2 text-sm font-medium text-sr-bg hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Uploading…" : "Upload & continue"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-md border border-sr px-4 py-2 text-sm text-sr-ink"
            >
              Back
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-sr-muted">
            Send the creator an email (if Resend is configured) and mark the
            contract as pending their approval.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void sendInvite()}
              className="rounded-md bg-sr-gold px-4 py-2 text-sm font-medium text-sr-bg hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send to creator"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/platform/contracts")}
              className="rounded-md border border-sr px-4 py-2 text-sm text-sr-ink"
            >
              Done / list
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
