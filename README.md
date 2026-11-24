# MapSpace Admin

**With MongoDB (recommended):** see [server/README.md](server/README.md). In short: `npm run api:install`, copy `server/.env.example` to `server/.env`, `npm run api`, then in another terminal copy `.env.example` to `.env` and `npm install && npm run dev`.

**Demo mode (no database):** delete `VITE_API_URL` from `.env`, then `npm install && npm run dev`. Data stays in the browser.

Built: layout (sidebar, topbar, profile popup, mock login), Fleet, Analytics (click-through reports), AI Intelligence.
All data flows from src/data. AI output is rule-based mock. Login is a demo, not real auth.

## Update notes
- Dates follow the real clock (src/utils/now.js). Only months up to today appear; the current month is month-to-date.
- Live Tracking and the dashboard map use Leaflet over West Bengal (OpenStreetMap, Esri satellite, OpenTopoMap; no API key). Vehicle positions are a simulated feed in src/hooks/useFleet.js; swap in real telemetry there.
- Heatmaps: daily calendar + monthly strip on the dashboard, and a Today/Month city heat overlay on the map.
- Shipments carry product and category. Financial Management has daily/monthly expenses, categories, amounts to pay and to receive.
- CRUD: bulk select, bulk status, duplicate, undo delete.
- Multi-admin login: sign in with Admin ID + private login key. First Super Admin: `MS-ADM-001` / `MS-SUPER-2026` (change it right away in Settings > Admin access > Issue new key). With the MongoDB server, keys are scrypt-hashed and verified server-side; in demo mode they are checked in the browser only.
- MongoDB: all records (including vehicles), admins, permits, sign-ins, settings and the AI log are stored by `server/`. Backup, restore, wipe and reset work against the database.
