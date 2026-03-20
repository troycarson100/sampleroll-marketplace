import { RegisterForm } from "@/components/auth/register-form";
import { safeNextPath } from "@/lib/safe-next-path";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const nextPath = safeNextPath(searchParams.next);

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl text-sr-ink">Create account</h1>
      <p className="mt-2 text-sm text-sr-muted">
        Sign up to purchase sample packs on SampleRoll.
      </p>
      <div className="mt-8">
        <RegisterForm nextPath={nextPath} />
      </div>
    </main>
  );
}
