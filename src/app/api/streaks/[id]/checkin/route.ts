import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { checkInSchema } from "@/lib/validation";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const streak = await prisma.streak.findFirst({ where: { id, userId: user.id } });
  if (!streak) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { date, level, note } = parsed.data;
  if (level === "NONE") {
    await prisma.checkIn.deleteMany({ where: { streakId: streak.id, date } });
    return NextResponse.json({ ok: true, level: "NONE" });
  }

  await prisma.checkIn.upsert({
    where: { streakId_date: { streakId: streak.id, date } },
    create: { streakId: streak.id, date, level, note: note ?? null },
    update: { level, note: note ?? null },
  });
  return NextResponse.json({ ok: true, level });
}
