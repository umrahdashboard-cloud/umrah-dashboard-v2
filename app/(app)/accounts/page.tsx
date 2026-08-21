import { requireSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { store } from '@/lib/demo-store'
import { mergeBookings, mergePayments } from '@/lib/bookings-persistence'
import { AccountsClient } from './accounts-client'

export default async function AccountsPage() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: paymentsData } = await supabase
    .from('payments')
    .select('*')
    .order('payment_date', { ascending: false })

  const { data: bookingsData } = await supabase
    .from('bookings')
    .select('*')
    .order('customer_name', { ascending: true })

  const payments = mergePayments(paymentsData ?? [])
  const bookings = mergeBookings(bookingsData ?? [])
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
