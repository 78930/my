# Sketu — Full Stack Bundle (Fixed & Ready)

Industrial + leadership hiring platform for Hyderabad.

- **backend-api** — Node.js + Express + MongoDB + TypeScript REST API
- **mobile-app** — Expo React Native app (Android / iOS)

---

## Quick start

### Step 1 — Backend

```bash
cd backend-api
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm run dev
```

Test it: http://localhost:5000/health

### Step 2 — Mobile app

```bash
cd mobile-app
npm install
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_API_BASE_URL to your computer IP
npx expo start
```

Press `a` for Android, `i` for iOS, or scan QR code with Expo Go.

---

## Docker (easiest — runs backend + MongoDB together)

```bash
./deploy.sh
```

Or manually:

```bash
docker compose up --build
```

---

## API routes

| Method | Route | Auth |
|--------|-------|------|
| POST | /api/auth/register | — |
| POST | /api/auth/login | — |
| GET | /api/auth/me | Bearer |
| GET | /api/jobs | — |
| POST | /api/jobs | FACTORY |
| GET | /api/jobs/:id | — |
| POST | /api/jobs/:id/apply | WORKER |
| GET | /api/jobs/:id/applications | FACTORY |
| GET | /api/workers/search | — |
| GET | /api/workers/me/profile | WORKER |
| PUT | /api/workers/me/profile | WORKER |
| GET | /api/workers/me/applications | WORKER |
| GET | /api/factories/me/profile | FACTORY |
| PUT | /api/factories/me/profile | FACTORY |
| GET | /api/factories/jobs | FACTORY |
| GET | /api/factories/dashboard/summary | FACTORY |
| POST | /api/applications/:id/shortlist | FACTORY |
| POST | /api/applications/:id/hire | FACTORY |

---

## Environment variables

### backend-api/.env
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/sketu
JWT_SECRET=your-long-random-secret
CLIENT_ORIGIN=*
```

### mobile-app/.env
```
EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP:5000
```

---

## Bugs fixed from original repo

1. `auth.routes.ts` — `iimport` typo fixed → `import`
2. `auth.routes.ts` — `User.ts` import extension fixed → `User.js`
3. `auth.routes.ts` — `input.fullName` used for FACTORY role (wrong type) → fixed with role check
4. `User.ts` model — missing `phone` field added
5. `job.routes.ts` — incomplete (only had `GET /:id`), 4 routes added
6. `worker.routes.ts` — incomplete (only had `GET /:id`), 4 routes added
7. `Application.ts` model — missing `note` field added
8. `Application.ts` model — duplicate application guard index added
