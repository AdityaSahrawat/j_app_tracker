# j-app-tracker backend (Express + TypeScript + MongoDB)

See the root README for end-to-end setup: `../README.md`.

## Setup

```bash
cd be
cp .env.example .env
# then edit .env and set MONGODB_URI + JWT_SECRET
# (optional) set OPENAI_API_KEY to enable AI parsing
npm install
npm run dev
```

## Environment variables

Required:
- `MONGODB_URI`
- `JWT_SECRET` (generate with `openssl rand -hex 32`)

Atlas note: if you use an Atlas connection string, make sure the DB user/password are correct and your IP is allowed in Network Access. URL-encode special characters in the password.

Optional:
- `PORT` (default `4000`)
- `JWT_EXPIRES_IN` (default `7d`)
- `BCRYPT_SALT_ROUNDS` (default `12`)

AI (optional):
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default `gpt-4o-mini`)
- `OPENAI_BASE_URL` (default `https://api.openai.com/v1`)

## Endpoints

- `GET /api/health` → server status
- `POST /api/auth/register` → `{ "email": "...", "password": "..." }` → returns `{ token, user }`
- `POST /api/auth/login` → `{ "email": "...", "password": "..." }` → returns `{ token, user }`
- `GET /api/applications` → list applications (protected)
- `POST /api/applications` → create application (protected)
- `GET /api/applications/:id` → get application (protected)
- `PATCH /api/applications/:id` → update application (protected)
- `DELETE /api/applications/:id` → delete application (protected)

- `POST /api/ai/parse-jd` → parse a job description (protected)
- `POST /api/ai/resume-suggestions` → generate 3-5 resume bullets for a job description (protected)

- `GET /api/items` → list items (protected, demo)
- `POST /api/items` → create item `{ "name": "..." }` (protected, demo)

Protected routes require `Authorization: Bearer <token>`.
