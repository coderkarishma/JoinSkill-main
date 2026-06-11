# JoinSkill — Deployment Guide

## Architecture overview

```
Browser (Netlify CDN)          Backend (Render Web Service)
┌─────────────────────┐        ┌──────────────────────────────┐
│  React SPA (dist/)  │──────▶ │  Express + Socket.IO API     │
│  static files       │  HTTPS │  node server/index.js        │
│  netlify.toml       │        │  render.yaml                 │
└─────────────────────┘        │  Persistent disk → db.json   │
                               └──────────────────────────────┘
```

- **Frontend** → Netlify (free tier, global CDN)
- **Backend** → Render (free tier, Node web service + 1 GB persistent disk)

---

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial JoinSkill commit"
git remote add origin https://github.com/<your-username>/joinskill.git
git push -u origin main
```

---

## Step 2 — Deploy the backend on Render

### Option A — Blueprint (render.yaml, one click)

1. Go to **https://dashboard.render.com/blueprints**
2. Click **New Blueprint Instance**
3. Connect your GitHub repo — Render detects `render.yaml` automatically
4. Fill in any prompted values and click **Apply**
5. Wait for the build to finish (≈ 2–3 min)
6. Copy your service URL, e.g. `https://joinskill-api.onrender.com`

### Option B — Manual

1. **New → Web Service** → connect your repo
2. Set:
   | Field | Value |
   |---|---|
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `node server/index.js` |
   | Health Check Path | `/api/health` |
3. Add **Environment Variables**:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `JWT_SECRET` | *(click Generate)* |
   | `CLIENT_ORIGIN` | `https://joinskill.netlify.app` ← your Netlify URL |
4. Add a **Disk**:
   | Field | Value |
   |---|---|
   | Name | `joinskill-data` |
   | Mount Path | `/opt/render/project/src/server` |
   | Size | 1 GB |
5. Click **Create Web Service**

> **Why the disk?** `server/data/db.json` and `server/uploads/` must survive
> deploys. Render's free tier ephemeral filesystem resets on every deploy;
> the persistent disk keeps your data intact.

---

## Step 3 — Deploy the frontend on Netlify

### Option A — Netlify UI

1. Go to **https://app.netlify.com** → **Add new site → Import an existing project**
2. Connect GitHub → select the `joinskill` repo
3. Netlify reads `netlify.toml` automatically — build settings are pre-filled
4. Add **Environment Variables** (Site settings → Environment variables):
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://joinskill-api.onrender.com` |
   | `VITE_SOCKET_URL` | `https://joinskill-api.onrender.com` |
5. Click **Deploy site**
6. Copy the Netlify URL (e.g. `https://joinskill.netlify.app`)

### Option B — Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init          # link to a new or existing site
netlify env:set VITE_API_URL    https://joinskill-api.onrender.com
netlify env:set VITE_SOCKET_URL https://joinskill-api.onrender.com
netlify deploy --build --prod
```

---

## Step 4 — Wire the two services together

After both are deployed you have two URLs. Update each service to know about the other:

### On Render — update CLIENT_ORIGIN
Go to your Render service → **Environment** → set:
```
CLIENT_ORIGIN = https://joinskill.netlify.app
```
Then **Manual Deploy → Deploy latest commit** to apply.

### On Netlify — verify env vars
Confirm both vars point at the Render URL:
```
VITE_API_URL    = https://joinskill-api.onrender.com
VITE_SOCKET_URL = https://joinskill-api.onrender.com
```
Trigger a redeploy: **Deploys → Trigger deploy → Deploy site**.

---

## Step 5 — Verify

```bash
# Backend health check
curl https://joinskill-api.onrender.com/api/health

# Expected response
{"ok":true,"name":"JoinSkill API","timestamp":"..."}
```

Open your Netlify URL in the browser, sign in as `demo` / `password123`, and confirm:
- Dashboard loads with stats
- Messages send and receive in real-time
- Discover search returns results
- Skill tests work and certificates are issued
- Video session modal opens and acquires camera

---

## Environment variable reference

| Variable | Where set | Purpose |
|---|---|---|
| `PORT` | Render | Express listen port (Render injects `10000`) |
| `JWT_SECRET` | Render | Signs auth tokens — use a long random string |
| `CLIENT_ORIGIN` | Render | Allowed CORS origins (your Netlify URL) |
| `NODE_ENV` | Render | Set to `production` |
| `VITE_API_URL` | Netlify | Backend base URL used by the React app |
| `VITE_SOCKET_URL` | Netlify | Socket.IO server URL used by the React app |

---

## Free-tier limits & tips

| Platform | Limit | Notes |
|---|---|---|
| Render free | Spins down after 15 min inactivity | First request after sleep takes ~30 s cold-start |
| Render disk | 1 GB | Shared between db.json and user uploads |
| Netlify free | 100 GB bandwidth / month | More than enough for a demo |

**Avoid cold-start delays:** upgrade Render to Starter ($7/mo) or use an external ping service (e.g. UptimeRobot) to hit `/api/health` every 10 minutes.

---

## Local development (reminder)

```bash
# Install dependencies
npm install

# Start both API and Vite dev server
npm run dev

# API  → http://127.0.0.1:5000
# App  → http://127.0.0.1:5173
# Demo login: demo / password123
```
