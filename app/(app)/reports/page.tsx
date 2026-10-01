import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { fetchMergedBookingsAndPayments } from '@/lib/bookings-persistence'
import { hasPermission } from '@/lib/roles'
import { ReportsClient } from './reports-client'

export default async function ReportsPage() {
  const session = await requireSession()
  if (!hasPermission(session.role, 'view_reports')) {
    redirect('/dashboard')
  }

  const { bookings, payments } = await fetchMergedBookingsAndPayments()

  return (
    <ReportsClient
      role={session.role}
      bookings={bookings}
      payments={payments}
      invoices={store.invoices}
      expenses={store.expenses}
      vouchers={store.vouchers}
      exchangeRate={store.exchangeRate}
    />
  )
}
