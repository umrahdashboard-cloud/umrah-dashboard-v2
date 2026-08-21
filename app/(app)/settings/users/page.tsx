import { requireRole } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { UsersClient } from './users-client'

export default async function UsersPage() {
  const session = await requireRole('admin')
  const users = store.users.map(({ password_hash: _ph, ...u }) => u)
  return <UsersClient users={users} currentUserId={session.userId} />
}
