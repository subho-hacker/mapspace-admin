import { MongoClient } from 'mongodb'
import { config } from './config.js'

// Business collections. Every document has a unique string `id` (e.g. "SH-2401") plus a private `_ord`
// number that keeps list order stable (newest created first, seeds in their original order).
export const RESOURCES = ['drivers', 'customers', 'shipments', 'deliveries', 'transactions', 'notifications', 'conversations', 'vehicles']
// Included in backups. `vehicles` is optional there so backups from older versions still restore.
export const REQUIRED_IN_BACKUP = RESOURCES.filter(n => n !== 'vehicles')

let client, db
export const __setDb = d => { db = d }   // used by tests to inject a fake database
export const getDb = () => { if (!db) throw new Error('Database is not connected.'); return db }
export const col = name => getDb().collection(name)

export async function connect() {
  client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 20 })
  await client.connect()
  db = client.db(config.dbName)
  await db.command({ ping: 1 })
  await ensureIndexes()
  return db
}

export async function disconnect() { await client?.close(); client = db = undefined }

async function ensureIndexes() {
  await Promise.all([
    ...RESOURCES.map(n => Promise.all([
      db.collection(n).createIndex({ id: 1 }, { unique: true }),
      db.collection(n).createIndex({ _ord: -1 })
    ])),
    db.collection('admins').createIndex({ id: 1 }, { unique: true }),
    db.collection('permits').createIndex({ id: 1 }, { unique: true }),
    db.collection('permits').createIndex({ status: 1, expires: 1 }),
    // Sign-in history is kept for 90 days, then MongoDB removes it automatically.
    db.collection('logins').createIndex({ at: 1 }, { expireAfterSeconds: 90 * 24 * 3600 }),
    db.collection('ai_applied').createIndex({ time: -1 })
  ])
}

// Strips private fields before a document leaves the server.
export const PUBLIC = { projection: { _id: 0, _ord: 0 } }
export const pub = d => { if (!d) return d; const { _id, _ord, ...rest } = d; return rest }
