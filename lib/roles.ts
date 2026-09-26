// ── Client-safe role helpers (no server-only imports) ──────────────────
import type { Role } from './types'

/** Legacy sessions/users may still have `manager` — treat as moderator. */
export function normalizeRole(role: Role): Role {
  return role === 'manager' ? 'moderator' : role
}

export const canWrite = (role: Role) => {
  const r = normalizeRole(role)
  return r === 'admin' || r === 'moderator'
}

export const isAdmin = (role: Role) => role === 'admin'

export const isManager = (role: Role) => {
  const r = normalizeRole(role)
  return r === 'admin' || r === 'moderator'
}

export const isAgent = (role: Role) => {
  const r = normalizeRole(role)
  return r === 'admin' || r === 'moderator' || role === 'agent'
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  moderator: 'Moderator',
  manager: 'Moderator',
  agent: 'Agent',
  viewer: 'Viewer',
}

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role
}

export const permissions = {
  admin: {
    read: true,
    write: true,
    delete: true,
    manage_users: true,
    view_reports: true,
    manage_payments: true,
    manage_settings: true,
    view_activity_log: true,
  },
  moderator: {
    read: true,
    write: true,
    delete: true,
    manage_users: false,
    view_reports: true,
    manage_payments: true,
    manage_settings: false,
    view_activity_log: true,
  },
  manager: {
    read: true,
    write: true,
    delete: true,
    manage_users: false,
    view_reports: true,
    manage_payments: true,
    manage_settings: false,
    view_activity_log: true,
  },
  agent: {
    read: true,
    write: true,
    delete: false,
    manage_users: false,
    view_reports: false,
    manage_payments: false,
    manage_settings: false,
    view_activity_log: false,
  },
  viewer: {
    read: true,
    write: false,
    delete: false,
    manage_users: false,
    view_reports: true,
    manage_payments: false,
    manage_settings: false,
    view_activity_log: false,
  },
} as const

export const hasPermission = (role: Role, action: keyof typeof permissions.admin): boolean => {
  return permissions[normalizeRole(role)][action]
}
