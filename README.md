# Nova Reach — lean RankAI-style marketing chat agent

Nova Reach is a self-hostable SaaS MVP: upload your knowledge base, get a chat
agent that answers questions grounded in that content, embed it on your site
as a widget, and charge for it with Stripe. Built with Next.js (App Router),
Prisma + SQLite, NextAuth, and the OpenAI API.

## What's included

- **Chat UI with streaming responses** (`/chat`) wired to an LLM via the
  OpenAI API, with a **globally editable system prompt** (admin-only,
  `/admin`).
- **Knowledge base / RAG** (`/dashboard`): upload `.txt`/`.md`/`.csv` files or
  paste a URL. Content is chunked, embedded (`text-embedding-3-small` by
  default), and the top-matching chunks are injected into the system prompt
  for every chat and widget reply.
- **Multi-conversation history** — every user's conversations are saved and
  browsable in the sidebar; **saved prompts** let you store and reuse
  frequently-used messages.
- **Shareable / embeddable widget** — a per-user `widgetKey` powers a
  standalone chat page (`/widget/:key`) and a drop-in `<script>` snippet
  (`public/widget.js`) that adds a floating chat bubble to any site.
- **Usage limits per plan** (Free vs Pro, enforced server-side per day) and
  an **admin dashboard** (`/admin`) listing every user and their recent
  conversations.
- **Email/password auth** (NextAuth credentials provider) and a **Stripe
  test-mode checkout** for the Pro plan, with a webhook that upgrades/downgrades
  the account automatically.
- A clean, responsive landing page (`/`) and pricing page (`/pricing`).

## Why this isn't a fork of AionUi

[AionUi](https://github.com/iOfficeAI/AionUi) is an Electron desktop app for
running coding agents locally — a different runtime shape (desktop, not
multi-tenant web) from what's needed here (a hosted SaaS with per-user
knowledge bases, auth, billing, and an embeddable widget). Rather than force
a desktop app into that shape, this MVP is a fresh, lean Next.js
implementation that covers the same functional surface RankAI's public
description advertises: chat over your own content, deployed for visitors,
with plans and admin visibility.

## Local setup

### 1. Install dependencies

```bash
cd webapp
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string. Use a local Postgres, `docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`, or a free Neon/Vercel Postgres branch. |
| `NEXTAUTH_SECRET` | yes | Any long random string. Generate with `openssl rand -hex 32`. |
| `NEXTAUTH_URL` | yes | `http://localhost:3000` for local dev. |
| `OPENAI_API_KEY` | yes | Needed for chat + embeddings. Get one at platform.openai.com. |
| `OPENAI_CHAT_MODEL` | no | Defaults to `gpt-4o-mini`. |
| `OPENAI_EMBEDDING_MODEL` | no | Defaults to `text-embedding-3-small`. |
| `STRIPE_SECRET_KEY` | no (until you want billing) | Test-mode secret key (`sk_test_...`). |
| `STRIPE_PUBLISHABLE_KEY` | no | Test-mode publishable key. |
| `STRIPE_PRICE_ID_PRO` | no | The Price ID for your Pro plan product in test mode. |
| `STRIPE_WEBHOOK_SECRET` | no | From `stripe listen` or your webhook endpoint config. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | no | Used by the seed script to create the first admin account. |
| `NEXT_PUBLIC_APP_URL` | yes | Public base URL, used to build widget embed snippets and Stripe redirect URLs. |

### 3. Set up the database

```bash
npm run prisma:migrate   # applies the schema to DATABASE_URL
npm run prisma:seed      # seeds the global system prompt + an admin account
```

The seed script prints the admin login it created (defaults to
`admin@example.com` / `admin12345` — override with `ADMIN_EMAIL` /
`ADMIN_PASSWORD` in `.env` before seeding).

### 4. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`:

- `/register` to create a normal account, then `/chat` to talk to the agent.
- `/dashboard` to upload knowledge base sources and get your widget embed
  snippet.
- Log in as the seeded admin to see `/admin` (global system prompt editor +
  every user's conversations).
- `/pricing` to try the Stripe test-mode upgrade flow (requires Stripe env
  vars — see below).

## Setting up Stripe (test mode)

1. Create a [Stripe](https://dashboard.stripe.com) account and switch to
   **test mode**.
2. Create a Product with a recurring monthly Price (e.g. $49/mo) — copy its
   Price ID into `STRIPE_PRICE_ID_PRO`.
3. Copy your test **Secret key** and **Publishable key** into `.env`.
4. For webhooks locally, run the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.
5. Use Stripe's test card `4242 4242 4242 4242` (any future expiry/CVC) at
   checkout. On success, the webhook flips the user's plan to `PRO` and
   raises their daily message + source limits (see `lib/plans.js`).

## Embedding the widget on another site

After logging in, `/dashboard` shows a ready-to-paste snippet:

```html
<script src="https://your-domain.com/widget.js" data-key="YOUR_WIDGET_KEY" data-base="https://your-domain.com" async></script>
```

Drop it before `</body>` on any site. It renders a floating chat bubble
backed by that account's knowledge base and system prompt, rate-limited by
that account's plan.

## Architecture notes

- **RAG**: documents are chunked (~1000 chars, 150 char overlap), embedded
  with OpenAI embeddings, and stored as JSON vectors in a `Chunk` table in
  Postgres. Retrieval does an in-process cosine-similarity search — no
  vector database needed at this scale. If you outgrow that per-request
  scan, swap `lib/embeddings.js`'s `retrieveContext` for a `pgvector` query
  (or a hosted vector DB) — the rest of the app is unaffected.
- **Streaming chat**: `/api/chat` streams the OpenAI completion as
  Server-Sent Events over a plain `fetch` (no extra client library).
- **Usage limits**: `lib/usage.js` tracks a per-user, per-day message
  counter and enforces `lib/plans.js`'s `dailyMessageLimit` for both the
  authenticated chat and the public widget endpoint.
- **Auth**: NextAuth credentials provider + JWT sessions; passwords hashed
  with bcrypt. `middleware.js` protects `/chat`, `/dashboard`, and `/admin`.

## Deploying on Vercel

The `build` script (`prisma migrate deploy && next build`) applies pending
migrations automatically on every deploy, so there's no separate migration
step.

1. **Create a Postgres database.** In the Vercel dashboard: Project →
   Storage → Create Database → Postgres (Neon-backed). This automatically
   adds a `DATABASE_URL` (or `POSTGRES_URL` / `POSTGRES_PRISMA_URL`)
   environment variable to the project — if Vercel names it something other
   than `DATABASE_URL`, add a `DATABASE_URL` env var yourself pointing at the
   same connection string (Prisma reads `DATABASE_URL` specifically).
2. **Set the rest of the environment variables** under Project → Settings →
   Environment Variables, for both "Production" and "Preview": every
   variable in `.env.example` except `DATABASE_URL` (already set in step 1).
   Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL
   (e.g. `https://your-project.vercel.app`).
3. **Deploy.** Push to the connected Git branch (or trigger a deploy from
   the dashboard) — the build runs migrations and builds the app.
4. **Seed the admin account** once, from your machine, pointed at the
   production database:
   ```bash
   DATABASE_URL="<production connection string>" ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... npm run prisma:seed
   ```
   (or create a normal account through `/register` and flip its `role` to
   `ADMIN` directly in the database).
5. **Stripe webhook**: point a webhook endpoint at
   `https://your-domain.com/api/stripe/webhook`, copy its signing secret into
   `STRIPE_WEBHOOK_SECRET`, and switch to live-mode keys only when you're
   ready to charge for real.

Other hosts (Render, Railway, Fly.io, a VPS) work the same way — set the env
vars, point `DATABASE_URL` at a reachable Postgres instance, and run
`npm run build && npm start`.
