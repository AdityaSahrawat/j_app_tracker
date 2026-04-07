# j-app-tracker backend (Express + TypeScript + MongoDB)

## Setup

```bash
cd be
cp .env.example .env
# then edit .env and set MONGODB_URI
npm install
npm run dev
```

## Endpoints

- `GET /api/health` → server status
- `GET /api/items` → list items
- `POST /api/items` → create item `{ "name": "..." }`
