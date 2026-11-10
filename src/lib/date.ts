// All date logic uses the user's local calendar day as "YYYY-MM-DD".
// Streaks are a human-calendar concept; we never store wall-clock times for days.

export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map((v) => parseInt(v, 10));
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

export function daysBetween(a: string, b: string): number {
  const d1 = parseLocalDate(a).getTime();
  const d2 = parseLocalDate(b).getTime();
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

export type CheckInMap = Record<string, "PARTIAL" | "FULL">;

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  totalPartials: number;
  completionRate: number; // 0..1 over days since creation
}

// Current streak = consecutive days up to and including today (or yesterday
// if today is empty — we still count what's built before a miss today).
// A FULL counts as 1; a PARTIAL counts (but the streak shows partial state
// on the UI). A missed day breaks the streak.
export function computeStats(
  checkIns: CheckInMap,
  today: string,
  createdAtDate: string,
): StreakStats {
  const todayD = parseLocalDate(today);

  // Longest streak over any window.
  const sortedDates = Object.keys(checkIns).sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sortedDates) {
    if (prev === null || daysBetween(prev, d) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }

  // Current streak: walk back from today; if today empty, start from yesterday.
  let cursor = checkIns[today] ? todayD : addDays(todayD, -1);
  let current = 0;
  while (true) {
    const key = formatLocalDate(cursor);
    if (!checkIns[key]) break;
    current += 1;
    cursor = addDays(cursor, -1);
  }

  const totalCompletions = Object.values(checkIns).filter((v) => v === "FULL").length;
  const totalPartials = Object.values(checkIns).filter((v) => v === "PARTIAL").length;

  const span = Math.max(1, daysBetween(createdAtDate, today) + 1);
  const completionRate = (totalCompletions + totalPartials * 0.5) / span;

  return {
    currentStreak: current,
    longestStreak: longest,
    totalCompletions,
    totalPartials,
    completionRate: Math.min(1, completionRate),
  };
}

export function levelTier(current: number): { name: string; min: number; next: number | null } {
  // Tiers inspired by typical habit-ladder breakpoints.
  const tiers: { name: string; min: number }[] = [
    { name: "Seed", min: 0 },
    { name: "Sprout", min: 3 },
    { name: "Sapling", min: 7 },
    { name: "Grove", min: 14 },
    { name: "Forest", min: 30 },
    { name: "Mountain", min: 60 },
    { name: "Summit", min: 100 },
    { name: "Legend", min: 365 },
  ];
  let idx = 0;
  for (let i = 0; i < tiers.length; i += 1) {
    if (current >= tiers[i].min) idx = i;
  }
  const next = tiers[idx + 1]?.min ?? null;
  return { name: tiers[idx].name, min: tiers[idx].min, next };
}
