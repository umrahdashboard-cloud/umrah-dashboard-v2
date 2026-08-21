import { requireSession } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { InvoicesClient } from './invoices-client'

export default async function InvoicesPage() {
  const session = await requireSession()
  const invoices = [...store.invoices].sort((a, b) => b.invoice_number - a.invoice_number)
  return (
    <InvoicesClient
      role={session.role}
      invoices={invoices}
      bookings={store.bookings}
      exchangeRate={store.exchangeRate}
      branding={store.branding}
    />
  )
}
