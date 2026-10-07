# Architecture

Current state: **end of Phase 3 (onboarding & connections)**. Later phases add to this
document; see `PHASES.md` for what each phase delivered.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend + server rendering | Next.js 16 (App Router), React 19, TypeScript | The supplied front-end design (tsdl-site) is built on it; deploys to Vercel as-is |
| Auth | Supabase Auth via `@supabase/ssr` (cookie sessions) | Design Spec §2 |
| Database, RLS | Supabase PostgreSQL, migrations in `supabase/migrations` (see `DATABASE.md`) | Design Spec §2 |
| Edge Functions | Supabase (from the phase that first needs background work) | Design Spec §2 |
| Styling | Plain CSS with design tokens (`src/styles/tokens.css`) | Mirrors "The Systems Design Lab" design system 1:1; no CSS framework |
| Unit tests | Vitest | Fast tests of pure logic |
| Database tests | Plain SQL on a throwaway PostgreSQL (`npm run test:db`) | Proves isolation and lifecycle rules |
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

- Browser holds only the Supabase **publishable** key. Server-only secrets (Supabase secret key, Notion/Google client secrets, state secret) are never `NEXT_PUBLIC_` and never leave the server.
- Every table has Row Level Security; server code finds the account with `getCurrentAccount()` and never trusts an account ID from the browser (`DATABASE.md`).
- Identity on the server comes from `supabase.auth.getClaims()` (signature-verified), never from IDs sent by the browser (Design Spec §25).
- Redirect targets after sign-in are restricted to same-site paths (`safeNextPath`).
- Errors shown to people are plain English; technical details go to logs only (`src/lib/log.ts`, `ErrorState`).
- `.env.local` is git-ignored; `.env.example` lists every variable.

## Connecting a service (Phase 3)

```text
Connect button ─► /api/connect/<service>/start
                    ├ signed in? (getCurrentAccount)
                    ├ random state + PKCE verifier ─► encrypted, HTTP-only cookie (10 min, one use)
                    └ 302 to Notion / Google approval screen
Service ─► /api/connect/<service>/callback?code&state
                    ├ state matches cookie, fresh, same person, same service
                    ├ exchange code (+ PKCE verifier) for tokens
                    ├ tokens ─► Vault via store_connection_secret (service role)
                    ├ health check (Notion bot user / YouTube channel / Drive about)
                    └ connection row updated (status, account name, scopes) ─► back to Setup or Connections
```

Tokens are refreshed shortly before expiry (`getAccessToken`), Notion's rotating
refresh token is stored each time, and Disconnect revokes with the service before
deleting our copy. Failures are classified (reconnect needed, permission problem,
temporary) and shown in plain English (`src/lib/connection-messages.ts`).

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
| Current person + account (server) | `src/lib/account.ts` |
| Database types (generated) | `src/lib/database.types.ts` |
| Service settings, scopes, endpoints | `src/lib/integrations/config.ts` |
| Notion / Google clients | `src/lib/integrations/notion.ts`, `google.ts` |
| Connection lifecycle | `src/lib/connections.ts` |
| OAuth state protection | `src/lib/oauth/state.ts` |
| Connect routes | `src/app/api/connect/[provider]/{start,callback}` |
| Onboarding | `src/app/(app)/dashboard/setup`, `src/lib/setup.ts` |

## Sample data

Dashboard numbers, uploads, connections and mappings come from
`src/content/app.ts` (marked SAMPLE) and a banner on every dashboard page says
so. Each is replaced by real data in the phase that builds it (Phases 2–9).
