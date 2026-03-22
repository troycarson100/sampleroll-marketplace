import type { ReactNode } from "react";

/** Session gate for /creator/* is enforced in middleware (JWT). This layout is a visual shell. */
export default function CreatorRootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-sr-bg pb-16 pt-8">{children}</div>
  );
}
