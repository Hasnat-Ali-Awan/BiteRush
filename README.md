# BiteRush

Food ordering platform rebuilt screen-by-screen from Google Stitch designs.

## Screen 1 — Manager Dashboard

Stitch: **Manager Dashboard - Lahore BBQ House**

## Screen 2 — Menu Management

Stitch: **Menu Management - Lahore BBQ House** (`000d1aaf…`)

- List / filter / search dishes
- Toggle availability
- Add / edit drawer (variants + extras)
- Delete dish

Open `http://localhost:5173/menu`

### Menu API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/categories` | List categories |
| GET | `/api/v1/menu` | List dishes (`restaurantId`, `categoryId`, `available`, `search`) |
| POST | `/api/v1/menu` | Create dish |
| PATCH | `/api/v1/menu/:id` | Update dish |
| PATCH | `/api/v1/menu/:id/availability` | Toggle stock |
| DELETE | `/api/v1/menu/:id` | Delete dish |

## Quick start

**Desktop:** double-click **BiteRush** on your Desktop. It frees ports `3000`/`5173`, starts Docker MongoDB, then backend + frontend.

```bash
# 1. MongoDB
docker compose up -d

# 2. Backend
cd backend
npm install
npm run start:dev

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and click **Load demo data**, or:

```bash
curl -X POST http://localhost:3000/api/v1/seed
curl http://localhost:3000/api/v1/menu
```

Import `postman/BiteRush-Dashboard.postman_collection.json` into Postman.

## Postman endpoints (core)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/seed` | Seed restaurant, orders, reservations, menu |
| GET | `/api/v1/dashboard/restaurant` | Manager KPIs |
| GET | `/api/v1/orders?status=pending` | List orders |
| PATCH | `/api/v1/orders/:id/status` | Accept / reject |
| GET | `/api/v1/menu` | Menu list |
| POST/PATCH/DELETE | `/api/v1/menu...` | Menu CRUD |

## Next screens

Kitchen Display, Auth, Home, … — one Stitch screen at a time.
