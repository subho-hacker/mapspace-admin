# MapSpace server (Express + MongoDB)

Stores everything the app saves: drivers, customers, shipments, deliveries, finance, notifications, chats, **vehicles**,
admin accounts and login keys, permit requests, sign-in history, company settings and the AI-suggestion log.

## Quick start

```bash
# 1. MongoDB: local install, Docker (docker run -d -p 27017:27017 mongo:7), or an Atlas connection string
# 2. Server
cd server
npm install
cp .env.example .env        # then edit MONGODB_URI and set JWT_SECRET
npm start                   # creates indexes, the first Super Admin and demo data (first run only)

# 3. App (new terminal, project root)
cp .env.example .env        # keeps VITE_API_URL=/api
npm install
npm run dev                 # http://localhost:5173, /api is proxied to http://localhost:4000
```

Sign in with `MS-ADM-001` / `MS-SUPER-2026` (or your `SEED_ADMIN_*` values), then open **Settings > Admin access** and issue
yourself a new key straight away.

Remove `VITE_API_URL` from the app's `.env` to run the old browser-only demo mode (no database).

## What lives where

| Collection | Contents |
|---|---|
| `drivers` `customers` `shipments` `deliveries` `transactions` `notifications` `conversations` `vehicles` | Business records. Each has a unique string `id` (e.g. `SH-2401`). |
| `admins` | Admin ID, name, role, **scrypt-hashed** login key, suspended flag. Keys are never stored in plain text. |
| `permits` | Requests to suspend/remove another Super Admin (30 minute expiry). |
| `logins` | Sign-in history, deleted automatically after 90 days. |
| `settings` | One shared document with company settings. |
| `ai_applied` | Latest 30 applied AI suggestions. |
| `counters`, `meta` | Admin ID counter; a flag that stops demo data refilling a database you deliberately emptied. |

Still in the browser by design: theme and style preference (per device), and the session token.
Still generated in the frontend: the analytics charts and the simulated live GPS feed (`src/data/analyticsData.js`, `trackData.js`).
They are demo figures, not records. Swap them for real telemetry when you have it.

## Security model

* Login keys: scrypt with a random salt per key, constant-time compare, same cost for unknown IDs, 5 wrong tries lock that ID+IP for 30 seconds.
* Sessions: signed JWT (HS256, 8 hours by default). **Every request re-checks the admin in MongoDB**, so a suspended or removed admin
  is cut off on their next request and a role change applies immediately.
* Roles are enforced on the server: only a Super Admin can manage admins, permits, backups, restore, wipe and reset.
  Suspending or removing another Super Admin needs a permit approved with a *different* Super Admin's own key (or your own key when
  you are the only one), and the last active Super Admin can never be removed.
* Request bodies are rejected if they contain `$operators` or dotted field names (Mongo injection). Record IDs must match `[A-Za-z0-9._:-]{1,64}`.
* Google sign-in: the ID token is verified on the server and exchanged for a session, only for emails in `ADMIN_EMAILS`.
  If `ADMIN_EMAILS` is empty, Google sign-in is refused.
* Backups never contain admin accounts or keys. Restore validates the whole file before it changes anything.
* Sessions are stateless: signing out removes the token from the browser; the token itself expires on its own.

## API (all under `/api`, JSON, `Authorization: Bearer <token>` except `/auth/*` and `/health`)

```
POST /auth/login {id,key}            -> {token,user}        POST /auth/google {credential}      GET /auth/me
GET|POST /{collection}               PUT|DELETE /{collection}/{id}      GET /search?q=
GET|PUT /settings                    GET|POST /ai/applied
GET|POST /admins   POST /admins/:id/reset-key   PUT /admins/:id/off {off}   DELETE /admins/:id      (Super Admin)
GET|POST /permits  POST /permits/:id/cancel     POST /permits/:id/decide {approve,key}   GET /logins (Super Admin)
GET /data/export   POST /data/import   POST /data/wipe   POST /data/reset                            (Super Admin)
```
`{collection}` is one of drivers, customers, shipments, deliveries, transactions, notifications, conversations, vehicles.
Lists come back newest first. Chat updates are merged by message ID, so two admins replying at once never overwrite each other.

## Production checklist

1. `NODE_ENV=production` and a random `JWT_SECRET` of 32+ characters (the server refuses to start without it).
2. Change the first Super Admin key (or set `SEED_ADMIN_KEY` before the first start).
3. Serve over HTTPS (nginx/Caddy/your host) and set `TRUST_PROXY=1`.
4. `npm run build` in the project root; the server then serves `dist/` too, so one process serves app and API at the same origin.
   Otherwise set `CORS_ORIGIN` to your frontend's URL and `VITE_API_URL` to the API URL when building.
5. Back up MongoDB itself (`mongodump` / Atlas backups). The in-app backup is a convenience, not a replacement.

## Commands

`npm start` · `npm run dev` (auto-restart) · `npm run seed` (fill empty collections) · `npm run seed:force` (replace with demo data) · `npm test`
