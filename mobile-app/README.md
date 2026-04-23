# Sketu React Native app - API connected version

This version wires the Expo Router mobile app to the Sketu backend starter.

## Connected features

- login with `POST /api/auth/login`
- worker registration with `POST /api/auth/register`
- factory registration with `POST /api/auth/register`
- restore session and fetch profile with `GET /api/auth/me`
- live jobs list with `GET /api/jobs`
- apply to jobs with `POST /api/jobs/:jobId/apply`
- live worker search with `GET /api/workers/search`
- factory dashboard summary with `GET /api/factories/dashboard/summary`
- factory job posting with `POST /api/jobs`

## Setup

1. Start the backend.
2. Copy `.env.example` to `.env`.
3. Set `EXPO_PUBLIC_API_BASE_URL` to your backend URL, for example:
   `http://192.168.1.10:5000`
4. Install dependencies.
5. Start Expo.

## Commands

```bash
npm install
npx expo start
```

## Important note for Android/iPhone testing

Do not use `localhost` for the mobile app unless the backend is running inside the same simulator environment.
Use your computer's LAN IP address so the phone can reach the backend.

## Added files

- `lib/api.ts`
- `lib/storage.ts`
- `lib/mappers.ts`
- `services/auth.ts`
- `services/jobs.ts`
- `services/workers.ts`
- `services/factory.ts`

## Next screens after this

- candidate pipeline for shortlisted and hired applications
- worker profile edit screen
- factory profile edit screen
- job details screen
- resume / certificate upload
- push notifications


## Added in this version

- `app/(tabs)/profile.tsx`
- worker profile edit form wired to `GET/PUT /api/workers/me/profile`
- factory profile edit form wired to `GET/PUT /api/factories/me/profile`
- profile tab in bottom navigation
- quick access from Home tab to edit profile


## Added worker job features

- Job details screen
- Worker application history
- Saved jobs using local device storage
