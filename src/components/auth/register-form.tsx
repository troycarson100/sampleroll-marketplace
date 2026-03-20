"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/safe-next-path";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  nextPath: string;
};

export function RegisterForm({ nextPath }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signError) {
        setError(signError.message);
        return;
      }
      if (data.session) {
        router.push(safeNextPath(nextPath));
        router.refresh();
        return;
      }
      setInfo(
        "Check your email to confirm your account, then sign in. If confirmations are disabled in Supabase, try signing in now.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="rounded-md border border-sr bg-sr-card px-3 py-2 text-sm text-sr-muted">
          {info}
        </p>
      ) : null}
      <div>
        <label htmlFor="register-email" className="mb-1 block text-sm text-sr-muted">
          Email
        </label>
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="register-password" className="mb-1 block text-sm text-sr-muted">
          Password
        </label>
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-1 text-xs text-sr-dim">At least 6 characters</p>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-sr-muted">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(safeNextPath(nextPath))}`}
          className="text-sr-gold hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
