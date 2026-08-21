# BiteRush

Food ordering platform rebuilt from the [Google Stitch BiteRush project](https://stitch.withgoogle.com/project/16097317333868995516).

Stack: **MongoDB (Docker)** · **NestJS API** · **React (Vite) UI**

The database starts empty. There is no seed, demo restaurant, or fake account.

## User roles

| Role | How to get access | What they see |
|------|-------------------|---------------|
| **Customer** | Self-register at `/register` | Browse branches, cart, checkout, track orders |
| **Main manager** | Self-register as “Main manager” | Create brand, add branches, invite staff, view **all branch** data |
| **Branch manager** | Invited by email from main manager | Manage **one branch** only (menu, orders, kitchen, reservations) |
| **Rider** | Self-register or invited by main manager | Accept ready orders and update delivery status at `/rider` |

Branch managers cannot self-register. The main manager sends login credentials by email (or logs them in the backend console when SMTP is not configured).

## Quick start

```bash
docker compose up -d
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173`

## Google Maps setup

To enable customer pin selection and live rider tracking, add this to `frontend/.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_browser_key
```

Enable these Google APIs in Google Cloud:

- `Maps JavaScript API`
- `Places API`

Recommended restrictions for the key:

- Application restriction: HTTP referrers
- API restriction: only the Google Maps APIs used above

## Main manager flow

1. Register at `/register` as **Main manager**
2. Sign in → `/manager` → create your **restaurant brand**
3. Go to **Branches** → add branches (Gulberg, DHA, etc.)
4. Invite a **branch manager** per branch (email with temporary password)
5. Invite **riders** for delivery
6. Use the branch selector in the sidebar to drill into one branch, or leave it on **All branches** for combined dashboard stats

## Branch manager flow

1. Open the invite email (or backend logs if SMTP is off)
2. Sign in at `/login`
3. Manage menu, orders, kitchen, and reservations for **your branch only**

## Rider flow

1. Sign in at `/login` → `/rider`
2. Accept orders marked **ready** by the kitchen
3. Update status: picked up → on the way → delivered

## Customer flow

1. Register / sign in
2. Pick a branch on the home page
3. Add items to cart
4. In checkout, search or pin your exact delivery location on Google Maps
5. Track the rider on the live order map after dispatch

## Optional email (invites)

Add to `backend/.env`:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your-password
SMTP_FROM=BiteRush <noreply@example.com>
APP_URL=http://localhost:5173
```

Without SMTP, invite credentials are printed in the backend log.
