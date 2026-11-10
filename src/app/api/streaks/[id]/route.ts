import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { updateStreakSchema } from "@/lib/validation";

async function ownStreak(userId: string, id: string) {
  return prisma.streak.findFirst({ where: { id, userId } });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const streak = await ownStreak(user.id, id);
  if (!streak) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const checkIns = await prisma.checkIn.findMany({
    where: { streakId: streak.id },
    orderBy: { date: "asc" },
  });
  return NextResponse.json({ streak, checkIns });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const streak = await ownStreak(user.id, id);
  if (!streak) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = updateStreakSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const updated = await prisma.streak.update({
    where: { id: streak.id },
    data: parsed.data,
  });
  return NextResponse.json({ streak: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const streak = await ownStreak(user.id, id);
  if (!streak) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.streak.delete({ where: { id: streak.id } });
  return NextResponse.json({ ok: true });
}
