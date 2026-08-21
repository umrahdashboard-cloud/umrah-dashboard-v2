import 'server-only'
import { createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { store, hashPassword } from './demo-store'
import type { Role, User } from './types'

// ASSUMPTION: demo mode uses a static signing secret; in production this
// must come from an environment variable (SESSION_SECRET).
const SECRET = process.env.SESSION_SECRET ?? 'ft-demo-session-secret'
export const SESSION_COOKIE = 'ft_session'

export interface Session {
  userId: string
  role: Role
  displayName: string
}

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url')
}

export function encodeSession(s: Session): string {
  const payload = Buffer.from(JSON.stringify(s)).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig || sign(payload) !== sig) return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies()
  return decodeSession(jar.get(SESSION_COOKIE)?.value)
}

export async function requireSession(): Promise<Session> {
  const s = await getSession()
  if (!s) throw new Error('Unauthorized')
  return s
}

export async function requireRole(...roles: Role[]): Promise<Session> {
  const s = await requireSession()
  if (!roles.includes(s.role)) throw new Error('Forbidden')
  return s
}

export function verifyCredentials(username: string, password: string): User | null {
  const user = store.users.find(
    (u) => u.username === username && u.account_status === 'active',
  )
  if (!user) return null
  return user.password_hash === hashPassword(password) ? user : null
}

export { canWrite, isAdmin } from './roles'
