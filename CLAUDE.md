# Streak

Minimal, cross-platform streak/habit tracker. A responsive web app — works in any browser on Mac, Windows, iPhone, iPad, Android.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **React 18**
- **Tailwind CSS 3** with CSS-variable design tokens (light/dark via `prefers-color-scheme`)
- **Prisma 5** + **SQLite** (`prisma/dev.db`). Swap `DATABASE_URL` for Postgres with no code changes.
- Auth: **bcrypt** (cost 12) + **jose** JWT in an `httpOnly` `SameSite=Lax` `Secure` cookie (`streak_session`)
- Validation: **Zod** on every API body

## Commands

```bash
npm install          # installs deps, runs prisma generate via postinstall
npm run db:push      # sync Prisma schema to dev.db (dev only)
npm run dev          # http://localhost:3000
npm run build        # prisma generate + next build
npm start            # production server
```

To preview from here, use `preview_start name="streak-dev"` — launch config lives in [.claude/launch.json](.claude/launch.json).

## Project layout

```
src/
  app/
    layout.tsx, globals.css, page.tsx           # landing
    login/, signup/                             # auth pages (client forms)
    dashboard/page.tsx                          # server component, lists user's streaks
    streak/[id]/page.tsx                        # server component, single streak
    api/
      auth/{signup,login,logout}/route.ts       # POST JSON endpoints
      streaks/route.ts                          # GET list, POST create
      streaks/[id]/route.ts                     # GET, PATCH, DELETE
      streaks/[id]/checkin/route.ts             # POST mark date as NONE|PARTIAL|FULL
  components/
    AuthForm.tsx, TopBar.tsx                    # client
    NewStreakForm.tsx, StreakCard.tsx           # client
    StreakDetail.tsx                            # client — day buttons, stats, calendar, delete
  lib/
    db.ts                                       # Prisma singleton (dev-safe)
    auth.ts                                     # createSession / destroySession / requireUser
    password.ts                                 # hash / verify (bcrypt)
    validation.ts                               # Zod schemas (credentials, streak, check-in)
    date.ts                                     # local-day YYYY-MM-DD helpers + stats/tier math
  middleware.ts                                 # protects /dashboard, /streak/*; redirects authed from /login, /signup
prisma/schema.prisma                            # User → Streak → CheckIn (cascade)
next.config.ts                                  # security headers + CSP
tailwind.config.ts, postcss.config.mjs
.env, .env.example                              # DATABASE_URL, AUTH_SECRET
```

## Data model

```
User(id, email UNIQUE, passwordHash, createdAt) 1─┐
                                                   │
Streak(id, userId, name, description?, color,     │
       createdAt, archivedAt?) 1──┐                │
                                   │                │
CheckIn(id, streakId, date, level, note?,         │
        createdAt)                                 │
  UNIQUE (streakId, date)                          │
  level ∈ { "PARTIAL", "FULL" }   (NONE = no row)  │
  date = "YYYY-MM-DD" in user's local calendar     │
```

- Cascade delete: deleting a user removes streaks; deleting a streak removes check-ins.
- A day with no `CheckIn` row = NONE. Marking NONE deletes the row.

## Key design choices

- **Local calendar days.** Days are stored as `YYYY-MM-DD` (the user's local day), not timestamps. A streak is a human-calendar concept — we never cross a wall-clock boundary across timezones.
- **Minimal palette.** One accent (teal) over a neutral stone canvas. All colors are CSS variables in [globals.css](src/app/globals.css) — brand tweaks happen there, never in components.
- **Single focus ring** defined globally in `globals.css`. Components never override focus styles.
- **Optimistic UI** for check-in toggles in [StreakDetail.tsx](src/components/StreakDetail.tsx) — state rolls back on API error.
- **Level tiers** (Seed/Sprout/Sapling/Grove/Forest/Mountain/Summit/Legend) live in `lib/date.ts::levelTier` — single source of truth.
- **Completion rate** counts FULL as 1.0 and PARTIAL as 0.5 over days since streak creation. Logic in `computeStats` ([src/lib/date.ts](src/lib/date.ts)).

## Security notes

- Never log or return `passwordHash`. Login endpoint always runs a bcrypt verify (even when the email is unknown) to avoid timing-based account enumeration — see [src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts).
- Session JWT is HS256 over `AUTH_SECRET`. The secret must be ≥ 32 chars; `lib/auth.ts` throws otherwise.
- Every streak API route calls `requireUser()` and checks `userId` ownership before touching `Streak` or `CheckIn` — never trust the URL id alone.
- Every API body is parsed through a Zod schema in [src/lib/validation.ts](src/lib/validation.ts). Add new fields there first.
- CSP in [next.config.ts](next.config.ts): `unsafe-eval` is dev-only (needed by React Refresh); prod CSP stays strict. If you add a third-party script, loosen `script-src` explicitly — don't blanket-allow.
- Cookie is `httpOnly` + `SameSite=Lax` + `Secure` in prod. `SameSite=Lax` is sufficient CSRF defense for our same-origin JSON endpoints.

## Deploying (before you ship)

1. Generate a real secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Put it in `.env` as `AUTH_SECRET`.
2. If moving off SQLite: set `DATABASE_URL` to Postgres and change the provider in `prisma/schema.prisma`, then `npm run db:push` (or use `prisma migrate` for a real migration history).
3. `NODE_ENV=production` triggers the strict CSP and `Secure` cookies automatically.

## Conventions

- Server components are the default; client components (`"use client"`) only where interaction is needed.
- API routes return `NextResponse.json(...)` with explicit status codes. Never return 500 with a leaked error message — handle `.safeParse()` failures with 400 and a short message.
- Prefer editing `lib/*` over duplicating logic in components. Stats, tier math, and date helpers all live in `lib/date.ts`.
- Don't add new dependencies for small needs — the current set is intentionally small.
