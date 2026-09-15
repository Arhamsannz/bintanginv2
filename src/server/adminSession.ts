import { createHmac, timingSafeEqual } from 'node:crypto'

// Server-only helpers for a stateless admin session: no `admin_sessions`
// table, no extra dependency. The cookie just carries an expiry timestamp
// plus an HMAC signature (keyed on ADMIN_PASSWORD) so it can't be forged or
// extended by anyone who doesn't know the password. Never import this file
// from a client component — `node:crypto` will crash the browser bundle.

export const ADMIN_SESSION_COOKIE = 'bintangin_admin_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 hari

function getAdminPassword(): string {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) {
    throw new Error(
      'ADMIN_PASSWORD belum diatur di environment variables. Tambahkan di pengaturan environment variable host kamu (Netlify/Render/dll) lalu deploy ulang.',
    )
  }
  return secret
}

function sign(payload: string): string {
  return createHmac('sha256', getAdminPassword()).update(payload).digest('hex')
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function checkAdminPassword(candidate: string): boolean {
  return timingSafeStringEqual(candidate, getAdminPassword())
}

export function createAdminSessionCookieValue(): string {
  const expiresAt = String(Date.now() + SESSION_TTL_MS)
  return `${expiresAt}.${sign(expiresAt)}`
}

export function isValidAdminSessionCookie(value: string | undefined | null): boolean {
  if (!value) return false
  const [expiresAt, signature] = value.split('.')
  if (!expiresAt || !signature) return false
  if (!Number.isFinite(Number(expiresAt)) || Number(expiresAt) < Date.now()) return false
  return timingSafeStringEqual(signature, sign(expiresAt))
}
