import { pathToFileURL } from 'node:url'
import { connect, disconnect, col, getDb, RESOURCES } from './db.js'
import { config, assertConfig } from './config.js'
import { hashKey } from './security.js'

// Demo data comes from the frontend's own seed file, so the app and the database always start identical.
async function loadSeeds() {
  const [{ seeds }, { vehicles }] = await Promise.all([
    import('../../src/data/resources.js'),
    import('../../src/data/fleetData.js')
  ])
  return { vehicles, ...seeds }
}

const withOrder = rows => rows.map((r, i) => ({ ...r, _ord: rows.length - i }))

// force=false only fills collections that are empty; force=true replaces them.
export async function seedDemoData({ force = false } = {}) {
  const seeds = await loadSeeds(), out = {}
  for (const name of RESOURCES) {
    const rows = seeds[name] || []
    if (force) await col(name).deleteMany({})
    else if (await col(name).estimatedDocumentCount() > 0) { out[name] = 'kept'; continue }
    if (rows.length) await col(name).insertMany(withOrder(rows), { ordered: true })
    out[name] = rows.length
  }
  await getDb().collection('meta').updateOne({ _id: 'seed' }, { $set: { at: new Date() } }, { upsert: true })
  return out
}

// Creates the first Super Admin only when there are no admins at all, and keeps the ID counter in step.
export async function ensureFirstAdmin() {
  const admins = col('admins')
  if (await admins.estimatedDocumentCount() === 0) {
    const { id, name, key } = config.seedAdmin
    await admins.insertOne({ id, name, role: 'Super Admin', hash: await hashKey(id, key), created: new Date().toISOString(), off: false })
    console.log(`[seed] First Super Admin created: ${id}`)
  }
  const nums = (await admins.find({}, { projection: { id: 1 } }).toArray()).map(a => parseInt(String(a.id).split('-').pop(), 10)).filter(Number.isFinite)
  await getDb().collection('counters').updateOne({ _id: 'admin' }, { $max: { seq: Math.max(0, ...nums) } }, { upsert: true })
}

// Runs once per database: later restarts never refill data an admin deliberately deleted.
export async function bootstrap() {
  await ensureFirstAdmin()
  const done = await getDb().collection('meta').findOne({ _id: 'seed' })
  if (!done && process.env.SEED_DEMO !== 'false') {
    try { console.log('[seed] Demo data:', await seedDemoData()) }
    catch (e) { console.warn('[seed] Skipped demo data:', e.message) }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  assertConfig()
  await connect()
  try {
    await ensureFirstAdmin()
    console.log('[seed] Demo data:', await seedDemoData({ force: process.argv.includes('--force') }))
  } finally { await disconnect() }
}
