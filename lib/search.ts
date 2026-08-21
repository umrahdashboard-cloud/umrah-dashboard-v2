'use server'

import { createClient } from '@/lib/supabase/server'

export interface SearchFilters {
  query?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  hotel?: string
  agent?: string
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'overdue'
  minAmount?: number
  maxAmount?: number
  type?: 'booking' | 'invoice' | 'payment' | 'all'
}

export interface SearchResult {
  id: string
  type: 'booking' | 'invoice' | 'payment'
  title: string
  description: string
  date: string
  amount?: number
  status: string
}

export async function globalSearch(filters: SearchFilters, limit: number = 50): Promise<SearchResult[]> {
  const supabase = await createClient()
  const results: SearchResult[] = []

  try {
    // Search bookings
    if (filters.type === 'booking' || filters.type === 'all') {
      let bookingQuery = supabase
        .from('bookings')
        .select('id, customer_name, total_selling_pkr, booking_date, makkah_hotel_name')

      if (filters.query) {
        bookingQuery = bookingQuery.or(
          `customer_name.ilike.%${filters.query}%,reference_no.ilike.%${filters.query}%`
        )
      }

      if (filters.dateFrom) {
        bookingQuery = bookingQuery.gte('booking_date', filters.dateFrom)
      }

      if (filters.dateTo) {
        bookingQuery = bookingQuery.lte('booking_date', filters.dateTo)
      }

      if (filters.minAmount) {
        bookingQuery = bookingQuery.gte('total_selling_pkr', filters.minAmount)
      }

      if (filters.maxAmount) {
        bookingQuery = bookingQuery.lte('total_selling_pkr', filters.maxAmount)
      }

      const { data: bookings } = await bookingQuery.limit(limit)

      if (bookings) {
        results.push(
          ...bookings.map((b) => ({
            id: b.id,
            type: 'booking' as const,
            title: `Booking: ${b.customer_name}`,
            description: `Hotel: ${b.makkah_hotel_name || 'N/A'} | Date: ${b.booking_date}`,
            date: b.booking_date,
            amount: b.total_selling_pkr,
            status: 'active',
          }))
        )
      }
    }

    // Search invoices
    if (filters.type === 'invoice' || filters.type === 'all') {
      let invoiceQuery = supabase
        .from('invoices')
        .select('id, booking_id, invoice_number, total_pkr, invoice_date')

      if (filters.query) {
        invoiceQuery = invoiceQuery.or(
          `invoice_number.ilike.%${filters.query}%,booking_id.ilike.%${filters.query}%`
        )
      }

      if (filters.dateFrom) {
        invoiceQuery = invoiceQuery.gte('invoice_date', filters.dateFrom)
      }

      if (filters.dateTo) {
        invoiceQuery = invoiceQuery.lte('invoice_date', filters.dateTo)
      }

      const { data: invoices } = await invoiceQuery.limit(limit)

      if (invoices) {
        results.push(
          ...invoices.map((inv) => ({
            id: inv.id,
            type: 'invoice' as const,
            title: `Invoice: ${inv.invoice_number}`,
            description: `Booking: ${inv.booking_id}`,
            date: inv.invoice_date,
            amount: inv.total_pkr,
            status: 'active',
          }))
        )
      }
    }

    // Search payments
    if (filters.type === 'payment' || filters.type === 'all') {
      let paymentQuery = supabase
        .from('payments')
        .select('id, booking_id, amount_pkr, payment_date, method')

      if (filters.query) {
        paymentQuery = paymentQuery.or(
          `booking_id.ilike.%${filters.query}%,method.ilike.%${filters.query}%`
        )
      }

      if (filters.dateFrom) {
        paymentQuery = paymentQuery.gte('payment_date', filters.dateFrom)
      }

      if (filters.dateTo) {
        paymentQuery = paymentQuery.lte('payment_date', filters.dateTo)
      }

      if (filters.minAmount) {
        paymentQuery = paymentQuery.gte('amount_pkr', filters.minAmount)
      }

      if (filters.maxAmount) {
        paymentQuery = paymentQuery.lte('amount_pkr', filters.maxAmount)
      }

      const { data: payments } = await paymentQuery.limit(limit)

      if (payments) {
        results.push(
          ...payments.map((p) => ({
            id: p.id,
            type: 'payment' as const,
            title: `Payment: ${p.method}`,
            description: `Booking: ${p.booking_id} | Date: ${p.payment_date}`,
            date: p.payment_date,
            amount: p.amount_pkr,
            status: 'completed',
          }))
        )
      }
    }
  } catch (error) {
    console.error('[v0] Search error:', error)
  }

  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
}

export async function getFilterOptions() {
  const supabase = await createClient()

  // Get unique hotels
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, name')
    .order('name')

  // Get unique agents
  const { data: agents } = await supabase
    .from('users')
    .select('id, display_name, username')
    .eq('role', 'agent')
    .order('display_name')

  return {
    hotels: hotels || [],
    agents: agents || [],
    paymentStatuses: ['pending', 'partial', 'paid', 'overdue'],
    types: ['booking', 'invoice', 'payment'],
  }
}
