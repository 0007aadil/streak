"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface TopBarProps {
  email: string;
  back?: { href: string; label?: string };
  title?: string;
}

export function TopBar({ email, back, title }: TopBarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onClickOutside);
        document.removeEventListener("keydown", onKey);
      };
    }
  }, [menuOpen]);

  async function signOut() {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-2 sm:h-16 sm:gap-3 sm:px-6">
        {/* Mobile: back arrow (shown only when back prop provided) */}
        {back ? (
          <Link
            href={back.href}
            aria-label={back.label ?? "Back"}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text hover:bg-bg md:hidden"
          >
            <ChevronLeft />
          </Link>
        ) : null}

        {/* Mobile: title (on detail pages) or brand (on root pages) */}
        <div className="min-w-0 flex-1 md:hidden">
          {back && title ? (
            <p className="truncate text-base font-medium">{title}</p>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 pl-2 font-medium"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              Streak
            </Link>
          )}
        </div>

        {/* Desktop: brand + breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="hidden min-w-0 flex-1 items-center gap-3 md:flex"
        >
          <Link
            href="/dashboard"
            className="inline-flex shrink-0 items-center gap-2 font-medium"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            Streak
          </Link>
          {back && title ? (
            <>
              <span aria-hidden className="text-muted">
                /
              </span>
              <span className="truncate text-sm text-muted">{title}</span>
            </>
          ) : null}
        </nav>

        {/* Desktop: email + sign out */}
        <div className="hidden items-center gap-3 md:flex">
          <span className="max-w-[20ch] truncate text-sm text-muted">{email}</span>
          <button
            onClick={signOut}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-bg"
          >
            Sign out
          </button>
        </div>

        {/* Mobile: overflow menu */}
        <div ref={menuRef} className="relative md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((s) => !s)}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-bg"
          >
            <Dots />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
            >
              <div className="border-b border-border px-3 py-2.5">
                <p className="text-xs uppercase tracking-wide text-muted">
                  Signed in as
                </p>
                <p className="truncate text-sm">{email}</p>
              </div>
              <button
                role="menuitem"
                onClick={signOut}
                className="w-full px-3 py-3 text-left text-sm hover:bg-bg"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function ChevronLeft() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function Dots() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <circle cx="5" cy="12" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="19" cy="12" r="1.9" />
    </svg>
  );
}
