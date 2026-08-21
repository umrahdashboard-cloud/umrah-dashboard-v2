import { requireSession } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { getInvoiceCalcState } from '@/lib/invoice-calc'
import type { CalculatorState } from '@/lib/types'
import { CalculatorClient } from './calculator-client'

export default async function CalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string; invoice?: string }>
}) {
  const session = await requireSession()
  const { booking: bookingId, invoice: invoiceId } = await searchParams

  let initial: CalculatorState | null = null
  let editBookingId: string | null = null
  let editInvoiceId: string | null = null

  if (invoiceId) {
    const inv = store.invoices.find((x) => x.id === invoiceId)
    const raw = inv ? getInvoiceCalcState(inv, store.bookings) : null
    if (raw) {
      try {
        initial = JSON.parse(raw) as CalculatorState
        editInvoiceId = inv!.id
      } catch {
        initial = null
      }
    }
  } else if (bookingId) {
    const b = store.bookings.find((x) => x.id === bookingId)
    if (b?.calc_state) {
      try {
        initial = JSON.parse(b.calc_state) as CalculatorState
        editBookingId = b.id
      } catch {
        initial = null
      }
    }
  }

  return (
    <CalculatorClient
      role={session.role}
      initial={initial}
      editBookingId={editBookingId}
      editInvoiceId={editInvoiceId}
      airlines={store.airlines}
      hotels={store.hotels}
      visa={store.visa}
      vehicles={[...store.vehicles].sort((a, b) => a.sort_order - b.sort_order)}
      routes={[...store.routes].sort((a, b) => a.sort_order - b.sort_order)}
      rateMatrix={store.rateMatrix}
      ziarats={[...store.ziarats].sort((a, b) => a.sort_order - b.sort_order)}
      exchangeRate={store.exchangeRate}
    />
  )
}
