# ET Nucleus — Intelligence-First, Persona-Aware Business News

> News that adapts to **you**. Tell ET Nucleus who you are and what you're
> chasing, and it rewrites every headline, briefing, and explanation for your
> level and goals — powered by Groq (Llama 3.3 70B).

- **Frontend:** React 18 + Vite, React Router, Tailwind CSS v4, Framer Motion
- **Backend:** Node.js + Express 5, Groq SDK, in-memory persona store
- **Deploy:** a **single** server — Express serves both the API and the built
  React app on one origin and port (perfect for Render).

---

## Table of Contents

1. [What this app does](#1-what-this-app-does)
2. [Prerequisites](#2-prerequisites)
3. [Install](#3-install)
4. [Configure (`.env` + Groq key)](#4-configure-env--groq-key)
5. [Run locally](#5-run-locally)
6. [Deploy to Render (one service)](#6-deploy-to-render-one-service)
7. [How to use the app](#7-how-to-use-the-app)
8. [Project structure](#8-project-structure)
9. [Environment variables](#9-environment-variables)
10. [API reference](#10-api-reference)
11. [Demo mode (no key / no internet)](#11-demo-mode-no-key--no-internet)
12. [Troubleshooting](#12-troubleshooting)
13. [Tech stack & further reading](#13-tech-stack--further-reading)

---

## 1. What this app does

ET Nucleus turns one-size-fits-all financial news into a **personal edition**:

- **🧠 Smart persona** — a 3-question adaptive questionnaire plus AI intent
  analysis classify you (e.g. *first-time investor*, *day trader*, *student*)
  and a knowledge level (*beginner → expert*).
- **📊 Deep-dive synthesis (the star feature)** — ask any question and get **one
  coherent briefing** synthesized from multiple articles: a summary, themed
  sections (*What's happening / Why it matters / Key players / What to watch*),
  "By the numbers" facts, and follow-up questions — written for your level.
- **📰 Personalized feed** — headlines rewritten for you, a relevance score
  (`/10`), and a "Why this matters to you" line per article.
- **📈 Evolving profile** — the more you read, the more your profile levels up,
  and the feed adapts.

---

## 2. Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 18+ | includes `npm` |
| **Groq API key** | — | free at <https://console.groq.com>. Optional — the app runs in demo/fallback mode without one. |
| OS | macOS / Linux / WSL | `start.sh` is a bash script (local dev only) |

The backend is pure JavaScript (Express + Groq SDK) — **no native modules to
compile**, so installs and deploys are fast and reliable.

---

## 3. Install

From this directory (`pramaan/`, the folder containing this README):

```bash
# install backend + frontend deps and build the frontend in one step
npm run build
```

…or install each side individually:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

---

## 4. Configure (`.env` + Groq key)

Configuration is **centralized** and validated. There is a **single `.env`** at
this directory (next to `backend/` and `frontend/`) — no per-app `.env` files —
read through one config module per side. No hardcoded URLs, ports, model names,
or keys live anywhere else in source:

| File | Read by | Notes |
|------|---------|-------|
| `pramaan/.env` (the only one) | `backend/src/config/index.js` (backend) and `frontend/src/config/index.js` (frontend, via Vite `envDir`) | only `VITE_`-prefixed vars reach the client; backend secrets are never bundled |

Copy the template and (optionally) add your key:

```bash
cp .env.example .env
# then edit .env:  GROQ_API_KEY=gsk_your_key_here   (optional — demo mode works without it)
```

> On **Render** you don't create a `.env` — you set these as environment
> variables on the service instead (already scaffolded in `render.yaml`).

### Startup validation (fail-fast)

The config modules **validate on load** and refuse to start on bad config:

- **Backend:** `config/index.js` collects every problem (missing required var,
  non-integer `PORT`, invalid `NODE_ENV`/`LOG_LEVEL`, a `DEFAULT_MODEL` not in
  `AVAILABLE_MODELS`) and, if any exist, prints them to stderr and calls
  `process.exit(1)` **before** the server boots.
- **Frontend:** `frontend/src/config/index.js` throws immediately (and logs to
  the browser console) when a required `VITE_` var is missing or
  `VITE_DEFAULT_MODEL` isn't in `VITE_AVAILABLE_MODELS`.

### Dynamic model selector

The list of models the app may use — and the options shown in the UI selector —
is driven entirely by configuration:

- Backend `AVAILABLE_MODELS` (comma-separated ids) gates which models are
  accepted; `resolveModel()` falls back to `DEFAULT_MODEL` for anything not in
  the list.
- Frontend `VITE_AVAILABLE_MODELS` repopulates the selector with **no code
  changes** — labels are derived from each id automatically, with optional
  overrides via `VITE_MODEL_LABELS` (`"id=Label;id=Label"`).

Keep the two lists in sync (the frontend list "mirrors" the backend one).

---

## 5. Run locally

### Option A — dev servers (hot reload)

```bash
./start.sh
```

This starts the backend on `:3001` and the Vite dev server on `:5173`. The dev
server proxies `/api` to the backend, so the browser only ever talks to one
origin (mirroring production). Press **Ctrl+C** to stop both.
(If needed: `chmod +x start.sh`.)

Two terminals instead:

```bash
# Terminal 1 — backend
cd backend && npm run dev        # nodemon auto-reload (or `npm start`)

# Terminal 2 — frontend
cd frontend && npm run dev
```

Then open **http://localhost:5173**.

### Option B — single-server (exactly like production)

Build the frontend, then let Express serve it + the API on one port:

```bash
npm run build      # installs deps + builds frontend → frontend/dist
npm start          # Express serves the API and the built app on :3001
```

Then open **http://localhost:3001**.

Quick health check (either mode):

```bash
curl http://localhost:3001/health
# {"status":"ok","version":"1.0.0","groq":"configured"}
```

---

## 6. Deploy to Render (one service)

The whole app ships as **one Render Web Service**. The Express backend serves the
API at `/api/*` and the built React frontend (static files + SPA fallback) from
the **same origin**, so there's no CORS and no second service to manage.

### Option A — Blueprint (recommended)

A [`render.yaml`](../render.yaml) Blueprint lives at the repo root.

1. Push this repo to GitHub.
2. Render Dashboard → **New** → **Blueprint** → select your repo.
3. Render reads `render.yaml`; fill in the secret values when prompted
   (`GROQ_API_KEY`, and optionally `NEWS_API_KEY` / `VITE_CLERK_PUBLISHABLE_KEY`).
4. Click **Apply**. Done.

### Option B — manual Web Service

| Setting | Value |
|---------|-------|
| Environment | **Node** |
| Root Directory | `pramaan` |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Then add the environment variables from [§9](#9-environment-variables) (the
`VITE_*` ones are needed **at build time**). Render injects `PORT` automatically.

> **Note on persona storage:** personas live in an **in-memory** store, so they
> reset on every deploy/restart (and Render's free tier sleeps when idle). That's
> fine for a demo; swap in a database for durable storage.

---

## 7. How to use the app

**First-time visit:**

1. **Enter your name.**
2. **Answer the 3-question questionnaire** — it adapts to your first answer
   (e.g. choosing *Markets & Investing* changes question 2). This sets your
   persona type, knowledge level, and content preference.
3. **Tell us what brings you to ET today** — type in your own words (e.g.
   *"I have ₹5 lakhs to invest, should I go with mutual funds or stocks?"*) or
   tap a quick prompt.
4. Click **"Get my personalized edition →"**. Groq analyzes your intent and you
   land on your dashboard.

**On the dashboard:**

- **Deep-dive synthesis** (top): type a question (or tap an example) and press
  **Synthesize**. You get a full briefing — summary, sections, "By the numbers",
  and "Keep digging" follow-ups you can click to synthesize again.
- **Tuned for you** (feed): personalized articles sorted by relevance (`/10`,
  tagged *Top match / Strong / Related*). Click any story to open the reader,
  which shows the "Why you" rationale and a key takeaway.
- **Your reader profile** (sidebar): name, persona, a knowledge bar, and live
  counters for interactions and articles read — these go up as you use the app.
- **← New search** returns to the home page.

**Returning visits:** your identity is remembered via `localStorage`, so you'll
see a "Welcome back" banner and can skip straight to a query.

> To reset to a clean first-time experience: open DevTools console and run
> `localStorage.clear()`, then reload. (Personas also reset whenever the backend
> restarts — the store is in-memory.)

---

## 8. Project structure

```
repo root
├── render.yaml                  # Render Blueprint (one web service)
└── pramaan/                     ← app root (.env, start.sh, root package.json live here)
    ├── package.json             # build/start scripts for the single-server deploy
    ├── .env                     # single shared config (gitignored)
    ├── .env.example             # annotated template
    ├── start.sh                 # local dev: starts backend + frontend dev servers
    ├── README.md  ARCHITECTURE.md  IMPACT_MODEL.md
    │
    ├── backend/
    │   └── src/
    │       ├── index.js             # Express server: API + serves the built frontend
    │       ├── config/index.js      # centralized, validated config (only reader of process.env)
    │       ├── lib/groqClient.js     # shared, boot-safe Groq client + default model
    │       ├── lib/logger.js         # leveled logger gated by LOG_LEVEL
    │       ├── routes/
    │       │   ├── persona.js        # /api/persona/*  (create, get, interaction, evolve)
    │       │   ├── nucleus.js        # /api/nucleus/*  (feed, synthesize, ask, translate)
    │       │   └── intent.js         # /api/intent/analyze
    │       ├── agents/               # intent_analyzer, personalizer, synthesizer,
    │       │                         #   persona_evolver, adaptor (all use Groq)
    │       ├── tools/news_fetcher.js # sample ET articles + optional NewsAPI
    │       ├── store/personaStore.js # in-memory persona + interaction store
    │       └── data/demo_personalized.js  # pre-generated demo personalization
    │
    └── frontend/
        └── src/
            ├── main.jsx             # routes
            ├── config/index.js      # centralized, validated config (only reader of import.meta.env)
            ├── index.css            # editorial design system (Tailwind v4 theme)
            ├── lib/identity.jsx     # localStorage identity + Clerk bridge
            ├── pages/
            │   ├── NucleusHome.jsx        # landing + questionnaire + intent
            │   └── NucleusDashboard.jsx   # synthesis + feed + reader + profile
            └── components/
                ├── PersonaQuestionnaire.jsx · QuestionCard.jsx · ProgressIndicator.jsx
                ├── ModelSelector.jsx
                └── ClerkAuthButtons.jsx
```

**Frontend routes:** `/` and `/nucleus` → home · `/nucleus/dashboard` → dashboard.

---

## 9. Environment variables

A **single** root `.env` holds both backend and frontend (`VITE_*`) vars, read
through one config module per side. The annotated template lives at
[`.env.example`](./.env.example). **Required** vars abort startup when missing
(see [§4](#4-configure-env--groq-key)); there are no hardcoded fallbacks in source.

### Backend — `pramaan/.env` (via `backend/src/config/index.js`)

| Variable | Required | Example | Purpose |
|----------|:--------:|---------|---------|
| `NODE_ENV` | ✓ | `development` | `development` \| `production` \| `test`. |
| `PORT` | ✓ | `3001` | Backend port (positive integer). **Render injects this automatically.** |
| `LOG_LEVEL` | — | `info` | `error` \| `warn` \| `info` \| `debug`. Defaults to `info`. |
| `LLM_PROVIDER` | ✓ | `groq` | LLM provider id. |
| `GROQ_API_KEY` | — | `gsk_…` | Groq key (<https://console.groq.com>). Empty → demo/fallback mode. |
| `DEFAULT_MODEL` | ✓ | `llama-3.3-70b-versatile` | Default text model; **must** be one of `AVAILABLE_MODELS`. |
| `AVAILABLE_MODELS` | ✓ | `llama-3.3-70b-versatile,llama-3.1-8b-instant,…` | Comma-separated model ids the app may use. Drives the model selector. |
| `NEWS_API_KEY` | — | *(empty)* | Optional [NewsAPI](https://newsapi.org) key; otherwise built-in sample articles are used. |
| `NEWS_API_URL` | ✓* | `https://newsapi.org/v2/everything` | NewsAPI endpoint. *Required only when `NEWS_API_KEY` is set. |
| `CLIENT_URL` | — | *(empty)* | Only for a **split** deploy (frontend on a different origin). Empty in the single-server setup. |
| `CORS_ORIGINS` | — | *(empty)* | Comma-separated allowed origins. Defaults to `CLIENT_URL`. Empty → same-origin only. |

### Frontend — `VITE_*` in the same `pramaan/.env` (via `frontend/src/config/index.js`)

Only `VITE_`-prefixed vars are exposed to client code (backend secrets in the
same file are never bundled). These are read **at build time**.

| Variable | Required | Example | Purpose |
|----------|:--------:|---------|---------|
| `VITE_API_URL` | — | *(empty)* | API base URL. **Empty = same origin** (the default single-server deploy uses relative `/api`). Set only for a split deploy. |
| `VITE_APP_ENV` | ✓ | `development` | `development` \| `production`. |
| `VITE_DEV_PORT` | — | `5173` | Vite dev server port (local dev only). |
| `VITE_API_PROXY_TARGET` | — | `http://localhost:3001` | Local dev only: where the dev server proxies `/api`. Defaults to `http://localhost:${PORT}`. |
| `VITE_LLM_PROVIDER` | ✓ | `groq` | Provider id (display only). |
| `VITE_DEFAULT_MODEL` | ✓ | `llama-3.3-70b-versatile` | Default selected model; **must** be one of `VITE_AVAILABLE_MODELS`. |
| `VITE_AVAILABLE_MODELS` | ✓ | `llama-3.3-70b-versatile,…` | Comma-separated ids shown in the selector. Mirror the backend list. |
| `VITE_MODEL_LABELS` | — | `id=Label;id=Label` | Optional display-label overrides; otherwise labels are derived from each id. |
| `VITE_CLERK_PUBLISHABLE_KEY` | — | *(empty)* | Clerk publishable key. Empty → auth disabled (app still boots). |

---

## 10. API reference

Base URL: same origin as the app (e.g. `http://localhost:3001` locally, or your
Render URL).

### Persona

```http
POST /api/persona/create          # body: { userInput, userId? }
                                  # → { success, persona, intent, is_new }
GET  /api/persona/:userId          # → { success, persona }
POST /api/persona/:userId/interaction   # body: { type, data }
                                        #   type: article_read | synthesis_request | question_asked
                                        # → { success, persona, upgraded }
POST /api/persona/:userId/evolve   # AI re-classification (body: { force? })
GET  /api/persona/:userId/history  # evolution + interaction history
```

### Nucleus (news)

```http
POST /api/nucleus/personalized-feed     # body: { intent, count }
                                        # → { articles[], success }
POST /api/nucleus/synthesize            # body: { topic, intent }
   # → { briefing: { briefing_title, summary, sections[],
   #                 key_facts[], suggested_questions[], article_count }, success }
POST /api/nucleus/ask                   # body: { question, briefing, intent }
POST /api/nucleus/translate             # body: { article, intent }  → Hindi adaptation
```

### Intent & health

```http
POST /api/intent/analyze    # body: { userInput }  → { intent, profile, success }
GET  /health                # → { status, version, groq }
```

Example:

```bash
curl -X POST http://localhost:3001/api/persona/create \
  -H 'Content-Type: application/json' \
  -d '{"userInput":"I have 5 lakhs to invest, mutual funds or stocks?"}'
```

---

## 11. Demo mode (no key / no internet)

ET Nucleus is built to always render something:

- **No `GROQ_API_KEY`** → the server still boots; AI calls fall back to safe
  default responses, and the feed uses pre-generated demo personalization.
- **No `NEWS_API_KEY`** → built-in ET-style sample articles are used.

For a fully live experience (real intent analysis + synthesis), set a Groq key.

---

## 12. Troubleshooting

**Port already in use (3001 or 5173)**
```bash
kill -9 $(lsof -ti:3001)   # or :5173
```

**Backend exits with `✗ Invalid environment configuration — startup aborted`** —
one or more **required** vars are missing/invalid (the printed list says which).
Config is validated fail-fast in `backend/src/config/index.js`; fix `pramaan/.env`
against [`.env.example`](./.env.example) and restart.

**Frontend throws `Invalid frontend environment configuration`** (browser
console) — a required `VITE_` var is missing or `VITE_DEFAULT_MODEL` isn't in
`VITE_AVAILABLE_MODELS`. Fix the root `.env` against [`.env.example`](./.env.example).

**On Render the UI loads but API calls 404 / wrong host** — the `VITE_*` vars must
be present **at build time** so the bundle is built correctly. Confirm they're set
on the service, then trigger a fresh deploy (clear build cache).

**"Failed to create your persona"** — usually an invalid Groq key or a rate
limit. Check the backend logs and your quota at console.groq.com.

**Frontend port differs (5174, …)** — Vite picks the next free port if 5173 is
taken; just open the URL Vite prints.

---

## 13. Tech stack & further reading

**Frontend:** React 18, Vite 6, React Router 7, Tailwind CSS v4, Framer Motion,
Axios. UI uses an editorial "financial-paper" design system (Fraunces · Hanken
Grotesk · JetBrains Mono).

**Backend:** Node.js, Express 5, Groq SDK (`llama-3.3-70b-versatile`), in-memory
persona store, UUID. Serves the built frontend on the same origin in production.

**AI agents:** intent analysis · persona classification & evolution · headline
personalization · multi-article synthesis · Hindi cultural adaptation.

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system design details
- [`IMPACT_MODEL.md`](./IMPACT_MODEL.md) — product/business impact analysis

---

*Built for the Economic Times AI Hackathon 2026.*
