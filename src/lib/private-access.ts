import crypto from 'crypto'

/** Internal username/email for password-only private access accounts. */
export function makePrivateAccessIdentity(label: string): { username: string; email: string } {
  const id = crypto.randomUUID()
  const slug =
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'access'
  const username = `access-${slug}-${id.slice(0, 8)}`
  return {
    username,
    email: `${username}@private.local`,
  }
}

export function displayPrivateAccessLabel(user: {
  label?: string | null
  email?: string | null
  username?: string | null
}): string {
  const label = user.label?.trim()
  if (label) return label
  const email = user.email?.trim()
  if (email && !email.endsWith('@private.local')) return email
  return user.username?.trim() || 'Password access'
}
