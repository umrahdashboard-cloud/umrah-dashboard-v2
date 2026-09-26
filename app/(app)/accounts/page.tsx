import { requireSession } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { fetchMergedBookingsAndPayments } from '@/lib/bookings-persistence'
import { AccountsClient } from './accounts-client'

export default async function AccountsPage() {
  const session = await requireSession()
  const { bookings: mergedBookings, payments: mergedPayments } = await fetchMergedBookingsAndPayments()
  const payments = [...mergedPayments].sort((a, b) => b.payment_date.localeCompare(a.payment_date))
  const bookings = [...mergedBookings].sort((a, b) => a.customer_name.localeCompare(b.customer_name))
  const expenses = [...store.expenses].sort((a, b) => b.expense_date.localeCompare(a.expense_date))

  return (
    <AccountsClient
      role={session.role}
      payments={payments}
      bookings={bookings}
      expenses={expenses}
    />
  )
}
