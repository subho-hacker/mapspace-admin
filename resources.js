import { Router } from 'express'
import { col, RESOURCES, PUBLIC, pub } from '../db.js'
import { wrap, HttpError, body } from '../auth.js'
import { clean, BadInput } from '../security.js'

const r = Router()
const ID = /^[A-Za-z0-9._:-]{1,64}$/
const known = (req, _res, next) => (RESOURCES.includes(req.params.name) ? next() : next('router'))
const MAX_LIST = 5000

r.get('/:name', known, wrap(async (req, res) => {
  res.json(await col(req.params.name).find({}, PUBLIC).sort({ _ord: -1, _id: -1 }).limit(MAX_LIST).toArray())
}))

r.post('/:name', known, wrap(async (req, res) => {
  const doc = clean(body(req))
  if (typeof doc.id !== 'string' || !ID.test(doc.id)) throw new BadInput('Every record needs a valid "id".')
  delete doc._id; delete doc._ord
  try { await col(req.params.name).insertOne({ ...doc, _ord: Date.now() }) }
  catch (e) { if (e?.code === 11000) throw new HttpError(409, `${doc.id} already exists.`, 'DUPLICATE'); throw e }
  res.status(201).json(pub(doc))
}))

r.put('/:name/:id', known, wrap(async (req, res) => {
  const { name, id } = req.params, patch = clean(body(req))
  delete patch.id; delete patch._id; delete patch._ord
  const c = col(name)
  // Chats only ever grow. Merge by message id so two admins replying at once never erase each other's message.
  if (name === 'conversations' && Array.isArray(patch.messages)) {
    const cur = await c.findOne({ id }, { projection: { messages: 1 } })
    if (!cur) throw new HttpError(404, 'Not found.')
    const have = new Set((cur.messages || []).map(m => m?.id))
    patch.messages = [...(cur.messages || []), ...patch.messages.filter(m => m && typeof m === 'object' && !have.has(m.id))]
  }
  if (!Object.keys(patch).length) {
    if (!(await c.countDocuments({ id }, { limit: 1 }))) throw new HttpError(404, 'Not found.')
    return res.status(204).end()
  }
  const out = await c.updateOne({ id }, { $set: patch })
  if (!out.matchedCount) throw new HttpError(404, 'Not found.')
  res.status(204).end()
}))

// Deleting something that is already gone is not an error (two admins may delete the same row).
r.delete('/:name/:id', known, wrap(async (req, res) => {
  await col(req.params.name).deleteOne({ id: req.params.id })
  res.status(204).end()
}))

export default r
