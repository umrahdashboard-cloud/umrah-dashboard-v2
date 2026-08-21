import { requireRole } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { TransportClient } from './transport-client'

export default async function TransportPage() {
  await requireRole('admin')
  return (
    <TransportClient
      vehicles={[...store.vehicles].sort((a, b) => a.sort_order - b.sort_order)}
      routes={[...store.routes].sort((a, b) => a.sort_order - b.sort_order)}
      matrix={store.rateMatrix}
    />
  )
}
