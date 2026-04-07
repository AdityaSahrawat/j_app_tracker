# AI-Assisted Job Application Tracker

A full-stack job application tracker with:
- Email/password auth (JWT)
- Kanban board to track application status (drag & drop)
- AI helpers: parse a job description into structured fields, and generate resume bullets

Repo structure:
- `be/` — Express + TypeScript + MongoDB (Mongoose)
- `fe/` — React + TypeScript + Vite + Tailwind

## Run locally

### 1) Backend

```bash
cd be
cp .env.example .env
npm install
npm run dev
```

Backend defaults to `http://localhost:4000`.

### 2) Frontend

```bash
cd fe
cp .env.example .env
npm install
npm run dev
```

Frontend defaults to `http://localhost:5173` (Vite dev server).

### 3) Use the app

1. Open the frontend URL.
2. Register a new account, then login.
3. Create applications, drag cards between columns, and click a card to edit.
4. (Optional) Paste a job description and use the AI buttons.

## Environment variables

### Backend (`be/.env`)

Required:
- `MONGODB_URI` — Mongo connection string (example local: `mongodb://localhost:27017/j_app_tracker`)
- `JWT_SECRET` — long random secret used to sign JWTs (generate with `openssl rand -hex 32`)

Notes (Atlas): ensure the database user/password are correct, URL-encode special characters in the password, and allow your IP in Atlas Network Access.

Optional:
- `PORT` — default `4000`
- `JWT_EXPIRES_IN` — default `7d`
- `BCRYPT_SALT_ROUNDS` — default `12`

AI (optional — without these, AI endpoints return a friendly 503):
- `OPENAI_API_KEY`
- `OPENAI_MODEL` — default `gpt-4o-mini`
- `OPENAI_BASE_URL` — default `https://api.openai.com/v1`

### Frontend (`fe/.env`)

- `VITE_API_URL` — backend API base URL (default `http://localhost:4000/api`)

## API overview

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`

Applications (protected):
- `GET /api/applications`
- `POST /api/applications`
- `GET /api/applications/:id`
- `PATCH /api/applications/:id`
- `DELETE /api/applications/:id`

AI (protected):
- `POST /api/ai/parse-jd`
- `POST /api/ai/resume-suggestions`

## Implementation decisions

- **React + Vite + TypeScript** for a fast dev loop and strict typing across the UI.
- **Tailwind CSS v4** for utility-first styling using a small set of CSS variables (no custom theme sprawl).
- **dnd-kit** for accessible, predictable drag-and-drop behavior in the Kanban board.
- **Express + TypeScript** for a lightweight API server and clear request/response typing.
- **MongoDB + Mongoose** for flexible iteration on the application schema with validation.
- **OpenAI JSON mode + service layer** so AI responses can be parsed and validated deterministically; AI errors are surfaced to users only when safe via an `HttpError` “expose” flag.
