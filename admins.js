import { Router } from 'express'
import crypto from 'node:crypto'
import { col } from '../db.js'
import { hashKey, verifyKey, generateKey, throttle } from '../security.js'
import { wrap, HttpError, requireSuper, ROLES, body } from '../auth.js'

const r = Router()
r.use(['/admins', '/logins', '/permits'], requireSuper)   // everything here is Super Admin only

const strip = ({ _id, hash, ...x }) => x
const SUPER = 'Super Admin'
const PERMIT_MS = 30 * 60 * 1000
const permitErr = () => new HttpError(403, 'A permit is required to suspend or remove another Super Admin.', 'PERMIT')
const norm = s => String(s ?? '').trim().toUpperCase().slice(0, 40)
const find = id => col('admins').findOne({ id })
const activeSupers = () => col('admins').find({ role: SUPER, off: false }).toArray()
async function target(id) { const t = await find(norm(id)); if (!t) throw new HttpError(404, 'Admin not found.'); return t }

// ---- Admins ----------------------------------------------------------------------------------
r.get('/admins', wrap(async (_req, res) => {
  const rows = await col('admins').find({}).sort({ id: 1 }).toArray()
  res.json(rows.map(strip))
}))

r.post('/admins', wrap(async (req, res) => {
  const { name, role } = body(req), nm = String(name ?? '').trim()
  if (nm.length < 2 || nm.length > 80) throw new HttpError(400, 'Enter the admin name.')
  if (!ROLES.includes(role)) throw new HttpError(400, 'Unknown role.')
  const { seq } = await col('counters').findOneAndUpdate({ _id: 'admin' }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' })
  const id = 'MS-ADM-' + String(seq).padStart(3, '0'), key = generateKey()
  await col('admins').insertOne({ id, name: nm, role, hash: await hashKey(id, key), created: new Date().toISOString(), off: false })
  res.status(201).json({ id, key })   // the key is shown once and never stored in plain text
}))

r.post('/admins/:id/reset-key', wrap(async (req, res) => {
  const t = await target(req.params.id)
  if (t.role === SUPER && t.id !== req.admin.id) throw new HttpError(403, 'A Super Admin can only reset their own key. Ask them to do it after signing in.')
  const key = generateKey()
  await col('admins').updateOne({ id: t.id }, { $set: { hash: await hashKey(t.id, key) } })
  res.json({ id: t.id, key })
}))

r.put('/admins/:id/off', wrap(async (req, res) => {
  const { off } = body(req)
  if (typeof off !== 'boolean') throw new HttpError(400, 'Send { "off": true | false }.')
  const t = await target(req.params.id)
  if (t.id === req.admin.id) throw new HttpError(403, 'You cannot change your own access.')
  if (t.role === SUPER && off) throw permitErr()
  await col('admins').updateOne({ id: t.id }, { $set: { off } })
  res.status(204).end()
}))

r.delete('/admins/:id', wrap(async (req, res) => {
  const t = await target(req.params.id)
  if (t.id === req.admin.id) throw new HttpError(403, 'You cannot remove yourself.')
  if (t.role === SUPER) throw permitErr()
  await col('admins').deleteOne({ id: t.id })
  res.status(204).end()
}))

r.get('/logins', wrap(async (_req, res) => {
  const rows = await col('logins').find({}).sort({ at: -1 }).limit(20).toArray()
  res.json(rows.map(({ id, name, time }) => ({ id, name, time })))
}))

// ---- Permits: needed to suspend or remove ANOTHER Super Admin ------------------------------------
const expirePermits = () => col('permits').updateMany({ status: 'Pending', expires: { $lte: Date.now() } }, { $set: { status: 'Expired' } })
const openPermit = async id => { await expirePermits(); const p = await col('permits').findOne({ id: String(id) }); if (!p || p.status !== 'Pending') throw new HttpError(409, 'This permit request is no longer open.'); return p }

r.get('/permits', wrap(async (_req, res) => {
  await expirePermits()
  res.json((await col('permits').find({}).sort({ createdAt: -1 }).limit(50).toArray()).map(strip))
}))

r.post('/permits', wrap(async (req, res) => {
  const { action, target: tid } = body(req), me = req.admin, t = await find(norm(tid))
  if (!['suspend', 'remove'].includes(action) || !t || t.role !== SUPER || t.id === me.id) throw new HttpError(400, 'A permit is only needed to act on another Super Admin.')
  await expirePermits()
  if (await col('permits').findOne({ status: 'Pending', action, target: t.id })) throw new HttpError(409, 'A permit request for this is already waiting.')
  const eligible = (await activeSupers()).filter(x => x.id !== me.id && x.id !== t.id).length
  const now = Date.now()
  const p = { id: 'PR-' + now.toString(36) + crypto.randomBytes(2).toString('hex'), action, target: t.id, targetName: t.name, by: me.id, byName: me.name, createdAt: now, expires: now + PERMIT_MS, status: 'Pending', mode: eligible ? 'approval' : 'self' }
  await col('permits').insertOne({ ...p })
  res.status(201).json(p)
}))

r.post('/permits/:id/cancel', wrap(async (req, res) => {
  const p = await openPermit(req.params.id)
  if (p.by !== req.admin.id) throw new HttpError(403, 'Only the requester can cancel an open request.')
  await col('permits').updateOne({ id: p.id, status: 'Pending' }, { $set: { status: 'Cancelled' } })
  res.status(204).end()
}))

r.post('/permits/:id/decide', wrap(async (req, res) => {
  const { approve, key } = body(req), me = req.admin
  if (typeof approve !== 'boolean') throw new HttpError(400, 'Send { "approve": true | false }.')
  const p = await openPermit(req.params.id)
  if (me.id === p.target) throw new HttpError(403, 'The admin being affected cannot decide this permit.')
  if (p.mode === 'approval' && me.id === p.by) throw new HttpError(403, 'Another Super Admin must approve your request.')
  if (p.mode === 'self' && me.id !== p.by) throw new HttpError(403, 'Only the requester can authorise this request.')
  let t = null
  if (approve) {
    const tk = `permit|${me.id}`
    if (throttle.blocked(tk)) throw new HttpError(429, 'Too many attempts. Wait 30 seconds and try again.', 'THROTTLED')
    const mine = await find(me.id)
    if (!mine || !(await verifyKey(me.id, key, mine.hash))) { throttle.fail(tk); throw new HttpError(401, 'Your login key is incorrect.', 'BAD_KEY') }
    throttle.ok(tk)
    t = await find(p.target)
    if (t && !t.off && (await activeSupers()).filter(x => x.id !== t.id).length < 1) throw new HttpError(409, 'Keep at least one active Super Admin.')
  }
  // Claim the permit atomically so two simultaneous approvals can never both apply the action.
  const claimed = await col('permits').findOneAndUpdate({ id: p.id, status: 'Pending' },
    { $set: { status: approve ? 'Approved' : 'Rejected', decidedBy: me.id, decidedByName: me.name, decidedAt: Date.now() } }, { returnDocument: 'after' })
  if (!claimed) throw new HttpError(409, 'This permit request is no longer open.')
  if (approve && t) {
    if (p.action === 'suspend') await col('admins').updateOne({ id: t.id }, { $set: { off: true } })
    else await col('admins').deleteOne({ id: t.id })
  }
  res.status(204).end()
}))

export default r
