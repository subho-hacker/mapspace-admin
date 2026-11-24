import { Router } from 'express'
import { col, RESOURCES, REQUIRED_IN_BACKUP, PUBLIC } from '../db.js'
import { wrap, HttpError, requireSuper, body } from '../auth.js'
import { clean } from '../security.js'
import { seedDemoData } from '../seed.js'
import { validateSettings } from './settings.js'
import { validateApplied, listApplied } from './ai.js'

const r = Router()
r.use(requireSuper)

const ID = /^[A-Za-z0-9._:-]{1,64}$/
const stamp = rows => rows.map((x, i) => ({ ...x, _ord: rows.length - i }))

// Admins, login keys and permits are deliberately NOT part of a backup file.
r.get('/export', wrap(async (_req, res) => {
  const data = {}
  for (const n of RESOURCES) data[n] = await col(n).find({}, PUBLIC).sort({ _ord: -1, _id: -1 }).toArray()
  const { _id, ...settings } = (await col('settings').findOne({ _id: 'app' })) || {}
  res.json({ app: 'mapspace', version: 1, exportedAt: new Date().toISOString(), data, settings: Object.keys(settings).length ? settings : null, aiApplied: await listApplied() })
}))

r.post('/import', wrap(async (req, res) => {
  const o = body(req)
  if (o.app !== 'mapspace' || !o.data || typeof o.data !== 'object') throw new HttpError(400, 'This is not a MapSpace backup file.')
  for (const n of REQUIRED_IN_BACKUP) if (!Array.isArray(o.data[n])) throw new HttpError(400, `Backup is missing "${n}".`)
  // Validate everything first so a bad file can never leave the database half-restored.
  const plan = {}
  for (const n of RESOURCES) {
    if (o.data[n] === undefined) continue
    if (!Array.isArray(o.data[n])) throw new HttpError(400, `"${n}" must be a list.`)
    const seen = new Set()
    plan[n] = clean(o.data[n]).map(x => {
      if (!x || typeof x !== 'object' || Array.isArray(x) || typeof x.id !== 'string' || !ID.test(x.id)) throw new HttpError(400, `A record in "${n}" has no valid id.`)
      if (seen.has(x.id)) throw new HttpError(400, `"${n}" has the id ${x.id} twice.`)
      seen.add(x.id)
      const { _id, _ord, ...rest } = x
      return rest
    })
  }
  const settings = o.settings ? validateSettings(clean(o.settings)) : null
  const applied = (Array.isArray(o.aiApplied) ? o.aiApplied : []).slice(0, 30).map(a => validateApplied(typeof a === 'string' ? { id: a, title: a } : clean(a)))
  for (const [n, rows] of Object.entries(plan)) {
    await col(n).deleteMany({})
    if (rows.length) await col(n).insertMany(stamp(rows))
  }
  await col('settings').deleteMany({})
  if (settings && Object.keys(settings).length) await col('settings').insertOne({ _id: 'app', ...settings })
  await col('ai_applied').deleteMany({})
  if (applied.length) await col('ai_applied').insertMany(applied.map(a => ({ ...a })))
  res.status(204).end()
}))

const wipe = async () => {
  await Promise.all([...RESOURCES.map(n => col(n).deleteMany({})), col('settings').deleteMany({}), col('ai_applied').deleteMany({})])
}

r.post('/wipe', wrap(async (_req, res) => { await wipe(); res.status(204).end() }))
r.post('/reset', wrap(async (_req, res) => { await wipe(); await seedDemoData({ force: true }); res.status(204).end() }))

export default r
