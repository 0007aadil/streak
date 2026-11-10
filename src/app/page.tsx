import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";

export default async function LandingPage() {
  const userId = await getSessionUserId();
  if (userId) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 text-sm text-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          Streak
        </div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Keep your days.
          <br />
          <span className="bg-gradient-to-br from-accent to-[#FF8A5B] bg-clip-text text-transparent">
            One habit at a time.
          </span>
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Add a streak. Open it each day. Mark it done — partial or full. Watch the chain grow. Your
          data stays private and encrypted in transit.
        </p>
        <div className="flex gap-3 pt-2">
          <Link
            href="/signup"
            className="inline-flex items-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg hover:opacity-90"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-bg"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
