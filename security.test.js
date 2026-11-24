import test from 'node:test'
import assert from 'node:assert/strict'
import { assertConfig } from '../src/config.js'
import { hashKey, verifyKey, signToken, verifyToken, clean, generateKey, throttle } from '../src/security.js'

assertConfig()

test('login keys: hashed with scrypt, ID is part of the secret, case/space tolerant', async () => {
  const h = await hashKey('ms-adm-001', ' ms-super-2026 ')
  assert.ok(h.startsWith('scrypt$'))
  assert.ok(await verifyKey('MS-ADM-001', 'MS-SUPER-2026', h))
  assert.ok(!(await verifyKey('MS-ADM-001', 'WRONG', h)))
  assert.ok(!(await verifyKey('MS-ADM-002', 'MS-SUPER-2026', h)))
  assert.ok(!(await verifyKey('x', 'y', 'garbage')))
  assert.match(generateKey(), /^MS-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
})

test('session tokens: signed, tamper-proof, expiring', () => {
  const { token } = signToken({ sub: 'A' })
  assert.equal(verifyToken(token).sub, 'A')
  const [a, b, c] = token.split('.')
  assert.equal(verifyToken(`${a}.${Buffer.from('{"sub":"EVIL","exp":9999999999}').toString('base64url')}.${c}`), null)
  assert.equal(verifyToken(`${a}.${b}.x${c.slice(1)}`), null)
  assert.equal(verifyToken(signToken({ sub: 'A' }, -1000).token), null)
  assert.equal(verifyToken('nope'), null)
})

test('input hygiene: operators and dotted keys are rejected', () => {
  assert.throws(() => clean({ a: { $ne: 1 } }))
  assert.throws(() => clean({ 'a.b': 1 }))
  assert.throws(() => clean(JSON.parse('{"__proto__":{"x":1}}')))
  assert.deepEqual(clean({ a: [{ b: 1 }] }), { a: [{ b: 1 }] })
})

test('login throttle locks after 5 failures', () => {
  const k = 'test|ID'
  for (let i = 0; i < 4; i++) { throttle.fail(k); assert.ok(!throttle.blocked(k)) }
  throttle.fail(k); assert.ok(throttle.blocked(k))
  throttle.ok(k); assert.ok(!throttle.blocked(k))
})
