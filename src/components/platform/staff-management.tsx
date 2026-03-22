"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  id: string;
  userId: string;
  user: { email: string; name: string | null };
};

export function StaffManagement({ initialStaff }: { initialStaff: Row[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/platform/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Failed");
        return;
      }
      setEmail("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string) {
    if (!window.confirm("Remove this supervisor?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/platform/staff/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setMsg(data.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-sr bg-sr-card p-4">
        <h2 className="font-display text-lg text-sr-ink">Add supervisor</h2>
        <p className="mt-1 text-sm text-sr-muted">
          Supervisors can create and send contracts. They cannot add other
          supervisors.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="email"
            className="min-w-[240px] flex-1 rounded border border-sr bg-sr-bg px-3 py-2 text-sm text-sr-ink"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void add()}
            className="rounded-md bg-sr-gold px-4 py-2 text-sm font-medium text-sr-bg disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {msg ? <p className="mt-2 text-sm text-red-400">{msg}</p> : null}
      </div>

      <div>
        <h2 className="font-display text-lg text-sr-ink">Current supervisors</h2>
        <ul className="mt-3 space-y-2">
          {initialStaff.length === 0 ? (
            <li className="text-sm text-sr-muted">None yet.</li>
          ) : (
            initialStaff.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded border border-sr bg-sr-bg px-3 py-2 text-sm"
              >
                <span>
                  <span className="text-sr-ink">{s.user.email}</span>
                  {s.user.name ? (
                    <span className="text-sr-dim"> — {s.user.name}</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void remove(s.userId)}
                  className="text-red-400 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
