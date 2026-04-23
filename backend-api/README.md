# Sketu Backend Starter

Production-style backend starter for the Sketu React Native hiring app.

## Features
- JWT auth for workers and factories
- Worker profiles
- Factory profiles
- Job posting and search
- Worker applications
- Factory shortlist + hire flow
- Simple dashboard summary endpoint
- MongoDB + Mongoose + TypeScript + Zod validation

## Quick start
```bash
cp .env.example .env
npm install
npm run dev
```

## Main routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/workers/search`
- `GET /api/workers/me/profile`
- `PUT /api/workers/me/profile`
- `GET /api/factories/me/profile`
- `PUT /api/factories/me/profile`
- `POST /api/jobs`
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `PATCH /api/jobs/:id`
- `POST /api/jobs/:jobId/apply`
- `GET /api/jobs/:jobId/applications`
- `POST /api/applications/:id/shortlist`
- `POST /api/applications/:id/hire`
- `GET /api/dashboard/factory/summary`

## Auth payload examples
### Register worker
```json
{
  "role": "WORKER",
  "fullName": "Ravi Kumar",
  "email": "ravi@example.com",
  "phone": "9876543210",
  "password": "StrongPass123",
  "preferredAreas": ["Jeedimetla", "Balanagar"],
  "preferredRoles": ["Production Supervisor", "Machine Operator (CNC, Lathe, Milling)"],
  "skills": ["OEE", "Line balancing"],
  "preferredShifts": ["General", "Rotational"]
}
```

### Register factory
```json
{
  "role": "FACTORY",
  "companyName": "Astra Precision Components",
  "hrName": "Priya Reddy",
  "email": "hr@astra.com",
  "phone": "9000000000",
  "password": "StrongPass123",
  "industrialAreas": ["Jeedimetla"],
  "description": "Precision manufacturing company"
}
```
