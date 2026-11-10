"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewStreakForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/streaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create streak");
        return;
      }
      setName("");
      setDescription("");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium hover:bg-bg sm:w-auto sm:py-2.5"
      >
        <span aria-hidden>+</span>
        <span>Add a streak</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="space-y-1.5">
        <label htmlFor="streak-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="streak-name"
          autoFocus
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Read 20 minutes"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-base outline-none focus:border-accent"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="streak-desc" className="text-sm font-medium">
          Description <span className="text-muted">(optional)</span>
        </label>
        <input
          id="streak-desc"
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Anything that helps keep this honest"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-base outline-none focus:border-accent"
        />
      </div>
      {error && (
        <div role="alert" className="text-sm text-text">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
        >
          {busy ? "Adding…" : "Add streak"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-bg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
