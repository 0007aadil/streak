import {
  addDays,
  computeStats,
  formatLocalDate,
  levelTier,
  parseLocalDate,
  type CheckInMap,
} from "@/lib/date";

interface Props {
  name: string;
  description: string | null;
  createdAt: string;
  today: string;
  checkIns: CheckInMap;
}

const TIMELINE_DAYS = 14;

export function StreakCard({ name, description, createdAt, today, checkIns }: Props) {
  const stats = computeStats(checkIns, today, createdAt);
  const tier = levelTier(stats.currentStreak);
  const todayState = checkIns[today];

  const days: { date: string; state: "PARTIAL" | "FULL" | undefined }[] = [];
  const todayDate = parseLocalDate(today);
  for (let i = TIMELINE_DAYS - 1; i >= 0; i -= 1) {
    const d = addDays(todayDate, -i);
    const key = formatLocalDate(d);
    days.push({ date: key, state: checkIns[key] });
  }

  const toNext = tier.next !== null ? Math.max(0, tier.next - stats.currentStreak) : 0;

  return (
    <article className="group relative h-full overflow-hidden rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/40 sm:p-6">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-base font-bold leading-snug sm:text-lg">
            {name}
          </h2>
          {description && (
            <p className="mt-1 break-words text-sm text-muted">{description}</p>
          )}
        </div>
        <TodayStatus state={todayState} />
      </header>

      <div className="mb-5 flex items-baseline gap-2">
        <span className="text-5xl font-bold tracking-tight tabular-nums">
          {stats.currentStreak}
        </span>
        <span className="text-sm text-muted">day streak</span>
      </div>

      <div
        className="mb-4 flex items-center gap-[3px]"
        role="img"
        aria-label={`Last ${TIMELINE_DAYS} days`}
      >
        {days.map((d, i) => {
          const isLast = i === days.length - 1;
          let cls = "h-6 flex-1 rounded-sm transition";
          if (d.state === "FULL") cls += " bg-accent";
          else if (d.state === "PARTIAL") cls += " border border-accent bg-accent/15";
          else cls += " bg-border/50";
          if (isLast && !d.state) cls += " ring-1 ring-inset ring-accent/40";
          return (
            <span
              key={d.date}
              className={cls}
              title={`${d.date}${d.state ? ` — ${d.state.toLowerCase()}` : ""}`}
            />
          );
        })}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted">
        <span>
          Longest <span className="font-medium text-text">{stats.longestStreak}d</span>
        </span>
        <span>
          <span className="font-medium text-text">{tier.name}</span>
          {tier.next !== null && (
            <span className="text-muted"> · {toNext}d to next</span>
          )}
        </span>
      </footer>
    </article>
  );
}

function TodayStatus({ state }: { state: "PARTIAL" | "FULL" | undefined }) {
  if (state === "FULL") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-fg">
        <Check />
        <span>Today</span>
      </span>
    );
  }
  if (state === "PARTIAL") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent px-2.5 py-1 text-xs font-medium text-accent">
        Partial
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted">
      Today
    </span>
  );
}

function Check() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      width="11"
      height="11"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}
