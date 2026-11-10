import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/TopBar";
import { NewStreakForm } from "@/components/NewStreakForm";
import { StreakCard } from "@/components/StreakCard";
import { formatLocalDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const streaks = await prisma.streak.findMany({
    where: { userId: user.id, archivedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      checkIns: {
        orderBy: { date: "asc" },
      },
    },
  });

  const today = formatLocalDate(new Date());

  return (
    <>
      <TopBar email={user.email} />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="mb-10 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your streaks</h1>
          <p className="text-muted">One row per habit. Open a streak to mark today.</p>
        </section>

        <section className="mb-10">
          <NewStreakForm />
        </section>

        {streaks.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
            <p className="text-muted">No streaks yet — add one above to begin.</p>
          </div>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {streaks.map((s) => {
              const checkIns: Record<string, "PARTIAL" | "FULL"> = {};
              for (const c of s.checkIns) {
                checkIns[c.date] = c.level as "PARTIAL" | "FULL";
              }
              return (
                <li key={s.id}>
                  <Link href={`/streak/${s.id}`} className="block">
                    <StreakCard
                      name={s.name}
                      description={s.description}
                      createdAt={formatLocalDate(s.createdAt)}
                      today={today}
                      checkIns={checkIns}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
