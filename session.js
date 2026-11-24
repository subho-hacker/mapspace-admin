import { Router } from 'express'
import { col } from '../db.js'
import { config } from '../config.js'
import { verifyKey, DUMMY_HASH, signToken, throttle } from '../security.js'
import { wrap, HttpError, requireAuth, body } from '../auth.js'

const r = Router()
const SUSPENDED = 'This admin account is suspended. Ask a Super Admin to reactivate it.'

const session = (user, claims) => {
  const { token, exp } = signToken(claims)
  return { token, user: { ...user, exp } }
}

// Admin ID + private login key
r.post('/login', wrap(async (req, res) => {
  const { id, key } = body(req)
  const adminId = String(id ?? '').trim().toUpperCase().slice(0, 40)
  if (!adminId || !String(key ?? '').trim()) throw new HttpError(400, 'Enter your admin ID and login key.')
  const k = `${req.ip}|${adminId}`
  if (throttle.blocked(k)) throw new HttpError(429, 'Too many attempts. Wait 30 seconds and try again.', 'THROTTLED')
  const a = await col('admins').findOne({ id: adminId })
  const ok = await verifyKey(adminId, key, a?.hash || DUMMY_HASH)   // same work whether or not the ID exists
  if (!a || !ok) { throttle.fail(k); throw new HttpError(401, 'Admin ID or login key is incorrect.', 'BAD_LOGIN') }
  if (a.off) throw new HttpError(403, SUSPENDED, 'SUSPENDED')
  throttle.ok(k)
  await col('logins').insertOne({ id: a.id, name: a.name, time: new Date().toISOString(), at: new Date() })
  res.json(session({ id: a.id, name: a.name, role: a.role }, { sub: a.id }))
}))

// Google Sign-In: the ID token is verified here (signature, audience, expiry) and swapped for our own session.
r.post('/google', wrap(async (req, res) => {
  if (!config.googleClientId) throw new HttpError(501, 'Google sign-in is not configured on the server.')
  const { credential } = body(req)
  if (typeof credential !== 'string' || credential.length > 4096) throw new HttpError(400, 'Missing Google credential.')
  let p
  try {
    const { OAuth2Client } = await import('google-auth-library')
    const ticket = await new OAuth2Client(config.googleClientId).verifyIdToken({ idToken: credential, audience: config.googleClientId })
    p = ticket.getPayload()
  } catch { throw new HttpError(401, 'Google sign-in failed. Please try again.') }
  if (!p?.email || !p.email_verified) throw new HttpError(401, 'Your Google email is not verified.')
  const email = p.email.toLowerCase()
  if (!config.adminEmails.includes(email)) throw new HttpError(403, `${p.email} is not on the admin list.`)
  const id = 'GL-' + String(p.sub).slice(-6), name = p.name || p.email
  await col('logins').insertOne({ id, name, time: new Date().toISOString(), at: new Date() })
  res.json(session({ id, name, email: p.email, picture: p.picture, role: 'Admin' }, { sub: id, name, email: p.email, picture: p.picture, g: 1 }))
}))

// Who am I right now? The app polls this so suspensions and role changes show up within seconds.
r.get('/me', requireAuth, (req, res) => res.json(req.admin))

export default r
