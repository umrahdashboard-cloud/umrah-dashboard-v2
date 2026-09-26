import { requireSession } from '@/lib/auth'
import { store } from '@/lib/demo-store'
import { fetchMergedBookingsAndPayments } from '@/lib/bookings-persistence'
import { BookingsClient } from './bookings-client'

export default async function BookingsPage() {
  const session = await requireSession()
  const { bookings: mergedBookings, payments } = await fetchMergedBookingsAndPayments()
  const bookings = [...mergedBookings].sort((a, b) => b.booking_date.localeCompare(a.booking_date))
  
  return (
    <BookingsClient
      role={session.role}
      bookings={bookings}
      payments={payments}
      exchangeRate={store.exchangeRate}
    />
  )
}
