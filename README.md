# The Systems Design Lab: website

The marketing site for The Systems Design Lab. The home page is the landing page for Notion to YouTube, the SaaS that uploads videos to YouTube straight from a Notion content calendar. The site also has the social videos, the standard business pages and an early-access waitlist. Built with Next.js (App Router) and TypeScript, styled with The Systems Design Lab design system.

## Run it locally

You need Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # then edit the values
npm run dev                  # http://localhost:3000
```

`npm run build` checks that everything compiles, the same way Vercel will.

## Where to edit things

| What | File |
| --- | --- |
| Company name, tagline, contact email, social links | `src/content/site.ts` |
| Notion to YouTube copy (headline, steps, mapping example, FAQ) | `src/content/product.ts` |
| Videos (titles, platform links, YouTube IDs) | `src/content/videos.ts` |
| Page copy | `src/app/(marketing)/<page>/page.tsx` |
| Colours, type, spacing (design tokens) | `src/styles/tokens.css` |
| Design-system components (Button, Badge, Card, Input, Progress) | `src/components/ui/` and `src/styles/sdl.css` |
| Logos and favicon | `public/brand/`, `src/app/icon.png`, `src/app/apple-icon.png` |

Anything in **[square brackets]** is a placeholder to replace. The videos are **sample data** to show the layout, and the calendar and field-mapping cards are illustrations, not screenshots.

## Pages

- `/`: Notion to YouTube landing page (hero, why it exists, how it works, field mapping, videos, FAQ, waitlist)
- `/products`: product overview with the early-access form
- `/videos`: featured video (embeds YouTube when `youtubeId` is set) and the full library, filterable by platform
- `/about`, `/contact`, `/privacy`, `/terms`
- `sitemap.xml` and `robots.txt` are generated automatically

### Sign-in and dashboard (front end only)

- `/login`, `/signup`, `/forgot-password`: sign-in pages
- `/dashboard`: overview (automation status, setup checklist, recent uploads)
- `/dashboard/profile`, `/dashboard/analytics`, `/dashboard/billing`, `/dashboard/connections`, `/dashboard/field-mapping`
- The left navigation panel and **Log out** live in `src/components/app/AppShell.tsx`; the links are in `src/content/app.ts`.
- The dashboard shows **sample data** from `src/content/app.ts`. Replace it with real queries.

## Still to connect

- **Contact form:** `src/app/api/contact/route.ts` validates and logs messages. Connect an email service (Resend, Postmark) to actually deliver them.
- **Waitlist:** `src/app/api/waitlist/route.ts` validates and logs sign-ups. Connect a list provider or database.
- **Legal pages:** the privacy policy and terms are outlines; have them reviewed before launch.

## Dashboard and sign-in: wiring the backend

Nothing is protected yet. When you connect the backend:

1. **Supabase Auth:** fill in the four functions in `src/lib/auth.ts` (`signIn`, `signUp`, `sendPasswordReset`, `signOut`) with `@supabase/ssr`, then check the session in `src/app/(app)/dashboard/layout.tsx` and redirect to `/login` when there is none.
2. **Stripe ($10/month, one plan):** the plan details are in `src/content/app.ts` (`plan`). The Billing page's buttons should call your backend to create a Stripe Checkout Session (subscribe) or a Customer Portal session (manage, update card, cancel). Keep the subscription status in Supabase via Stripe webhooks.
3. **Connections:** "Connect" starts the Notion OAuth and Google OAuth (YouTube upload scope) flows.
4. **Field Mapping:** `src/components/app/FieldMappingForm.tsx` has a `TODO` where the mapping and trigger are saved.

Search the project for `TODO` to find every spot.

## Domain

The site reads its address from `NEXT_PUBLIC_SITE_URL`. Once the domain is settled, set it in Vercel (Project → Settings → Environment Variables) and add the domain under Project → Settings → Domains. Also replace the placeholder email in `src/content/site.ts`.

## Deploying (later)

1. Push this folder to a GitHub repository.
2. In Vercel, "Add New Project" and import the repository. The defaults for Next.js work as-is.
3. Add `NEXT_PUBLIC_SITE_URL` (and any service keys) as environment variables.

## Growing into the SaaS

Public pages live in the `src/app/(marketing)` route group with their own header and footer. The product can sit beside it in a new group, for example `src/app/(app)/dashboard`, with its own layout, or on a subdomain such as `app.yourdomain.com`. The design tokens already include the dark-theme values (`[data-theme="dark"]` in `tokens.css`) for when the app needs them; the marketing site stays light because the current logo files have a white background.
