"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  computeStats,
  formatLocalDate,
  levelTier,
  parseLocalDate,
  type CheckInMap,
} from "@/lib/date";

type Level = "NONE" | "PARTIAL" | "FULL";

interface Props {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  initialCheckIns: CheckInMap;
}

export function StreakDetail({ id, name, description, createdAt, initialCheckIns }: Props) {
  const router = useRouter();
  const [checkIns, setCheckIns] = useState<CheckInMap>(initialCheckIns);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [todayLabel, setTodayLabel] = useState<string | null>(null);

  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    );
  }, []);

  const today = formatLocalDate(new Date());
  const stats = useMemo(() => computeStats(checkIns, today, createdAt), [checkIns, today, createdAt]);
  const tier = levelTier(stats.currentStreak);

  async function setLevel(date: string, level: Level) {
    setBusy(date);
    setError(null);
    const prev = { ...checkIns };
    const optimistic = { ...checkIns };
    if (level === "NONE") delete optimistic[date];
    else optimistic[date] = level;
    setCheckIns(optimistic);
    try {
      const res = await fetch(`/api/streaks/${id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, level }),
      });
      if (!res.ok) {
        setCheckIns(prev);
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not save");
      }
    } catch {
      setCheckIns(prev);
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }

  async function del() {
    const res = await fetch(`/api/streaks/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  const todayState = checkIns[today];
  const toNextTier = tier.next !== null ? Math.max(0, tier.next - stats.currentStreak) : 0;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">
          {name}
        </h1>
        {description && <p className="break-words text-muted">{description}</p>}
      </header>

      <section
        aria-label="Mark today"
        className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm uppercase tracking-wide text-muted">Today</p>
            <p className="break-words text-lg font-medium sm:text-xl">
              {todayLabel ?? <>&nbsp;</>}
            </p>
          </div>
          <TodayBadge state={todayState} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <ActionButton
            active={todayState === undefined}
            onClick={() => setLevel(today, "NONE")}
            disabled={busy === today}
            label="Not yet"
            tone="muted"
          />
          <ActionButton
            active={todayState === "PARTIAL"}
            onClick={() => setLevel(today, "PARTIAL")}
            disabled={busy === today}
            label="Partial"
            tone="outline"
          />
          <ActionButton
            active={todayState === "FULL"}
            onClick={() => setLevel(today, "FULL")}
            disabled={busy === today}
            label="Full"
            tone="accent"
          />
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-text">
            {error}
          </p>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Current" value={`${stats.currentStreak}d`} />
        <StatTile label="Longest" value={`${stats.longestStreak}d`} />
        <StatTile label="Full days" value={String(stats.totalCompletions)} />
        <StatTile label="Partial days" value={String(stats.totalPartials)} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm uppercase tracking-wide text-muted">Level</h2>
          <span className="text-sm text-muted">
            {tier.next !== null ? `${toNextTier}d to next tier` : "Max tier reached"}
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold">{tier.name}</span>
          <span className="text-sm text-muted">· {Math.round(stats.completionRate * 100)}% overall</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border/60">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{
              width: `${
                tier.next === null
                  ? 100
                  : Math.min(
                      100,
                      Math.round(
                        ((stats.currentStreak - tier.min) / (tier.next - tier.min)) * 100,
                      ),
                    )
              }%`,
            }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-wide text-muted">History</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-sm hover:bg-bg"
              aria-label="Previous month"
            >
              ←
            </button>
            <span className="min-w-[8ch] text-center text-sm font-medium">
              <MonthLabel cursor={cursor} />
            </span>
            <button
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-sm hover:bg-bg"
              aria-label="Next month"
            >
              →
            </button>
          </div>
        </div>
        <Calendar
          cursor={cursor}
          today={today}
          checkIns={checkIns}
          onCycle={(date) => {
            const curr = checkIns[date];
            const nextState: Level = curr === undefined ? "FULL" : curr === "FULL" ? "PARTIAL" : "NONE";
            setLevel(date, nextState);
          }}
          busy={busy}
        />
        <Legend />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="mb-2 text-sm uppercase tracking-wide text-muted">Danger zone</h2>
        {confirmingDelete ? (
          <div className="flex items-center gap-3">
            <p className="text-sm">Delete this streak and all its check-ins? This cannot be undone.</p>
            <button
              onClick={del}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-bg"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="rounded-md px-3 py-1.5 text-sm text-muted hover:text-text"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-bg"
          >
            Delete streak
          </button>
        )}
      </section>
    </div>
  );
}

function ActionButton({
  active,
  disabled,
  onClick,
  label,
  tone,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
  tone: "muted" | "outline" | "accent";
}) {
  const base =
    "w-full rounded-lg px-4 py-3 text-sm font-medium transition disabled:opacity-60";
  let cls = base;
  if (tone === "accent") {
    cls += active
      ? " bg-accent text-accent-fg"
      : " border border-border bg-surface hover:bg-bg";
  } else if (tone === "outline") {
    cls += active
      ? " border border-accent text-accent"
      : " border border-border bg-surface hover:bg-bg";
  } else {
    cls += active
      ? " border border-border bg-bg text-muted"
      : " border border-transparent text-muted hover:bg-bg";
  }
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {label}
    </button>
  );
}

function TodayBadge({ state }: { state: "PARTIAL" | "FULL" | undefined }) {
  if (state === "FULL") {
    return (
      <span className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-fg">
        Marked full
      </span>
    );
  }
  if (state === "PARTIAL") {
    return (
      <span className="rounded-full border border-accent px-3 py-1 text-sm font-medium text-accent">
        Marked partial
      </span>
    );
  }
  return (
    <span className="rounded-full border border-border px-3 py-1 text-sm text-muted">
      Not marked
    </span>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Calendar({
  cursor,
  today,
  checkIns,
  onCycle,
  busy,
}: {
  cursor: Date;
  today: string;
  checkIns: CheckInMap;
  onCycle: (date: string) => void;
  busy: string | null;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay(); // 0..6, Sun first

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {weekdayLabels.map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} aria-hidden className="aspect-square" />;
          const key = formatLocalDate(d);
          const state = checkIns[key];
          const isToday = key === today;
          const isFuture = key > today;
          let cls =
            "relative aspect-square rounded-md text-sm transition disabled:opacity-40";
          if (state === "FULL") cls += " bg-accent text-accent-fg";
          else if (state === "PARTIAL")
            cls += " border border-accent text-accent bg-surface";
          else cls += " border border-border bg-surface hover:bg-bg";
          if (isToday && !state) cls += " ring-2 ring-accent/60 ring-offset-1 ring-offset-surface";
          return (
            <button
              key={key}
              type="button"
              onClick={() => onCycle(key)}
              disabled={isFuture || busy === key}
              className={cls}
              aria-label={`${key} — ${state ?? "not marked"}`}
              title={state ? `${key}: ${state.toLowerCase()}` : `${key}: tap to mark`}
            >
              <span className="absolute inset-0 flex items-center justify-center">
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonthLabel({ cursor }: { cursor: Date }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    setLabel(cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" }));
  }, [cursor]);
  return <>{label ?? `${cursor.getFullYear()}`}</>;
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm border border-border bg-surface" />
        None
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm border border-accent" />
        Partial
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm bg-accent" />
        Full
      </span>
      <span className="ml-auto">Tap a day to cycle: none → full → partial → none.</span>
    </div>
  );
}
