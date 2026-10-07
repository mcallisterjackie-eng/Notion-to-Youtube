# Notion to YouTube

A SaaS by The Systems Design Lab that uploads videos to YouTube straight from a
customer's Notion content calendar. Notion stays the customer's workflow; this
app is the automation layer between Notion, Google Drive and YouTube.

This repository also contains the public marketing site.

> **Status:** Phase 2 (database & security) of 10. See [`docs/PHASES.md`](docs/PHASES.md).

## Documents

| Document | What it is |
| --- | --- |
| [`docs/DESIGN_SPEC.md`](docs/DESIGN_SPEC.md) | Product requirements and system architecture (source of truth) |
| [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md) | The phased build plan and its rules |
| [`docs/FRONTEND_SPEC.md`](docs/FRONTEND_SPEC.md) | Front-end source design and every deviation from it |
| [`docs/BRAND_GUIDELINES.md`](docs/BRAND_GUIDELINES.md) | How "The Systems Design Lab" design system is applied |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How the code is organised and why |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Tables, access rules and database tests |
| [`docs/SETUP_AUTH.md`](docs/SETUP_AUTH.md) | Supabase Auth and Google sign-in settings |
| [`docs/PHASES.md`](docs/PHASES.md) | What each phase delivered |

## Run it locally

You need Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase URL and publishable key
npm run dev                  # http://localhost:3000
```

## Checks

| Command | What it does |
| --- | --- |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint (Next.js rules) |
| `npm test` | Unit tests (Vitest) |
| `npm run test:db` | Applies every migration to a throwaway local PostgreSQL and runs the security tests |
| `npm run test:e2e` | Browser tests on desktop and phone (Playwright). Builds the app and uses a local stand-in for Supabase Auth, so no secrets or network are needed |
| `npm run check` | typecheck + lint + unit tests + build |

GitHub Actions runs all of these on every pull request.

## Pages

- **Public:** `/` (product landing page), `/products`, `/videos`, `/about`, `/contact`, `/privacy`, `/terms`
- **Sign-in:** `/login`, `/signup`, `/forgot-password`, `/reset-password`
- **Dashboard (signed in):** `/dashboard` (Overview), `/dashboard/profile`, `/dashboard/analytics`, `/dashboard/billing`, `/dashboard/connections`, `/dashboard/field-mapping`

Dashboard pages other than My Profile show **sample data** (from `src/content/app.ts`, with a banner saying so) until the phases that make them real.

## Where to edit content

| What | File |
| --- | --- |
| Company name, tagline, contact email, social links | `src/content/site.ts` |
| Product copy (landing page, FAQ) | `src/content/product.ts` |
| Plan, dashboard navigation, sample data | `src/content/app.ts` |
| Videos on the marketing site | `src/content/videos.ts` |
| Design tokens | `src/styles/tokens.css` |

Anything in **[square brackets]** is a placeholder to replace before launch.

## Deploying

Vercel, importing this repository with the Next.js defaults. Set the variables
from `.env.example` in Project → Settings → Environment Variables, and add the
production URL to Supabase's redirect list (see `docs/SETUP_AUTH.md`).
Production setup is Phase 10.
