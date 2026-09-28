# Referral & Affiliate Tracker

A full-stack web app for running referral programs. Users create campaigns, generate unique
tracked referral links, and see clicks, signups, conversion rate and rewards on a dashboard.

**Live demo:** _add your deployed link here_

## Tech stack

| Layer     | Technology                                              |
|-----------|---------------------------------------------------------|
| Frontend  | React, TypeScript, Vite, Tailwind CSS, React Router     |
| Backend   | Node.js, Express, TypeScript, Zod (validation)          |
| Database  | MySQL (mysql2 driver, parameterised queries)            |
| Auth      | JWT + bcrypt password hashing                           |
| API docs  | OpenAPI 3 / Swagger UI at `/api/docs`                   |
| Testing   | Vitest                                                  |

## Features

- Register / log in (JWT, bcrypt-hashed passwords)
- Create campaigns with a per-signup reward; pause or reactivate them
- Generate multiple unique referral links per campaign (e.g. one per channel)
- Public link `/r/:code` records a click and redirects to a signup page
- Public signup page records a conversion and credits the campaign reward
- Dashboard: total clicks, signups, conversion rate, rewards credited, per-campaign and per-link stats
- Input validation, ownership checks (users only see their own data), duplicate-signup protection

## Project structure

```
referral-tracker/
├── server/            Express + TypeScript API
│   ├── schema.sql     MySQL schema
│   └── src/           index.ts, auth.ts, routes/, openapi.ts, utils.ts (+ tests)
├── client/            React + Tailwind frontend
│   └── src/           App.tsx, api.ts, pages/
├── docs/ARCHITECTURE.md
└── docker-compose.yml Optional local MySQL
```

## Run locally

**Prerequisites:** Node.js 18+, MySQL 8 (or `docker compose up -d` for a ready-made one).

```bash
# 1. Database
mysql -u root -p < server/schema.sql

# 2. Backend
cd server
cp .env.example .env        # then edit DB_PASSWORD, JWT_SECRET
npm install
npm run dev                 # API on http://localhost:4000, docs at /api/docs

# 3. Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev                 # App on http://localhost:5173
```

**Try it:** register → create a campaign → generate a link → open the link in a private
window → sign up as a referred user → refresh the dashboard.

## Tests

```bash
cd server && npm test
```

## API summary

Full interactive docs: `http://localhost:4000/api/docs`

| Method | Endpoint                      | Auth | Description                                |
|--------|-------------------------------|------|--------------------------------------------|
| POST   | /api/auth/register            | No   | Create account, returns JWT                |
| POST   | /api/auth/login               | No   | Log in, returns JWT                        |
| GET    | /api/campaigns                | Yes  | List campaigns + dashboard totals          |
| POST   | /api/campaigns                | Yes  | Create campaign                            |
| GET    | /api/campaigns/:id            | Yes  | Campaign detail, links, recent signups     |
| PATCH  | /api/campaigns/:id            | Yes  | Pause / activate                           |
| POST   | /api/campaigns/:id/links      | Yes  | Generate a unique referral link            |
| GET    | /r/:code                      | No   | Record click, redirect to signup page      |
| GET    | /api/public/ref/:code         | No   | Campaign name for a referral code          |
| POST   | /api/public/signup            | No   | Record a signup (conversion) + reward      |

## Deployment

1. **Database:** any hosted MySQL (Railway, Aiven, PlanetScale-compatible, AWS RDS). Run `schema.sql`.
2. **Backend:** Render / Railway / AWS. Build `npm install && npm run build`, start `npm start`.
   Set `DB_*`, `JWT_SECRET`, and `CLIENT_URL` (your frontend URL, needed for CORS and redirects).
3. **Frontend:** Vercel / Netlify. Build `npm run build`, output `dist`.
   Set `VITE_API_URL` to your backend URL.
4. Put both live URLs at the top of this README and on your resume.

## Possible improvements

Rate limiting on public endpoints, click de-duplication by IP/cookie, pagination, integration
tests against a test database, Dockerfiles for both apps, CI with GitHub Actions.
