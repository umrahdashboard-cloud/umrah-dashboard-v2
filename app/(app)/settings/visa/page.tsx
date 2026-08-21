import { requireRole } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { VisaClient } from './visa-client'

export default async function VisaPage() {
  await requireRole('admin')
  return <VisaClient visa={store.visa} />
}
