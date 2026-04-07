# j-app-tracker backend (Express + TypeScript + MongoDB)

## Setup

```bash
cd be
cp .env.example .env
# then edit .env and set MONGODB_URI + JWT_SECRET
npm install
npm run dev
```

## Endpoints

- `GET /api/health` → server status
- `POST /api/auth/register` → `{ "email": "...", "password": "..." }` → returns `{ token, user }`
- `POST /api/auth/login` → `{ "email": "...", "password": "..." }` → returns `{ token, user }`
- `GET /api/items` → list items
- `POST /api/items` → create item `{ "name": "..." }`

`/api/items` is protected — send `Authorization: Bearer <token>`.
