'use server'

import { createClient } from '@/lib/supabase/server'
import type { PaymentStatus } from '@/lib/types'
import { logActivity } from './activity-log'

export interface BookingPaymentSummary {
  booking_id: string
  total_amount_pkr: number
  paid_amount_pkr: number
  remaining_amount_pkr: number
  payment_status: PaymentStatus
  payments_count: number
  last_payment_date?: string
}

export async function getBookingPaymentStatus(bookingId: string): Promise<BookingPaymentSummary> {
  const supabase = await createClient()

  // Get booking total
  const { data: booking } = await supabase
    .from('bookings')
    .select('total_selling_pkr')
    .eq('id', bookingId)
    .single()

  // Get payments
  const { data: payments } = await supabase
    .from('payments')
    .select('amount_pkr, payment_date')
    .eq('booking_id', bookingId)
    .order('payment_date', { ascending: false })

  const totalAmount = booking?.total_selling_pkr || 0
  const paidAmount = payments?.reduce((sum, p) => sum + p.amount_pkr, 0) || 0
  const remainingAmount = totalAmount - paidAmount

  let status: PaymentStatus
  if (remainingAmount <= 0) {
    status = 'paid'
  } else if (paidAmount === 0) {
    status = 'pending'
  } else if (paidAmount > 0 && remainingAmount > 0) {
    status = 'partial'
  } else {
    status = 'overdue'
  }

  return {
    booking_id: bookingId,
    total_amount_pkr: totalAmount,
    paid_amount_pkr: paidAmount,
    remaining_amount_pkr: Math.max(0, remainingAmount),
    payment_status: status,
    payments_count: payments?.length || 0,
    last_payment_date: payments?.[0]?.payment_date,
  }
}

export async function recordPayment(
  bookingId: string,
  amountPkr: number,
  method: 'cash' | 'bank_transfer' | 'card' | 'easypaisa' | 'jazzcash',
  note?: string
): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .insert({
      booking_id: bookingId,
      amount_pkr: amountPkr,
      payment_date: new Date().toISOString().split('T')[0],
      method,
      status: 'paid',
    })
    .select('id')
    .single()

  if (error) throw error

  // Log activity
  await logActivity('Payment Recorded', 'payment', data.id, {
    booking_id: bookingId,
    amount_pkr: amountPkr,
    method,
    note,
  })

  return data.id
}

export async function getPaymentsByBooking(bookingId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('payment_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPaymentStatusIcon(status: PaymentStatus): Promise<string> {
  const icons = {
    pending: '⏳',
    partial: '📊',
    paid: '✓',
    overdue: '⚠️',
  }
  return icons[status]
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors = {
    pending: 'bg-yellow-500',
    partial: 'bg-blue-500',
    paid: 'bg-green-500',
    overdue: 'bg-red-500',
  }
  return colors[status]
}
