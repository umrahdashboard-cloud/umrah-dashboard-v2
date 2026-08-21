import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test insert a booking
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        booking_date: new Date().toISOString().split('T')[0],
        customer_name: 'Test Booking',
        total_pkr: 100000,
        cost_pkr: 80000,
        profit_pkr: 20000,
        advance_pkr: 0,
        paid_pkr: 0,
        remaining_pkr: 100000,
        adult_count: 1,
        child_count: 0,
        infant_count: 0,
      })
      .select()
    
    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    
    return Response.json({ 
      success: true, 
      data,
      message: 'Test booking created. Go to /bookings to see it'
    })
  } catch (err) {
    return Response.json({ 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}
