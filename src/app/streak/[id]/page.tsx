import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/TopBar";
import { StreakDetail } from "@/components/StreakDetail";
import { formatLocalDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function StreakPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const streak = await prisma.streak.findFirst({
    where: { id, userId: user.id },
    include: { checkIns: { orderBy: { date: "asc" } } },
  });
  if (!streak) notFound();

  const initial: Record<string, "PARTIAL" | "FULL"> = {};
  for (const c of streak.checkIns) initial[c.date] = c.level as "PARTIAL" | "FULL";

  return (
    <>
      <TopBar
        email={user.email}
        back={{ href: "/dashboard", label: "Back to dashboard" }}
        title={streak.name}
      />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <StreakDetail
          id={streak.id}
          name={streak.name}
          description={streak.description}
          createdAt={formatLocalDate(streak.createdAt)}
          initialCheckIns={initial}
        />
      </main>
    </>
  );
}
