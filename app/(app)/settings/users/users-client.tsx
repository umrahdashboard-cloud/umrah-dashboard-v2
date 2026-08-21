'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { upsertUser, deleteUser } from '@/lib/actions'
import type { Role, User } from '@/lib/types'
import { GlassButton, GlassCard, GlassInput, GlassSelect, Field, PageHeader } from '@/components/glass'
import { SlideOver } from '@/components/overlay'
import { useToast } from '@/components/toast'

type SafeUser = Omit<User, 'password_hash'>

const EMPTY: SafeUser = {
  id: '', display_name: '', username: '', email: null,
  role: 'viewer', permission_level: 10, account_status: 'active',
}

const LEVEL: Record<Role, number> = { admin: 100, moderator: 50, manager: 50, agent: 25, viewer: 10 }

export function UsersClient({ users, currentUserId }: { users: SafeUser[]; currentUserId: string }) {
  const [editing, setEditing] = useState<SafeUser | null>(null)
  const toast = useToast()

  async function save(formData: FormData) {
    const role = formData.get('role') as Role
    await upsertUser({
      id: editing?.id ?? '',
      display_name: String(formData.get('display_name')),
      username: String(formData.get('username')),
      email: String(formData.get('email')) || null,
      role,
      permission_level: LEVEL[role],
      account_status: formData.get('account_status') as 'active' | 'inactive',
      password: String(formData.get('password')) || undefined,
    })
    toast('User saved')
    setEditing(null)
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="User Management"
        subtitle="Admin, Moderator and Viewer accounts"
        actions={
          <GlassButton onClick={() => setEditing(EMPTY)}>
            <Plus className="h-4 w-4" aria-hidden /> Add User
          </GlassButton>
        }
      />
      <GlassCard className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={i % 2 === 1 ? 'bg-white/2' : ''}>
                <td className="px-4 py-3">
                  <p className="font-medium">{u.display_name}</p>
                  <p className="text-xs text-muted-foreground">{u.email ?? '—'}</p>
                </td>
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${u.account_status === 'active' ? 'text-success' : 'text-muted-foreground'}`}>
                    {u.account_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(u)} aria-label={`Edit ${u.display_name}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/6 hover:text-foreground cursor-pointer">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {u.id !== currentUserId && (
                      <button
                        onClick={async () => { await deleteUser(u.id); toast('User deleted') }}
                        aria-label={`Delete ${u.display_name}`}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/15 hover:text-danger cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <SlideOver open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit User' : 'Add User'}>
        {editing && (
          <form action={save} className="flex flex-col gap-4">
            <Field label="Display name"><GlassInput name="display_name" defaultValue={editing.display_name} required /></Field>
            <Field label="Username"><GlassInput name="username" defaultValue={editing.username} required autoComplete="off" /></Field>
            <Field label="Email (optional)"><GlassInput name="email" type="email" defaultValue={editing.email ?? ''} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <GlassSelect name="role" defaultValue={editing.role}>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="viewer">Viewer</option>
                </GlassSelect>
              </Field>
              <Field label="Status">
                <GlassSelect name="account_status" defaultValue={editing.account_status}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </GlassSelect>
              </Field>
            </div>
            <Field label={editing.id ? 'New password (leave blank to keep)' : 'Password'}>
              <GlassInput name="password" type="password" autoComplete="new-password" required={!editing.id} />
            </Field>
            <GlassButton type="submit" className="mt-2">Save User</GlassButton>
          </form>
        )}
      </SlideOver>
    </div>
  )
}
