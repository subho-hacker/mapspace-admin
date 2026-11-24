import crypto from 'node:crypto'
import { config } from './config.js'

// ---- Login keys: scrypt with a per-key random salt, compared in constant time ------------------
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
const scrypt = (pw, salt) => new Promise((res, rej) => crypto.scrypt(pw, salt, 32, SCRYPT, (e, k) => (e ? rej(e) : res(k))))
// Keys are always hashed as "ID:KEY", upper-cased and trimmed, so the ID is part of the secret input.
export const keyInput = (id, key) => `${String(id).trim().toUpperCase()}:${String(key ?? '').trim().toUpperCase()}`

export async function hashKey(id, key) {
  const salt = crypto.randomBytes(16)
  const dk = await scrypt(keyInput(id, key), salt)
  return `scrypt$${salt.toString('hex')}$${dk.toString('hex')}`
}

export async function verifyKey(id, key, stored) {
  try {
    const [alg, saltHex, hashHex] = String(stored || '').split('$')
    if (alg !== 'scrypt' || !saltHex || !hashHex) return false
    const expected = Buffer.from(hashHex, 'hex')
    const dk = await scrypt(keyInput(id, key), Buffer.from(saltHex, 'hex'))
    return dk.length === expected.length && crypto.timingSafeEqual(dk, expected)
  } catch { return false }
}

// A fixed fake hash so unknown IDs cost the same time as wrong keys (no user enumeration by timing).
export const DUMMY_HASH = `scrypt$${'00'.repeat(16)}$${'00'.repeat(32)}`

const KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateKey() {
  const pick = () => Array.from({ length: 4 }, () => KEY_CHARS[crypto.randomInt(KEY_CHARS.length)]).join('')
  return `MS-${pick()}-${pick()}-${pick()}`
}

// ---- Minimal HS256 JWT (no dependency) ---------------------------------------------------------
const b64u = b => Buffer.from(b).toString('base64url')
const sign = data => crypto.createHmac('sha256', config.jwtSecret).update(data).digest('base64url')

export function signToken(claims, ttlMs = config.sessionMs) {
  const exp = Math.floor((Date.now() + ttlMs) / 1000)
  const body = `${b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64u(JSON.stringify({ ...claims, iat: Math.floor(Date.now() / 1000), exp }))}`
  return { token: `${body}.${sign(body)}`, exp: exp * 1000 }
}

export function verifyToken(token) {
  const parts = String(token || '').split('.')
  if (parts.length !== 3) return null
  const [h, p, s] = parts
  const want = Buffer.from(sign(`${h}.${p}`)), got = Buffer.from(s)
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null
  try {
    if (JSON.parse(Buffer.from(h, 'base64url').toString()).alg !== 'HS256') return null
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString())
    return claims.exp * 1000 > Date.now() ? claims : null
  } catch { return null }
}

// ---- Login throttling: 5 wrong attempts per IP+ID locks that pair for 30 seconds -----------------
const fails = new Map()
export const throttle = {
  blocked(k) { const f = fails.get(k); return !!f && f.until > Date.now() },
  fail(k) {
    const f = fails.get(k) || { n: 0, until: 0 }
    if (f.until && f.until <= Date.now()) { f.n = 0; f.until = 0 }
    f.n++; if (f.n >= 5) f.until = Date.now() + 30_000
    fails.set(k, f)
    if (fails.size > 5000) for (const [x, v] of fails) if (v.until < Date.now() && v.n < 5) fails.delete(x)
  },
  ok(k) { fails.delete(k) }
}

// ---- Input hygiene ------------------------------------------------------------------------------
// Rejects Mongo operator injection ("$ne", "$where") and dotted paths anywhere in a request body.
export class BadInput extends Error { constructor(m) { super(m); this.status = 400 } }
export function clean(v, depth = 0) {
  if (depth > 8) throw new BadInput('Data is nested too deeply.')
  if (Array.isArray(v)) return v.map(x => clean(x, depth + 1))
  if (v && typeof v === 'object') {
    const out = {}
    for (const [k, x] of Object.entries(v)) {
      if (k.startsWith('$') || k.includes('.') || k === '__proto__' || k === 'constructor') throw new BadInput(`Field name "${k}" is not allowed.`)
      out[k] = clean(x, depth + 1)
    }
    return out
  }
  return v
}
export const isPlain = v => !!v && typeof v === 'object' && !Array.isArray(v)
export const escapeRegex = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
