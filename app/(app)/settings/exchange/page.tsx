import { requireRole } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { ExchangeClient } from './exchange-client'

export default async function ExchangePage() {
  await requireRole('admin')
  return <ExchangeClient rate={store.exchangeRate} />
}
