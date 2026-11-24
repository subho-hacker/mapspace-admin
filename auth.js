import { col } from './db.js'
import { verifyToken, BadInput } from './security.js'

export class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code }
}
export const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
export const ROLES = ['Super Admin', 'Admin', 'Manager']

// Every request after sign-in is checked against the database, so suspending or removing an admin
// (or changing their role) takes effect on their very next request, not when their token expires.
export const requireAuth = wrap(async (req, _res, next) => {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '')
  const claims = m && verifyToken(m[1])
  if (!claims) throw new HttpError(401, 'Please sign in again.', 'AUTH')
  if (claims.g) { req.admin = { id: claims.sub, name: claims.name, role: 'Admin', email: claims.email, picture: claims.picture, exp: claims.exp * 1000, google: true }; return next() }
  const a = await col('admins').findOne({ id: claims.sub })
  if (!a || a.off) throw new HttpError(401, 'Your access was suspended or removed by a Super Admin.', 'REVOKED')
  req.admin = { id: a.id, name: a.name, role: a.role, exp: claims.exp * 1000 }
  next()
})

export const requireSuper = (req, _res, next) =>
  req.admin?.role === 'Super Admin' && !req.admin.google ? next() : next(new HttpError(403, 'Only an active Super Admin can do this.', 'FORBIDDEN'))

export const body = req => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new BadInput('Send a JSON object.')
  return req.body
}
