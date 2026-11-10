# Streak

A private, minimal streak tracker that works on every device — iPhone, iPad, Android, Mac, Windows. Add a habit, mark each day, watch the chain grow.

Built with **Next.js 15**, **TypeScript**, **Prisma**, and **Tailwind CSS**. Styled after Apple Music's dark aesthetic — pure black background with a single red accent.

## Features

- 🔒 **Secure auth** — bcrypt-hashed passwords, httpOnly JWT session cookies, strict CSP
- 📆 **Local-calendar days** — streaks never cross a timezone boundary
- 🔥 **Full / Partial / None** check-ins per day
- 📊 **Tiers** — Seed → Sprout → Sapling → Grove → Forest → Mountain → Summit → Legend
- 🗓️ **Full calendar history** — tap any past day to edit
- 🧭 **Platform-aware UI** — mobile pattern on phones (back arrow, title, overflow menu), web pattern on desktop (brand + breadcrumb)
- 🌓 **Auto light/dark** via `prefers-color-scheme`
- 🧱 Zero third-party scripts — everything self-hosted

## Quick start

```bash
npm install
npm run db:push
npm run dev
```

Open http://localhost:3000.

## Tech

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| UI | React 18 + Tailwind CSS 3 |
| Database | SQLite via Prisma (swap `DATABASE_URL` for Postgres with no code changes) |
| Auth | bcryptjs + jose (HS256 JWT) |
| Validation | Zod on every API body |

## Security

- Passwords hashed with bcrypt cost 12 — never logged or returned
- Login runs a constant-time bcrypt verify even when the email is unknown (no account enumeration)
- Session JWT is HS256 over `AUTH_SECRET`; cookie is `httpOnly` + `SameSite=Lax` + `Secure` in prod
- Every streak endpoint checks `userId` ownership before touching data
- Strict CSP + `X-Frame-Options: DENY` + `nosniff` + Permissions-Policy headers

See [`CLAUDE.md`](CLAUDE.md) for developer notes (project layout, data model, deploy steps).

## Deploy

Before deploying, generate a real `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

For serverless hosts (Vercel, Netlify), switch the Prisma provider from `sqlite` to `postgresql` and point `DATABASE_URL` at a hosted Postgres (Neon, Supabase, Vercel Postgres). For a container host (Railway, Fly.io, Render), SQLite can stay as-is.

## License

Not specified — all rights reserved by the author.
