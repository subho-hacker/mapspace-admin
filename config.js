import 'dotenv/config'

const list = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean)
const isProd = process.env.NODE_ENV === 'production'

export const config = {
  isProd,
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
  dbName: process.env.MONGODB_DB || 'mapspace',
  corsOrigins: list(process.env.CORS_ORIGIN),
  jwtSecret: process.env.JWT_SECRET || '',
  sessionMs: (Number(process.env.SESSION_HOURS) || 8) * 3600 * 1000,
  seedAdmin: {
    id: (process.env.SEED_ADMIN_ID || 'MS-ADM-001').toUpperCase(),
    name: process.env.SEED_ADMIN_NAME || 'Super Admin',
    key: process.env.SEED_ADMIN_KEY || 'MS-SUPER-2026'
  },
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  adminEmails: list(process.env.ADMIN_EMAILS).map(s => s.toLowerCase())
}

// Fail fast instead of running with a guessable signing secret.
export function assertConfig() {
  const weak = !config.jwtSecret || config.jwtSecret.length < 32 || config.jwtSecret.startsWith('change-me')
  if (weak && isProd) throw new Error('JWT_SECRET must be a random string of at least 32 characters in production.')
  if (weak) console.warn('[warn] JWT_SECRET is weak or missing. Fine for local development only.')
  if (isProd && config.seedAdmin.key === 'MS-SUPER-2026') console.warn('[warn] SEED_ADMIN_KEY is still the public default. Change it, or issue a new key after first login.')
  if (!config.jwtSecret) config.jwtSecret = 'dev-only-' + 'x'.repeat(40)
}
