# JoinSkill

JoinSkill is a full-stack collaborative learning portal. Users can register, set up a profile, discover mentors, chat, start video sessions, take skill certification tests, and get AI-powered mentor responses.

---

## 🚀 Live Demo

- **Frontend (Netlify):** https://join-skill.netlify.app
- **Backend (Render):** https://joinskill-main.onrender.com

> ⚠️ Render free tier sleeps after 15 min of inactivity. First request may take 30–60 seconds.

---

## 🔑 Environment Variables

### Backend (Render)

| Variable | Value |
|---|---|
| `PORT` | `10000` |
| `JWT_SECRET` | any long random string |
| `CLIENT_ORIGIN` | `https://join-skill.netlify.app` |
| `NODE_ENV` | `production` |

### Frontend (Netlify)

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://joinskill-main.onrender.com` |
| `VITE_SOCKET_URL` | `https://joinskill-main.onrender.com` |
| `VITE_ANTHROPIC_API_KEY` | `sk-ant-xxxxxxxx` (your Anthropic key) |

---

## 💻 Run Locally

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

Create a `.env` file in the root (copy from `.env.example`):

```env
PORT=5000
JWT_SECRET=joinskill-local-secret
CLIENT_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
VITE_API_URL=http://127.0.0.1:5000
VITE_SOCKET_URL=http://127.0.0.1:5000
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

Demo login:
- Username: `demo`
- Password: `password123`

---

## 📦 Deploy

### Step 1 — Backend on Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Set environment variables (see table above)
5. Build command: `npm install`
6. Start command: `node server/index.js`
7. Add a **Disk** → mount path: `/opt/render/project/src/server` (persists DB + uploads)

### Step 2 — Frontend on Netlify

1. Go to [netlify.com](https://netlify.com) → Import from Git
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variables (see table above)
5. Deploy

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Lucide Icons |
| Backend | Node.js, Express, Socket.IO |
| Auth | JWT + bcrypt |
| AI Chat | Anthropic Claude API (claude-sonnet-4) |
| Video | WebRTC + Socket.IO signaling |
| Database | JSON flat-file (`server/data/db.json`) |
| Hosting | Netlify (frontend) + Render (backend) |

---

## ✨ Features

- Register / Login with JWT authentication
- Profile setup with photo upload
- Skill & interest based user discovery
- AI Mentor Chat (powered by Claude API)
- AI Video Session (simulated with Claude API)
- Real-time messaging with Socket.IO
- WebRTC peer-to-peer video sessions
- Skill certification tests
- AI profile scoring & skill recommendations

---

## 🐛 Common Issues

**"Failed to fetch" on login/register**
→ Check `VITE_API_URL` in Netlify env vars points to `https://joinskill-main.onrender.com`

**"Sorry, I'm having a technical issue" in AI chat**
→ Check `VITE_ANTHROPIC_API_KEY` is set in Netlify env vars

**Server cold start (30–60s delay)**
→ Render free tier sleeps. Wait and retry.

**CORS error in browser console**
→ Check `CLIENT_ORIGIN` in Render env vars is set to `https://join-skill.netlify.app`
