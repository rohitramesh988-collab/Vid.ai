# Vid.ai

Turn any idea or rough script into a ready-to-post short-form video. Type an idea,
Claude writes a scene-by-scene script (hook, voiceover lines, on-screen captions),
and the app assembles it into a downloadable vertical (or square/landscape) MP4 -
voiceover, background visuals, and burned-in captions included.

This is a lean, weekend-shippable MVP: Next.js + Tailwind + SQLite, email/password
auth, and a Stripe (test mode) paid tier - built to run locally today and deploy
this week.

## The core loop

1. **Drop in an idea** - a one-liner or a full rough script.
2. **AI writes the scenes** - Claude (`claude-opus-5`) breaks it into 5-8 scenes,
   each with a voiceover line, an on-screen caption, and a visual mood.
3. **Render** - each scene becomes a gradient-background clip with burned-in
   captions and (optionally) an AI voiceover, timed automatically, then
   concatenated into one finished video via `ffmpeg`.
4. **Dashboard** - every idea, script, and render is saved, searchable, and
   filterable by status (draft / scripted / rendering / ready / failed).

## Stack

- **Next.js 16** (App Router) + **Tailwind CSS 4**
- **SQLite** via **Prisma** - zero setup, a single `dev.db` file
- **Auth.js (NextAuth v5)** - email/password (credentials) auth, JWT sessions
- **Claude API** (`@anthropic-ai/sdk`, model `claude-opus-5`) - the script/scene
  generation step
- **OpenAI TTS** (optional) - real AI voiceovers; the app still works end-to-end
  without it, just with silent (caption-only) scenes
- **ffmpeg** (via the bundled `ffmpeg-static` / `ffprobe-static` binaries - no
  system install required) - assembles gradient backgrounds, burned-in captions
  (via libass/ASS subtitles), voiceover audio, and concatenation into the final MP4
- **Stripe** (test mode) - a Pro subscription tier via Checkout + a customer portal

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Then fill in `.env`:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Defaults to `file:./dev.db` - works out of the box. |
| `AUTH_SECRET` | Yes | Random 32-byte secret. Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Yes (local) | `http://localhost:3000` for local dev. |
| `ANTHROPIC_API_KEY` | Yes, for script generation | Get one at [console.anthropic.com](https://console.anthropic.com). Without it, "Generate script" will return a clear error instead of crashing. |
| `OPENAI_API_KEY` | No | Enables real AI voiceovers (`tts-1`). Without it, videos still render - just with captions and no narration. |
| `STRIPE_SECRET_KEY` | No, for billing | Test-mode secret key (`sk_test_...`). |
| `STRIPE_PUBLISHABLE_KEY` | No | Not currently used server-side, kept for completeness / future client-side Stripe.js use. |
| `STRIPE_WEBHOOK_SECRET` | No, for billing | From `stripe listen` (see below) or your Stripe Dashboard webhook config. |
| `STRIPE_PRO_PRICE_ID` | No, for billing | A test-mode recurring Price ID (`price_...`) for the Pro plan. |
| `NEXT_PUBLIC_APP_URL` | Yes | Used to build Stripe redirect URLs. `http://localhost:3000` locally. |

The app runs and the core loop works with just `ANTHROPIC_API_KEY` set - billing
and voiceovers are additive.

### 3. Set up the database

```bash
npx prisma migrate dev
```

This creates `prisma/dev.db` (SQLite) and applies the schema.

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, drop an idea into
the dashboard, generate a script, and render your first video.

## Stripe test mode (optional, for the paid tier)

1. Create a [Stripe](https://dashboard.stripe.com) account (test mode is on by
   default for a new account).
2. Create a recurring **Product + Price** (e.g. "Vid.ai Pro", $19/month) and copy
   its Price ID into `STRIPE_PRO_PRICE_ID`.
3. Copy your test **Secret key** into `STRIPE_SECRET_KEY`.
4. For webhooks locally, install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
   and run:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the printed webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Use Stripe's test card `4242 4242 4242 4242` (any future expiry, any CVC) to
   complete checkout from the dashboard's "Upgrade to Pro" button.

Without Stripe configured, the app still works fully on the free tier (3
rendered videos/month per user) - the "Upgrade to Pro" button will just show a
clear error instead of a real checkout.

## Why videos aren't served from `/public`

Rendered MP4s are written to `storage/renders/` (gitignored) and streamed
through `GET /api/videos/[id]` (with HTTP Range support for scrubbing/seeking,
and an auth check so only the owner can fetch their video) rather than from
Next's `public/` folder. This matters in production: `next start` snapshots the
`public/` directory at process boot and will not serve files written there
afterward - and this app writes new videos to disk continuously at runtime. The
API-route approach sidesteps that entirely and adds an auth check for free.

## Deploying

The web app (Next.js + SQLite + Prisma) deploys to most Node hosts. The one
constraint: **rendering needs a writable filesystem and the ability to spawn a
bundled `ffmpeg` binary** - so a container/VM-style host is the simplest choice.
Classic serverless platforms (e.g. Vercel's default runtime) work fine for
everything *except* `POST /api/render`, which may need a Node-compatible
serverless function with a larger bundle/time budget, or to be moved to a small
background worker - that's a natural next step beyond this weekend MVP.

### Option A: A VM / container host (Railway, Render, Fly.io, a plain VPS, etc.) - recommended

1. Push this repo to GitHub.
2. Create a new Node web service pointing at the repo.
3. Build command: `npm install && npx prisma migrate deploy && npm run build`
4. Start command: `npm run start`
5. Set all the environment variables from `.env.example` (use your **production**
   `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL`, a fresh `AUTH_SECRET`, and switch Stripe
   to live keys when you're ready to charge for real).
6. Attach a persistent volume/disk mounted at the project root so `prisma/dev.db`
   and `storage/renders/` survive restarts and deploys (SQLite + local file
   storage are simple, but not distributed - fine for a single-instance MVP).
7. Point your Stripe webhook endpoint at `https://<your-domain>/api/stripe/webhook`
   and update `STRIPE_WEBHOOK_SECRET` accordingly.

### Option B: Vercel (app only, render step needs adjustment)

Vercel deploys the Next.js app easily, but its default serverless functions
have an ephemeral, size-limited filesystem that isn't a great fit for spawning
`ffmpeg` and writing multi-megabyte files. If you deploy here:

- Everything except rendering (auth, script generation, dashboard, billing)
  works as-is.
- For rendering, either enable a Fluid/longer-running function configuration
  large enough for the bundled ffmpeg binaries, or move `renderProjectVideo()`
  into a separate worker (a small queue + a Node process on a VM) and have
  `/api/render` enqueue a job instead of rendering inline.
- Swap SQLite for a hosted Postgres (e.g. Vercel Postgres / Neon) by changing
  `provider` in `prisma/schema.prisma` and `DATABASE_URL` - SQLite's local file
  won't persist across serverless invocations.

## Project structure

```
src/
  app/
    page.tsx                 landing page
    login/, signup/          auth pages
    dashboard/                project list (search/filter, empty state, new-project form)
    dashboard/[id]/           script + scenes + render + video player
    api/
      signup/                 create account
      auth/[...nextauth]/     Auth.js handlers
      projects/                create / delete project
      generate/                Claude script generation
      render/                  ffmpeg video assembly
      videos/[id]/             authenticated, Range-aware video streaming
      stripe/                  checkout / portal / webhook
  lib/
    generateScript.ts          Claude prompt + parsing
    renderVideo.ts              the ffmpeg render pipeline
    tts.ts                      optional OpenAI TTS voiceover
    assSubtitle.ts               burned-in caption styling (ASS/libass)
    ffmpegRunner.ts               spawn + probe helpers
    limits.ts                    free-tier monthly video cap
    auth.ts, prisma.ts, stripe.ts
prisma/schema.prisma           User / Project / Scene models
assets/fonts/                   bundled font used for burned-in captions
```

## Notes & limitations (MVP scope)

- Free tier: 3 rendered videos/month per user; Pro: unlimited. Enforced at
  render time in `lib/limits.ts`.
- Scene visuals are gradient cards, not AI-generated imagery/video - `visualPrompt`
  is generated and stored per scene so swapping in an image/video generation
  API later is a scoped, additive change.
- Rendering is synchronous (the `/api/render` request blocks until the video is
  done) - fine for a handful of short scenes; a real job queue is the natural
  next step for longer videos or higher concurrency.
