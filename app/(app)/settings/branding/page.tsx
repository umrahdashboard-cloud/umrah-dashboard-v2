import { requireRole } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { BrandingClient } from './branding-client'

export default async function BrandingPage() {
  await requireRole('admin')
  return <BrandingClient branding={store.branding} />
}
