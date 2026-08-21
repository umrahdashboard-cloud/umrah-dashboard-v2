import type { Payment } from './types'

export function isPaymentActive(p: Payment): boolean {
  return !p.voided
}

export function sumActivePayments(payments: Payment[]): number {
  return payments
    .filter(isPaymentActive)
    .reduce((sum, p) => sum + (p.amount_pkr || 0), 0)
}

export function bookingPaidFromPayments(bookingId: string, payments: Payment[]): number {
  return sumActivePayments(payments.filter((p) => p.booking_id === bookingId))
}

export function paymentDisplayNote(p: Payment): string {
  if (p.voided && p.void_note) {
    const original = p.note?.trim()
    return original ? `${original} · VOID: ${p.void_note}` : `VOID: ${p.void_note}`
  }
  return p.note?.trim() || '—'
}
