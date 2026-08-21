import { requireSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { store } from '@/lib/demo-store'
import { mergeBookings, mergePayments } from '@/lib/bookings-persistence'
import { sumActivePayments } from '@/lib/payment-utils'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: bookingsData } = await supabase.from('bookings').select('*')
  const { data: paymentsData } = await supabase.from('payments').select('*')

  const bookings = mergeBookings(bookingsData ?? [])
  const payments = mergePayments(paymentsData ?? [])

  const totalRevenue = bookings.reduce((s, b) => s + b.total_pkr, 0) +
    store.invoices.reduce((s, v) => s + v.total_pkr, 0)
  const totalProfit = bookings.reduce((s, b) => s + b.profit_pkr, 0)
  const outstanding = bookings.reduce((s, b) => s + b.remaining_pkr, 0)
  const totalExpenses = store.expenses.reduce((s, e) => s + e.amount_pkr, 0)
  const received = sumActivePayments(payments)

  // Build last-6-months in/out series from payments + expenses
  const months: { key: string; label: string; in_pkr: number; out_pkr: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = d.toISOString().slice(0, 7)
    months.push({ key, label: d.toLocaleString('en-US', { month: 'short' }), in_pkr: 0, out_pkr: 0 })
  }
  for (const p of payments) {
    if (p.voided) continue
    const m = months.find((x) => p.payment_date.startsWith(x.key))
    if (m) m.in_pkr += p.amount_pkr
  }
  for (const e of store.expenses) {
    const m = months.find((x) => e.expense_date.startsWith(x.key))
    if (m) m.out_pkr += e.amount_pkr
  }

  const expenseByType = store.expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.expense_type] = (acc[e.expense_type] ?? 0) + e.amount_pkr
    return acc
  }, {})

  const recent = [...bookings]
    .sort((a, b) => b.booking_date.localeCompare(a.booking_date))
    .slice(0, 5)

  return (
    <DashboardClient
      displayName={session.displayName}
      role={session.role}
      kpis={{
        totalRevenue, totalProfit, outstanding, totalExpenses, received,
        bookingCount: bookings.length,
        pdfBytesUsed: store.pdfBytesUsed,
        exchangeRate: store.exchangeRate,
      }}
      cashflow={months.map(({ label, in_pkr, out_pkr }) => ({ month: label, in_pkr, out_pkr }))}
      expenseByType={Object.entries(expenseByType).map(([type, amount]) => ({ type, amount }))}
      recentBookings={recent}
    />
  )
}
