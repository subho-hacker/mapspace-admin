import { Router } from 'express'
import { col, PUBLIC } from '../db.js'
import { wrap } from '../auth.js'
import { escapeRegex } from '../security.js'

const r = Router()
// [collection, label, page, headline field, searched fields, sub-line builder]
const SEARCH = [
  ['drivers', 'Driver', '/drivers', 'name', ['id', 'name', 'phone', 'vehicle', 'route', 'status']],
  ['shipments', 'Shipment', '/shipments', 'id', ['id', 'customer', 'origin', 'destination', 'vehicle', 'driver', 'category', 'product', 'status']],
  ['customers', 'Customer', '/customers', 'name', ['id', 'name', 'phone', 'city', 'type', 'status']],
  ['deliveries', 'Delivery', '/deliveries', 'id', ['id', 'shipment', 'driver', 'vehicle', 'status']],
  ['transactions', 'Transaction', '/finance', 'id', ['id', 'type', 'party', 'description', 'status']],
  ['notifications', 'Notification', '/notifications', 'title', ['id', 'title', 'body', 'level']],
  ['vehicles', 'Vehicle', '/fleet', 'id', ['id', 'reg', 'driver', 'location', 'route', 'type', 'status'], v => `${v.driver} · ${v.status}`]
]

r.get('/', wrap(async (req, res) => {
  const q = String(req.query.q ?? '').trim().slice(0, 100)
  if (!q) return res.json([])
  const rx = { $regex: escapeRegex(q), $options: 'i' }
  const groups = await Promise.all(SEARCH.map(async ([name, type, to, key, fields, sub]) => {
    const rows = await col(name).find({ $or: fields.map(f => ({ [f]: rx })) }, PUBLIC).sort({ _ord: -1 }).limit(3).toArray()
    return rows.map(x => ({ type, label: x[key], sub: sub ? sub(x) : `${x.id}${x.status ? ' · ' + x.status : ''}`, to, term: x[key] }))
  }))
  res.json(groups.flat().slice(0, 10))
}))

export default r
