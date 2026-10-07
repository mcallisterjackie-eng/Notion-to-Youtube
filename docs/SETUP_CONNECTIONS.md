# Setting up the Notion, YouTube and Google Drive connections

Phase 3 code is finished and tested against stand-ins for Notion and Google.
To use the real services you create two "OAuth apps" (one at Notion, one at
Google), then give the app their keys as environment variables.

Never paste client secrets or keys into chat, email or code. They go only into
`.env.local` (your computer) or Vercel's Environment Variables.

You will need the app's address. Below it is written `APP_URL`:
- On your computer: `http://localhost:3000`
- On Vercel: your preview or production address, e.g. `https://your-project.vercel.app`

Each service lets you register several redirect addresses, so add both.

---

## 1. Supabase secret key

The server uses it to store connection tokens in Vault. It must never reach the browser.

1. Supabase dashboard → **Project Settings → API Keys**.
2. Under **Secret keys**, create one (name it `server`) and copy it.
3. Set `SUPABASE_SECRET_KEY` to it.

## 2. State secret

A random string that encrypts the short-lived cookie protecting the connection round trip.

1. Generate one: run `openssl rand -base64 48` in a terminal (or use any password manager to make a 48+ character random string).
2. Set `OAUTH_STATE_SECRET` to it. Use a different value for production.

## 3. Notion public integration

1. Go to <https://www.notion.so/profile/integrations> and choose **New integration**.
2. **Type: Public.** Name it (e.g. "Notion to YouTube"), choose your workspace, and fill in the company details, website, privacy policy (`APP_URL/privacy`) and terms (`APP_URL/terms`) Notion asks for.
3. **Redirect URIs:** add
   - `http://localhost:3000/api/connect/notion/callback`
   - `APP_URL/api/connect/notion/callback` (your Vercel address, when you have it)
4. **Capabilities** (the approved least-privilege set):
   - Content: **Read content** and **Update content**. Update is used from Phase 7 to write results back, and to add a missing status option if you approve it.
   - Leave **Insert content** and **Comments** off.
   - User information: **No user information**.
5. Save. From the integration's **Configuration / OAuth** section, copy the **OAuth client ID** and **OAuth client secret** into `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET`.

When customers connect, Notion asks which pages and databases to share. Only
those are visible to the app. If their calendar is missing from the list,
they add the integration to that database in Notion (••• → Connections).

## 4. Google Cloud (YouTube and Google Drive)

Use the **same Google Cloud project** as Google sign-in (`SETUP_AUTH.md`), so
customers see one consistent app name.

1. <https://console.cloud.google.com/> → select the project.
2. **APIs & Services → Library:** enable **YouTube Data API v3** and **Google Drive API**.
3. **Google Auth Platform → Data Access → Add or remove scopes:** add exactly these:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/drive.readonly`

   Google marks the YouTube ones *sensitive* and Drive read-only *restricted*. That is expected; see "Before launch" below.
4. **Audience:** while the app is in **Testing**, add each Google account that will connect (yours first) under **Test users**. Up to 100.
5. **Clients:** open the existing **Web application** client (the sign-in one is fine), or create one. Under **Authorized redirect URIs** add:
   - `http://localhost:3000/api/connect/youtube/callback`
   - `http://localhost:3000/api/connect/google_drive/callback`
   - `APP_URL/api/connect/youtube/callback` and `APP_URL/api/connect/google_drive/callback` (Vercel, when you have it)

   Keep the Supabase sign-in redirect (`https://egogfmjojgcsbojbglsn.supabase.co/auth/v1/callback`) there too.
6. Copy the client's **Client ID** and **Client secret** into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

While in Testing, Google shows test users an "unverified app" screen. Choose
**Continue**. Refresh tokens for apps in Testing expire after 7 days, so
connections will need reconnecting weekly until the app is verified.

## 5. Put the values in place

**On your computer:** add to `.env.local` (never committed):

```bash
SUPABASE_SECRET_KEY=...
OAUTH_STATE_SECRET=...
NOTION_CLIENT_ID=...
NOTION_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

then `npm run dev` and open <http://localhost:3000/dashboard/setup>.

**On Vercel (when ready):** Project → Settings → Environment Variables → add
the same names, plus `NEXT_PUBLIC_SITE_URL=APP_URL`,
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Also add
`APP_URL/auth/callback` to Supabase's Redirect URLs (`SETUP_AUTH.md` §1).

A service whose keys are missing shows "Connecting … is not available yet"
instead of a broken button.

## 6. Live test checklist (Phase 3 sign-off)

With a test account on the Vercel preview (or your computer):

- [ ] Setup → Connect Notion → share your content calendar → back on Setup, "Notion is connected"
- [ ] Connect YouTube with the Google account that owns your channel → channel name shown
- [ ] Connect Google Drive → your Google account shown
- [ ] Choose your content calendar → "Selected: …"
- [ ] Confirm time zone
- [ ] Check my connections → "You are set up"
- [ ] Connections → Disconnect one service → Not connected; reconnect it
- [ ] Optional: on Google's screen untick a box → "Permission problem" → Reconnect fixes it

Tell me when it is done and I will check the stored state in Supabase
(connection status, encrypted tokens present, nothing readable by customers).

## Before launch (Phase 10, start early)

- **Google verification** for the sensitive YouTube scopes, and the **restricted-scope security assessment** (CASA, yearly, paid) for Drive read-only. Until then: Testing mode, up to 100 test users, 7-day refresh tokens.
- **YouTube API compliance audit.** Until it passes, uploads from this app are locked to **Private** on YouTube regardless of the visibility chosen. Phase 6 will say so clearly.
- **YouTube quota:** default 10,000 units/day for the whole app. An upload costs about 100 units (since December 2025) and a health check 1 unit. Request an increase when customer volume needs it.
- **Notion:** public integrations listed in Notion's gallery go through Notion's review. That is optional; OAuth works without listing.
