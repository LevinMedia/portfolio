import { cookies } from 'next/headers'
import crypto from 'crypto'

/**
 * Auth cookie for private-access (selected works) and admin.
 * If the cookie is blocked (e.g. strict tracking protection), APIs that use it
 * fall back to public-only data — no errors, graceful degradation.
 */
const AUTH_COOKIE = 'auth'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface AuthPayload {
  sub: string
  email: string
  access_role: string
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET must be set and at least 16 characters')
  }
  return secret
}

function sign(payload: AuthPayload): string {
  const secret = getSecret()
  const payloadStr = JSON.stringify(payload)
  const sig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex')
  const combined = JSON.stringify({ p: payloadStr, s: sig })
  return Buffer.from(combined, 'utf8').toString('base64url')
}

function verify(token: string): AuthPayload | null {
  try {
    const secret = getSecret()
    const combined = Buffer.from(token, 'base64url').toString('utf8')
    const { p: payloadStr, s: sig } = JSON.parse(combined)
    const expected = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex')
    const expectedBuf = Buffer.from(expected, 'hex')
    const sigBuf = Buffer.from(sig, 'hex')
    if (expectedBuf.length !== sigBuf.length) {
      crypto.timingSafeEqual(expectedBuf, expectedBuf) // dummy: constant-time to avoid leaking length
      return null
    }
    if (!crypto.timingSafeEqual(expectedBuf, sigBuf)) return null
    return JSON.parse(payloadStr) as AuthPayload
  } catch {
    return null
  }
}

export function createAuthCookie(payload: AuthPayload): string {
  const value = sign(payload)
  const isProd = process.env.NODE_ENV === 'production'
  return `${AUTH_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${isProd ? '; Secure' : ''}`
}

export function getAuthCookiePayload(): Promise<AuthPayload | null> {
  return (async () => {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE)?.value
    if (!token) return null
    return verify(token)
  })()
}

export function hasPrivateAccess(accessRole: string): boolean {
  return accessRole === 'admin' || accessRole === 'private'
}

export function clearAuthCookie(): string {
  return `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}
