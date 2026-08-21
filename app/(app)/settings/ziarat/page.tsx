import { requireRole } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { ZiaratClient } from './ziarat-client'

export default async function ZiaratPage() {
  await requireRole('admin')
  return <ZiaratClient ziarats={[...store.ziarats].sort((a, b) => a.sort_order - b.sort_order)} />
}
