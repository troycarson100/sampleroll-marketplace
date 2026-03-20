import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/safe-next-path";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const nextPath = safeNextPath(searchParams.next);

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl text-sr-ink">Sign in</h1>
      <p className="mt-2 text-sm text-sr-muted">
        Sign in to buy packs and access your library.
      </p>
      <div className="mt-8">
        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}
