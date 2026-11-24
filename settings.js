import { Router } from 'express'
import { col } from '../db.js'
import { wrap, HttpError, body } from '../auth.js'

const r = Router()
const bool = v => typeof v === 'boolean'
const RULES = {
  company: v => typeof v === 'string' && v.trim().length > 0 && v.length <= 80,
  tz: v => ['Asia/Kolkata', 'UTC', 'Asia/Dubai'].includes(v),
  refresh: v => ['1', '2', '5', '10'].includes(String(v)),
  wm: bool, email: bool, sms: bool, push: bool, compact: bool
}

// Keeps only known settings and checks each value. Throws on a bad value, ignores unknown keys.
export function validateSettings(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Settings must be an object.')
  const out = {}
  for (const [k, check] of Object.entries(RULES)) {
    if (!(k in input)) continue
    if (!check(input[k])) throw new HttpError(400, `Invalid value for "${k}".`)
    out[k] = k === 'refresh' ? String(input[k]) : k === 'company' ? input[k].trim() : input[k]
  }
  return out
}

const read = async () => { const { _id, ...s } = (await col('settings').findOne({ _id: 'app' })) || {}; return s }

r.get('/', wrap(async (_req, res) => res.json(await read())))

r.put('/', wrap(async (req, res) => {
  const s = validateSettings(body(req))
  if (Object.keys(s).length) await col('settings').updateOne({ _id: 'app' }, { $set: s }, { upsert: true })
  res.json(await read())
}))

export default r
