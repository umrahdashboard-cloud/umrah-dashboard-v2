import { store, uid } from './demo-store'
import type { Booking, Payment } from './types'

export function isSupabaseUnavailableError(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('fetch failed') || m.includes('connect timeout') || m.includes('network')
}

export function mergeBookings(dbBookings: Booking[] = [], localBookings: Booking[] = store.bookings): Booking[] {
  const map = new Map<string, Booking>()
  for (const b of dbBookings) map.set(b.id, b as Booking)
  for (const b of localBookings) map.set(b.id, b)
  return [...map.values()].sort((a, b) => b.booking_date.localeCompare(a.booking_date))
}

export function mergePayments(dbPayments: Payment[] = [], localPayments: Payment[] = store.payments): Payment[] {
  const map = new Map<string, Payment>()
  for (const p of dbPayments) map.set(p.id, p as Payment)
  for (const p of localPayments) map.set(p.id, p)
  return [...map.values()]
}

type BookingRow = Omit<Booking, 'id' | 'source_invoice_id' | 'created_by'>

export function upsertBookingInStore(
  bookingId: string | null,
  bookingData: BookingRow,
  createdBy: string,
): Booking {
  const existingIdx = bookingId ? store.bookings.findIndex((b) => b.id === bookingId) : -1
  const existing = existingIdx >= 0 ? store.bookings[existingIdx] : null

  const booking: Booking = {
    id: bookingId ?? uid('b'),
    ...bookingData,
    source_invoice_id: existing?.source_invoice_id ?? '',
    created_by: existing?.created_by ?? createdBy,
  }

  if (existingIdx >= 0) store.bookings[existingIdx] = booking
  else store.bookings.push(booking)

  return booking
}

export function syncAdvancePaymentInStore(booking: Booking, advancePkr: number) {
  const idx = store.payments.findIndex((p) => p.booking_id === booking.id && p.note === 'Advance')

  if (advancePkr > 0) {
    const payment: Payment = {
      id: idx >= 0 ? store.payments[idx].id : uid('pay'),
      booking_id: booking.id,
      customer_name: booking.customer_name,
      payment_date: booking.booking_date,
      amount_pkr: Math.round(advancePkr),
      method: 'Cash',
      note: 'Advance',
    }
    if (idx >= 0) store.payments[idx] = payment
    else store.payments.push(payment)
    return
  }

  if (idx >= 0) store.payments.splice(idx, 1)
}

export function paidOtherFromStore(bookingId: string): number {
  return store.payments
    .filter((p) => p.booking_id === bookingId && p.note !== 'Advance' && !p.voided)
    .reduce((sum, p) => sum + (p.amount_pkr || 0), 0)
}
