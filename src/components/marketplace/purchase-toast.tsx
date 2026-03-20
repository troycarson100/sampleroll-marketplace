"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function PurchaseToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(searchParams.get("purchased") === "true");
  }, [searchParams]);

  function dismiss() {
    setOpen(false);
    router.replace(pathname);
  }

  if (!open) return null;

  return (
    <div
      role="status"
      className="mb-10 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-950/75 px-4 py-3.5 text-sm text-emerald-50 shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-emerald-500/25 backdrop-blur-md"
    >
      <span className="leading-snug">
        Pack purchased! You can now download all samples.
      </span>
      <button
        type="button"
        className="rounded-lg bg-emerald-900/50 px-3 py-1.5 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/20 transition-colors hover:bg-emerald-900/80"
        onClick={() => dismiss()}
      >
        Dismiss
      </button>
    </div>
  );
}
