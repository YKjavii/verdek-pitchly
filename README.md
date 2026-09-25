# Verdek Pitchly

Prospect research, outreach, and pipeline tracking for Verdek Studio — find
local businesses worth pitching, score how warm the opportunity is, generate
a pitch, and track it through to won/lost. Multi-user, with an admin portal.

This replaces the earlier single-page Claude Artifact version. Same scoring
logic and pitch templates, now backed by a real database with accounts,
roles, and an admin view — so your team can log in from anywhere and it
doesn't live in one browser's local storage.

Total monthly cost to run this: **$0**, on Supabase's and GitHub's free
tiers, for the scale one small agency generates. See "Costs & limits" below
for exactly where the ceilings are and what triggers a bill.

## What you get

- **Accounts & roles.** Invite-only sign-in (email/password or magic link).
  The first person to ever sign in becomes the admin automatically and a
  single "Verdek" workspace is created for everyone else to join.
- **Admin portal** (`/admin/users`, admin-only) — see everyone with access
  and promote/demote between admin and member.
- **Prospects** — add manually or via a sweep, filter/search, opportunity
  score (hot/warm/cool) based on reviews, rating, and whether they already
  have a website.
- **Pipeline** — a kanban board across your outreach stages.
- **Pitch generator** — fills your package/pricing tokens into a message,
  never invents facts about a business it doesn't have.
- **Sweeps** — a lightweight workflow for asking Claude to go find more
  prospects in a specific area/niche (see "About sweeps" below — this part
  is assisted, not a background robot).
- **Realtime sync** — add or update a prospect on one device, see it appear
  everywhere else logged in, instantly.
- Light/dark mode, mobile-friendly.

## Architecture, in one paragraph

React + TypeScript + Vite for the app; Tailwind for styling; Supabase
(Postgres + Auth + Realtime) for the backend — no server of your own to run.
Every table is scoped by `org_id` and locked down with Row Level Security,
so the database itself enforces "you only ever see your own workspace's
data," not just the app code. The app is a static build with no backend
process, so it deploys as files to GitHub Pages and talks to Supabase
directly from the browser using its public (anon) key — that key is
*meant* to be public; RLS is what actually protects the data.

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New project (the Free plan
   is fine). Pick a strong database password and save it somewhere — you
   won't need it day-to-day, but you'll want it if you ever need direct DB
   access.
2. Once it's provisioned, open **SQL Editor** → New query, paste in the
   entire contents of [`supabase/schema.sql`](./supabase/schema.sql) from
   this repo, and run it. This creates every table, the security rules, and
   the "first sign-up becomes admin" trigger. You only ever run this once.
3. Open **Project Settings → API**. You'll need two values from here in the
   next step: the **Project URL** and the **anon / public key**.

## 2. Configure the app

```bash
cp .env.example .env.local
```

Paste your Project URL and anon key into `.env.local`. Then:

```bash
npm install
npm run dev
```

Open the local URL it prints. You'll land on the login page.

**Sign yourself up first, before turning off public sign-up (step 4).**
There's no sign-up form in the app on purpose (invite-only is the intended
model) — for this one-time first account, use Supabase directly:
**Authentication → Users → Add user** (create it with your email + a
password, and tick "Auto Confirm User"). Then log in with that email/password
on the app's login page. Because you're the first row ever created, the
database trigger makes you the admin of the one Verdek workspace
automatically — nothing else to configure.

## 3. Lock down sign-up

Once you've confirmed you can log in as admin:

- **Authentication → Providers → Email → "Allow new users to sign up"** —
  turn this **off**. From now on, everyone gets in only if you invite them.
- To add a teammate: **Authentication → Users → Invite user**, enter their
  email. They get an email with a link to set a password. The first time
  they log in, the app automatically gives them a `member` row in your
  workspace (they can't see or do admin things unless you promote them at
  `/admin/users`).

## 4. Deploy to GitHub Pages

1. Push this repo to GitHub (public or private both work on the free tier).
2. **Settings → Secrets and variables → Actions → New repository secret** —
   add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same values
   from your `.env.local`. (The workflow bakes these into the static build
   at deploy time — this is the one place they need to exist outside your
   own machine.)
3. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
4. Push to `main` (or run the "Deploy to GitHub Pages" workflow manually
   from the Actions tab). A few minutes later your app is live at
   `https://<your-username>.github.io/<repo-name>/`.

The included workflow (`.github/workflows/deploy.yml`) does the build and
deploy automatically on every push to `main`. There's no server to keep
running and nothing to redeploy manually after the first push.

## 5. Point your landing page at the app

Whatever you build in Claude for the marketing/landing page, just link its
"Log in" / "Get started" button to your GitHub Pages URL above (e.g.
`https://<you>.github.io/verdek-pitchly/#/login`). The two stay separate
projects — the landing page can be redesigned or moved anytime without
touching the app, and vice versa.

---

## Costs & limits (the free/cheapest route)

| Piece | Free tier limit | Where you'd actually hit it |
|---|---|---|
| Supabase database | 500 MB | Thousands of prospects — you won't get near this for a very long time |
| Supabase monthly active users | 50,000 | Not a real constraint for a small team |
| Supabase file storage | 1 GB | Only relevant if you start attaching files/photos to prospects |
| GitHub Pages | 100 GB bandwidth/mo, unlimited public sites | Not a real constraint for an internal tool |

**The one real gotcha:** a Supabase free-tier project **pauses itself after
7 days with no activity** (no API calls at all — just opening the dashboard
doesn't count). A paused project needs a manual "restore" click in the
Supabase dashboard before the app works again, which is mildly annoying but
never destructive — no data is lost. Two ways to avoid it:
1. Just use the app at least once a week (realistically, this solves it).
2. Free, "set and forget": a scheduled GitHub Action or a free
   [cron-job.org](https://cron-job.org) ping that hits your Supabase REST
   URL once every few days. Ask me for the workflow file if you want this —
   it's about 10 lines.

If Verdek ever outgrows the free tier, Supabase's Pro plan is $25/mo and
removes the pause + raises every limit by roughly 20x — you'd know you'd
outgrown free well before you needed to pay for it.

## About sweeps (please read this one)

The "Sweeps" feature in the app is intentionally **assisted, not
automatic**. When you request a sweep, the app records that you asked and
gives you a ready-made instruction to paste to Claude (in a chat, same as
you've been doing). This is a deliberate design decision, not a limitation
I ran out of time to fix: Google doesn't offer a free API for bulk business
search — the real Google Places API bills per request past a small monthly
credit, and scraping Maps directly breaks Google's Terms of Service. Doing
sweeps this way keeps the whole product free and keeps a human (you, or me)
sanity-checking what actually gets logged as a "real" prospect, which the
last sweep already showed matters — of ~654 raw candidates, only 12 held up
to actual scrutiny. If you'd rather pay for full automation later, the
Places API is the upgrade path and it's a contained change (only the sweep
hook would need to change) — not something to take on until it's earning
its keep.

## Project layout

```
src/
  lib/         scoring, pitch generation, shared types, small utils
  context/     auth/session state
  hooks/       data access — one hook per table, realtime-subscribed
  components/  layout, route guards, shared UI
  pages/       one file per route, plus pages/admin/ for admin-only routes
supabase/
  schema.sql   the entire database — tables, RLS policies, triggers
```

## Local development

```bash
npm run dev      # local dev server with hot reload
npm run build    # type-check + production build (this is what CI runs)
npm run preview  # serve the production build locally
```
