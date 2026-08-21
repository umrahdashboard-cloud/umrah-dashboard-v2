import { requireSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { store } from '@/lib/demo-store'
import { mergeBookings, mergePayments } from '@/lib/bookings-persistence'
import { BookingsClient } from './bookings-client'

export default async function BookingsPage() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: bookingsData } = await supabase
    .from('bookings')
    .select('*')
    .order('booking_date', { ascending: false })

  const { data: paymentsData } = await supabase
    .from('payments')
    .select('*')

  const bookings = mergeBookings(bookingsData ?? [])
  const payments = mergePayments(paymentsData ?? [])
  
  return (
    <BookingsClient
      role={session.role}
      bookings={bookings}
      payments={payments}
      exchangeRate={store.exchangeRate}
    />
  )
}
