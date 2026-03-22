"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CreatorOnboardForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarUrl(null);
    setAvatarPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let finalAvatarUrl = avatarUrl;
      if (avatarFile && !finalAvatarUrl) {
        const fd = new FormData();
        fd.set("file", avatarFile);
        const up = await fetch("/api/creator/upload-avatar", {
          method: "POST",
          body: fd,
        });
        const data = (await up.json()) as { url?: string; error?: string };
        if (!up.ok) {
          setError(data.error ?? "Avatar upload failed");
          return;
        }
        finalAvatarUrl = data.url ?? null;
        setAvatarUrl(finalAvatarUrl);
      }

      const res = await fetch("/api/creator/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio: bio.trim() || undefined,
          avatarUrl: finalAvatarUrl,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save profile");
        return;
      }

      const stripeRes = await fetch("/api/creator/stripe-connect/account-link", {
        method: "POST",
        credentials: "include",
      });
      const stripeData = (await stripeRes.json()) as {
        url?: string;
        error?: string;
      };
      if (stripeRes.ok && stripeData.url) {
        window.location.href = stripeData.url;
        return;
      }

      router.push("/creator/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-[560px] rounded-xl border border-sr bg-sr-card px-6 py-8 shadow-lg"
    >
      <h1 className="font-display text-3xl text-sr-ink">Become a Creator</h1>
      <p className="mt-2 text-sm text-sr-muted">
        Upload sample packs, set your price, earn 75% of every sale.
      </p>

      {error ? (
        <p className="mt-4 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-8 space-y-6">
        <div>
          <label className="mb-1 block text-sm text-sr-muted" htmlFor="displayName">
            Display name <span className="text-red-400">*</span>
          </label>
          <Input
            id="displayName"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your artist name"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-sr-muted" htmlFor="bio">
            Bio <span className="text-sr-dim">(optional, max 500)</span>
          </label>
          <textarea
            id="bio"
            rows={4}
            maxLength={500}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-md border border-sr bg-sr-bg px-3 py-2 text-sm text-sr-ink placeholder:text-sr-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-sr-gold"
            placeholder="Tell buyers about your sound…"
          />
          <p className="mt-1 text-xs text-sr-dim">{bio.length}/500</p>
        </div>

        <div>
          <p className="mb-2 text-sm text-sr-muted">Avatar</p>
          <div
            {...getRootProps()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-sr-dim transition-colors",
              isDragActive && "border-sr-gold bg-sr-panel",
            )}
            style={{ width: 120, height: 120, margin: "0 auto" }}
          >
            <input {...getInputProps()} />
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="px-2 text-center text-xs text-sr-muted">
                Drop or click
              </span>
            )}
          </div>
        </div>

        <div className="rounded-md border border-sr bg-sr-bg/80 px-3 py-3">
          <p className="text-sm font-medium text-sr-ink">Payouts with Stripe</p>
          <p className="mt-1 text-xs text-sr-muted">
            After you save, you&apos;ll go to Stripe to connect your bank (Express
            account). SampleRoll uses Stripe Connect for creator payouts.
          </p>
        </div>
      </div>

      <Button type="submit" className="mt-8 w-full" disabled={loading}>
        {loading ? "Saving…" : "Start Creating →"}
      </Button>
    </form>
  );
}
