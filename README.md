# JoinSkill

JoinSkill is a full-stack collaborative learning portal. Users can register or sign in, set up a learning profile, upload a photo, list interests and skills, pass skill tests, find mentors or learners, chat, start a video-session room, and receive AI-style profile and skill recommendations.

## Run locally

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Backend API: `http://localhost:5000`

Demo login:

- Username: `demo`
- Password: `password123`

## Included modules

- Username/password authentication with JWT
- Profile setup with photo upload
- Skill and interest based user discovery
- Certification tests for core skills
- Chat conversations with Socket.IO updates
- Video session room UI with local camera preview
- Student recommendation scoring
- AI-style profile scoring
- Skill recommendation system using a simple skill graph and trend signals

Data is stored in `server/data/db.json` for easy local development.
