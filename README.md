# BizTransform

Small business digital transformation MVP: take a short Yes/No assessment, see a digital maturity radar score, and generate an AI-powered action roadmap.

## Stack

- **Frontend:** React (Vite), React Router, Tailwind CSS, Recharts, lucide-react, axios
- **Backend:** Node.js + Express
- **Database:** MySQL (`mysql2` pool, raw SQL)
- **Auth:** JWT + bcrypt
- **AI:** Anthropic Claude via `services/aiService.js` → `generateRoadmap()`

## Prerequisites

- Node.js 18+
- MySQL 8+

## Setup

> Note: the app is now branded **BizTransform**, but the underlying MySQL database is still
> named `digitalready` to avoid disrupting any existing local setup and data. Rename it later
> if you want full consistency — see the note at the end of this file.

### 1. Create the database

```sql
CREATE DATABASE digitalready CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then load the schema and seed data:

```bash
mysql -u root -p digitalready < backend/schema.sql
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your MySQL credentials, a strong `JWT_SECRET`, and (for roadmap generation) your `ANTHROPIC_API_KEY`.

```bash
npm install
npm run dev
```

API runs at `http://localhost:5000`.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Demo flow

1. Register as **business** (or **advisor**)
2. Log in → take the assessment (15 Yes/No questions)
3. View radar chart + maturity level on the dashboard
4. Click **Generate my roadmap** (requires `ANTHROPIC_API_KEY`)
5. As an **advisor**, open `/advisor` to see all businesses sorted by score

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register business or advisor |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/questions` | Yes | Questions grouped by category |
| POST | `/api/assessments` | Yes | Submit answers, compute scores |
| GET | `/api/assessments` | Yes | List current user's assessments |
| GET | `/api/assessments/:id` | Yes | Assessment detail + category breakdown |
| POST | `/api/assessments/:id/roadmap` | Yes | Generate (or return cached) AI roadmap |
| GET | `/api/assessments/:id/roadmap` | Yes | Fetch stored roadmap |
| GET | `/api/admin/businesses` | Advisor | All businesses + latest scores |

## Project structure

```
/backend
  server.js
  db.js
  schema.sql
  .env.example
  /routes
  /middleware
  /services/aiService.js
/frontend
  /src/pages
  /src/components
  /src/context
  /src/api
```

## Notes

- Passwords are bcrypt-hashed and never returned from the API.
- Swap AI providers later by replacing only `generateRoadmap()` in `backend/services/aiService.js`.
- Scoring: each category is (% of Yes answers) × 100; overall score is the average of the five category scores.
- Levels: Foundation Needed (<40), Getting Started (40–59), Digitally Growing (60–79), Digital Ready (80+).
- To fully rename the database from `digitalready` to `biztransform`: create a new database
  called `biztransform`, run `backend/schema.sql` against it, update `DB_NAME` in
  `backend/.env`, and update the hardcoded database name in `backend/load-schema.js`. This isn't
  done automatically since it would require migrating or re-seeding any data you've already
  created under `digitalready`.
