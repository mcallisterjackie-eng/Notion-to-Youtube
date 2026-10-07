# Phase log

The build follows `DEVELOPMENT_PLAN.md`. Each phase is proposed, approved,
built, tested and approved again before the next begins.

| Phase | Status |
| --- | --- |
| 1. Project foundation | Approved |
| 2. Database & security foundation | Approved |
| 3. Onboarding & connections | Built; live test waiting on Vercel + credentials |
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

---

## Phase 3: Onboarding & connections

**Owner decisions:** Drive read-only access (restricted scope, verification + yearly assessment before public launch); YouTube and Drive as separate Google connections; YouTube scopes upload + read-only; Notion read + update content, no email addresses; live test on a Vercel preview (not set up yet); time-zone step in onboarding. Uploads will be Private until the YouTube audit passes. YouTube quota handled later (about 100 units per upload since Dec 2025).

**Delivered**

- Connect / reconnect / disconnect for Notion, YouTube and Google Drive using each service's own approval screen (OAuth), with PKCE, an encrypted single-use state cookie bound to the signed-in person, and redirects built from the configured site address.
- Tokens stored only in Supabase Vault through service-role-only functions scoped by (account, provider); refreshed automatically (Notion's rotating refresh tokens handled); revoked with the service on disconnect.
- Health checks with Connected / Not connected / Connection error / Permission problem, plain-English reasons and Reconnect. Detects unticked Google permissions and Google accounts without a YouTube channel.
- Choosing the Notion database, validated against what Notion says the account can see.
- Setup page (6 skippable steps, resumes at the first unfinished one); new sign-ups land there; Overview setup card and connection rows are real; Connections page adds Google Drive and a "What we can access" panel.
- Tests: database tests for token storage; unit tests for state protection (incl. RFC 7636 vector), token handling, error classification, setup progress; browser tests for the full flow incl. cancel, unticked permissions, no channel, revoked access, forged return links, signed-out access, disconnect, and customer isolation.
- Guides: `SETUP_CONNECTIONS.md` (Notion integration, Google Cloud, secrets, live test checklist).

**Not built (by design):** reading database columns and mapping (Phase 4); Notion webhooks and automation (Phase 5); Drive download and YouTube upload (Phase 6); writing to Notion (Phase 7); billing (Phase 9).

**Waiting on:** Vercel preview and the credentials in `SETUP_CONNECTIONS.md` for the live connection test, which completes this phase's checkpoint.
