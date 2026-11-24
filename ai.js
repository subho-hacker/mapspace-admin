import { Router } from 'express'
import { col } from '../db.js'
import { wrap, HttpError, body } from '../auth.js'

const r = Router()
const KEEP = 30
const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '')

// Validates one "applied AI suggestion" record (also used when restoring a backup).
export function validateApplied(x) {
  if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !x.id || x.id.length > 80) throw new HttpError(400, 'Invalid record.')
  const time = typeof x.time === 'string' && !Number.isNaN(Date.parse(x.time)) ? x.time : new Date().toISOString()
  return { id: x.id, title: str(x.title, 200), time, result: str(x.result, 1000), by: str(x.by, 100) }
}

export const listApplied = async () => (await col('ai_applied').find({}, { projection: { _id: 0, at: 0 } }).sort({ time: -1 }).limit(KEEP).toArray())

r.get('/applied', wrap(async (_req, res) => res.json(await listApplied())))

r.post('/applied', wrap(async (req, res) => {
  const rec = validateApplied(body(req))
  await col('ai_applied').insertOne({ ...rec })
  const old = await col('ai_applied').find({}, { projection: { _id: 1 } }).sort({ time: -1 }).skip(KEEP).toArray()
  if (old.length) await col('ai_applied').deleteMany({ _id: { $in: old.map(o => o._id) } })
  res.status(201).json(rec)
}))

export default r
