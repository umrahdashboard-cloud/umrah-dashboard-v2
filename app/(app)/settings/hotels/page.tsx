import { requireRole } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { HotelsClient } from './hotels-client'

export default async function HotelsPage() {
  await requireRole('admin')
  return <HotelsClient hotels={store.hotels} />
}
