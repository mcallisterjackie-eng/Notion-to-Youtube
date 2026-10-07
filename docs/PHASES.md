# Phase log

The build follows `DEVELOPMENT_PLAN.md`. Each phase is proposed, approved,
built, tested and approved again before the next begins.

| Phase | Status |
| --- | --- |
| 1. Project foundation | Approved |
| 2. Database & security foundation | Built, awaiting approval |
| 3. Onboarding & connections | Not started |
| 4. Field Mapping Engine | Not started |
| 5. Notion trigger & automation engine | Not started |
| 6. Google Drive → YouTube upload engine | Not started |
| 7. Notion outputs & error system | Not started |
| 8. Dashboard & operations | Not started |
| 9. Billing & usage | Not started |
| 10. Hardening, testing & launch | Not started |

---

## Phase 1: Project foundation

**Delivered**

- Supplied front end imported as the base (Next.js 16, React 19, TypeScript).
- Supabase connection: browser and server clients, session refresh in `src/proxy.ts`.
- Authentication: email/password sign-up (with email confirmation), log in, log out, forgot/reset password, and Sign in with Google (appears once enabled in Supabase; see `SETUP_AUTH.md`).
- Dashboard protected twice (proxy redirect + server check in the layout); signed-in people skip the sign-in pages; safe "return to the page you asked for".
- App shell shows the real signed-in person (name, email, initials).
- Branded error pages (site, dashboard, global) and a JSON logger.
- Environment structure (`.env.example`, `src/lib/env.ts` with clear errors).
- Responsive fixes so no page scrolls sideways on phones.
- Content: $12/month and 100 videos; Thumbnail removed.
- Tooling: ESLint, Vitest, Playwright (desktop + phone), GitHub Actions CI.
- Docs: this log, `ARCHITECTURE.md`, `SETUP_AUTH.md`, `BRAND_GUIDELINES.md`, `FRONTEND_SPEC.md`.

**Not built (by design):** database tables, accounts, RLS (Phase 2); Notion/YouTube/Drive connections (Phase 3); field mapping logic (Phase 4); automation, uploads, Stripe (Phases 5–9). Dashboard pages still show sample data, labelled as such. Profile "Save" buttons are not wired yet (Phase 2).

---

## Phase 2: Database & security foundation

**Owner decisions:** use the existing Supabase project as the development database (production project in Phase 10); tokens in Supabase Vault; team-ready membership table; account deletion deferred (button disabled); email change with confirmation; usage counts successful uploads including republishes. Google-only users have no password: My Profile says so instead of showing password fields.

**Delivered**

- Schema for profiles, accounts, memberships, subscriptions, usage, connections, encrypted token storage, data sources, field and status mappings, upload jobs and errors (`docs/DATABASE.md`).
- Row Level Security on every table; column-level privileges; server-only state cannot be written by customers.
- Sign-up trigger creates the full account for email and Google sign-ups.
- `getCurrentAccount()`: the one way server code learns whose data it is handling.
- My Profile saves name, email (confirmation link), password (current password checked first) and account time zone. Google-only users see no password form. "Email me when an upload fails" disabled (not in the spec). Delete account disabled.
- Sign-up stores the browser's time zone on the new account.
- Tests: database security and lifecycle tests (local, CI and against the real project), mutation-checked; unit tests for input rules; browser tests for every profile action.
- Supabase advisors: no security warnings except the intentional one (token table has no policies); foreign-key indexes added from the performance advisor.

**Not built (by design):** OAuth connections and token writing (Phase 3); mapping UI and validation (Phase 4); event/activation tables (Phase 5); uploads (Phase 6); Notion write-back (Phase 7); Stripe (Phase 9); account deletion.
