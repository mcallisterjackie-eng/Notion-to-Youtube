# Sign-in setup (Supabase Auth + Google)

Phase 1 uses **Supabase Auth** for email/password sign-in and **Sign in with Google**.
The code is done; the steps below are dashboard settings only you can change.

Supabase project: `egogfmjojgcsbojbglsn` (`https://egogfmjojgcsbojbglsn.supabase.co`)

---

## 1. Supabase URL configuration (needed for email links and Google)

Supabase only sends people back to addresses on its allow list.

Supabase dashboard → **Authentication → URL Configuration**

| Setting | Value |
| --- | --- |
| Site URL | Your production address once known (until then `http://localhost:3000`) |
| Redirect URLs | `http://localhost:3000/auth/callback` |
| | `https://<your-production-domain>/auth/callback` (when known) |
| | `https://*-<your-vercel-team>.vercel.app/auth/callback` (Vercel preview deployments, optional) |

Without these, confirmation and password-reset emails link to the wrong place.

## 2. Email confirmation

Supabase's default is **Confirm email: on** (Authentication → Sign In / Providers → Email).
The app handles this: after sign-up it shows "Check your inbox", and the link
returns through `/auth/callback` to the dashboard. Leave it on.

Supabase's built-in email sender is rate-limited and meant for testing.
Before launch, set up custom SMTP (Authentication → Emails → SMTP Settings). Phase 10.

## 3. Turn on Google sign-in

The **Continue with Google** button appears on `/login` and `/signup`
automatically (within 5 minutes) once Google is enabled in Supabase. Until then
it is hidden, so nobody sees a broken option.

### 3a. Google Cloud Console

1. Go to <https://console.cloud.google.com/> and create a project (for example
   "Notion to YouTube"). Use this **same project** in Phase 3, when YouTube and
   Google Drive access are added.
2. **Google Auth Platform → Branding** (the OAuth consent screen):
   - App name: the product name; user support email; app logo (the flask icon).
   - Authorized domains: `supabase.co` and your own domain once you have it.
   - Home page, privacy policy and terms links (the site's `/privacy` and `/terms`).
3. **Audience:** User type **External**. While the app is in *Testing*, add your
   own Google account (and any testers) under **Test users**.
4. **Data Access (scopes):** only `openid`, `.../auth/userinfo.email`,
   `.../auth/userinfo.profile`. These are non-sensitive, so sign-in itself needs
   no Google verification. (YouTube/Drive scopes come in Phase 3 and do.)
5. **Clients → Create client → Web application**:
   - Authorized JavaScript origins: `http://localhost:3000` and your production URL.
   - Authorized redirect URIs: **`https://egogfmjojgcsbojbglsn.supabase.co/auth/v1/callback`**
6. Copy the **Client ID** and **Client secret**. Do not paste them into chat or commit them.

### 3b. Supabase

1. Supabase dashboard → **Authentication → Sign In / Providers → Google**.
2. Enable it, paste the Client ID and Client secret, save.
3. Open `/login`: within 5 minutes **Continue with Google** appears.

### 3c. Check it works

- Click **Continue with Google**, pick your (test-user) account, and you land on `/dashboard` with your Google name in the side panel.
- Log out, then log in again with Google: same account, no new sign-up.

---

## How sign-in works (for reference)

| Piece | File |
| --- | --- |
| Browser sign-in calls (password, Google, reset, sign out) | `src/lib/auth.ts` |
| Where email links and Google return to | `src/app/auth/callback/route.ts` |
| Session refresh + redirects on every request | `src/proxy.ts`, `src/lib/supabase/proxy.ts` |
| Server check before any dashboard page renders | `src/app/(app)/dashboard/layout.tsx`, `src/lib/session.ts` |
| Which pages are protected; safe "return to" links | `src/lib/routes.ts` |
| Whether Google is switched on | `src/lib/auth-providers.ts` |

- Only the **publishable** key is used by the app. The secret key is never in the frontend.
- The server verifies the session token with `getClaims()` (signature-checked), never by trusting the cookie or a user ID from the browser.
- After sign-in, people return only to pages on this site (`safeNextPath`), so a crafted link cannot send them elsewhere.
