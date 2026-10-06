# Architecture

Current state: **end of Phase 1 (project foundation)**. Later phases add to this
document; see `PHASES.md` for what each phase delivered.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend + server rendering | Next.js 16 (App Router), React 19, TypeScript | The supplied front-end design (tsdl-site) is built on it; deploys to Vercel as-is |
| Auth | Supabase Auth via `@supabase/ssr` (cookie sessions) | Design Spec §2 |
| Database, RLS, Edge Functions | Supabase (from Phase 2) | Design Spec §2 |
| Styling | Plain CSS with design tokens (`src/styles/tokens.css`) | Mirrors "The Systems Design Lab" design system 1:1; no CSS framework |
| Unit tests | Vitest | Fast tests of pure logic |
| Browser tests | Playwright (desktop + phone) | Exercises real pages, redirects and layout |
| CI | GitHub Actions (`.github/workflows/ci.yml`) | typecheck, lint, unit, build, browser tests on every PR |

## One project, three areas

```text
src/app/
  (marketing)/   public site: home (Notion to YouTube landing), products, videos, about, contact, legal
  (auth)/        login, signup, forgot-password, reset-password
  (app)/dashboard/  the signed-in SaaS (Overview, My Profile, Analytics, Billing, Connections, Field Mapping)
  auth/callback/ where Supabase email links and Google sign-in return
  api/           contact + waitlist form endpoints (pre-existing, not yet connected)
```

Route groups in parentheses do not appear in URLs; they give each area its own layout.

## Request flow (Phase 1)

```text
Browser ──► src/proxy.ts (every page request)
              ├─ refresh Supabase session cookie
              ├─ signed out + /dashboard/* ──► 302 /login?next=…
              └─ signed in + /login|/signup|/forgot-password ──► 302 /dashboard
          ──► dashboard layout (server) ── getClaims() again ── no session ──► /login
          ──► page renders with the verified user (name, email, initials)
```

Two independent checks (proxy and layout) guard the dashboard: if one is
misconfigured, the other still blocks access.

## Security decisions so far

- Browser holds only the Supabase **publishable** key. No secret keys exist in Phase 1.
- Identity on the server comes from `supabase.auth.getClaims()` (signature-verified), never from IDs sent by the browser (Design Spec §25).
- Redirect targets after sign-in are restricted to same-site paths (`safeNextPath`).
- Errors shown to people are plain English; technical details go to logs only (`src/lib/log.ts`, `ErrorState`).
- `.env.local` is git-ignored; `.env.example` lists every variable.

## Where things live

| What | Where |
| --- | --- |
| Design tokens (colour, type, spacing, radius, shadow, gradient) | `src/styles/tokens.css` |
| Design-system components: Button, Badge, Card, Input, Progress | `src/components/ui/`, `src/styles/sdl.css` |
| App shell, navigation panel, page header, panels | `src/components/app/AppShell.tsx`, `src/content/app.ts` (nav) |
| Error pages | `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/(app)/dashboard/error.tsx` |
| Logging | `src/lib/log.ts` (JSON lines → Vercel logs) |
| Environment | `src/lib/env.ts`, `.env.example` |
| Auth | see `docs/SETUP_AUTH.md` |

## Sample data

Dashboard numbers, uploads, connections and mappings come from
`src/content/app.ts` (marked SAMPLE) and a banner on every dashboard page says
so. Each is replaced by real data in the phase that builds it (Phases 2–9).
