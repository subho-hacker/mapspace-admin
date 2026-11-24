import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import { config, assertConfig } from './config.js'
import { connect, disconnect, getDb } from './db.js'
import { bootstrap } from './seed.js'
import { requireAuth, wrap } from './auth.js'
import session from './routes/session.js'
import admins from './routes/admins.js'
import data from './routes/data.js'
import ai from './routes/ai.js'
import settings from './routes/settings.js'
import search from './routes/search.js'
import resources from './routes/resources.js'

assertConfig()
await connect()
await bootstrap()

const app = express()
app.disable('x-powered-by')
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1)   // set when behind nginx / a load balancer

app.use((_req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' })
  next()
})
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)),
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 600
}))
app.use('/api/data/import', express.json({ limit: '15mb' }))   // backups can be large; this parser runs first
app.use(express.json({ limit: '1mb' }))

const api = express.Router()
api.get('/health', wrap(async (_req, res) => { await getDb().command({ ping: 1 }); res.json({ ok: true }) }))
api.use('/auth', session)            // login, google, me
api.use(requireAuth)                 // everything below needs a valid session
api.use('/data', data)               // backup, restore, wipe, reset (Super Admin)
api.use('/ai', ai)
api.use('/settings', settings)
api.use('/search', search)
api.use(admins)                      // /admins, /permits, /logins (Super Admin)
api.use(resources)                   // /drivers, /shipments, ...
api.use((_req, res) => res.status(404).json({ error: 'Not found.' }))
app.use('/api', api)

// One-process deployment: after `npm run build` the server also serves the built frontend.
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist')
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist))
  console.log('[server] Serving the built app from', dist)
}

app.use((err, _req, res, _next) => {
  const status = err.type === 'entity.parse.failed' ? 400 : err.type === 'entity.too.large' ? 413 : err.status || (err.code === 11000 ? 409 : 500)
  if (status >= 500) console.error(err)
  const message = status >= 500 && config.isProd ? 'Server error.' : err.type === 'entity.parse.failed' ? 'That is not valid JSON.' : err.code === 11000 ? 'That ID already exists.' : err.message
  res.status(status).json({ error: message, ...(typeof err.code === 'string' ? { code: err.code } : {}) })
})

const server = app.listen(config.port, () => console.log(`[server] MapSpace API on http://localhost:${config.port}/api  (db: ${config.dbName})`))
const stop = async () => { server.close(); await disconnect(); process.exit(0) }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
