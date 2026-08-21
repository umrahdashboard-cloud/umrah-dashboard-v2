import { requireRole } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { AirlinesClient } from './airlines-client'

export default async function AirlinesPage() {
  await requireRole('admin')
  return <AirlinesClient airlines={store.airlines} />
}
