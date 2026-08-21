'use server'

import { createClient } from '@/lib/supabase/server'

export interface RevenueReport {
  period: string
  total_bookings: number
  total_revenue_pkr: number
  total_cost_pkr: number
  total_profit_pkr: number
  average_booking_value: number
}

export interface AgentReport {
  agent_id: string
  agent_name: string
  total_bookings: number
  total_revenue_pkr: number
  commission_earned_pkr: number
  commission_paid_pkr: number
  commission_pending_pkr: number
}

export interface HotelReport {
  hotel_id: string
  hotel_name: string
  city: string
  total_nights: number
  total_rooms: number
  occupancy_rate: number
  revenue_pkr: number
}

export async function getRevenueByPeriod(startDate: string, endDate: string): Promise<RevenueReport[]> {
  const supabase = await createClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('booking_date, total_selling_pkr, cost_pkr')
    .gte('booking_date', startDate)
    .lte('booking_date', endDate)

  if (!bookings) return []

  // Group by month
  const reports: RevenueReport[] = []
  const grouped: Record<string, any> = {}

  bookings.forEach((b) => {
    const date = new Date(b.booking_date)
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!grouped[period]) {
      grouped[period] = {
        bookings: [],
        total_revenue: 0,
        total_cost: 0,
      }
    }

    grouped[period].bookings.push(b)
    grouped[period].total_revenue += b.total_selling_pkr
    grouped[period].total_cost += b.cost_pkr
  })

  for (const [period, data] of Object.entries(grouped)) {
    reports.push({
      period,
      total_bookings: data.bookings.length,
      total_revenue_pkr: data.total_revenue,
      total_cost_pkr: data.total_cost,
      total_profit_pkr: data.total_revenue - data.total_cost,
      average_booking_value: Math.round(data.total_revenue / data.bookings.length),
    })
  }

  return reports.sort((a, b) => b.period.localeCompare(a.period))
}

export async function getAgentPerformanceReport(): Promise<AgentReport[]> {
  const supabase = await createClient()

  // Get all agents with their bookings
  const { data: agents } = await supabase
    .from('users')
    .select('id, display_name, username')
    .eq('role', 'agent')

  if (!agents) return []

  const reports: AgentReport[] = []

  for (const agent of agents) {
    // Get agent's bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, total_selling_pkr')
      .eq('agent_id', agent.id)

    // Get agent's commissions
    const { data: commissions } = await supabase
      .from('commissions')
      .select('commission_amount_pkr, status')
      .eq('agent_id', agent.id)

    const totalRevenue = bookings?.reduce((sum, b) => sum + b.total_selling_pkr, 0) || 0
    const totalCommissionEarned = commissions?.reduce((sum, c) => sum + c.commission_amount_pkr, 0) || 0
    const totalCommissionPaid = commissions
      ?.filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + c.commission_amount_pkr, 0) || 0

    reports.push({
      agent_id: agent.id,
      agent_name: agent.display_name || agent.username,
      total_bookings: bookings?.length || 0,
      total_revenue_pkr: totalRevenue,
      commission_earned_pkr: totalCommissionEarned,
      commission_paid_pkr: totalCommissionPaid,
      commission_pending_pkr: totalCommissionEarned - totalCommissionPaid,
    })
  }

  return reports.sort((a, b) => b.total_revenue_pkr - a.total_revenue_pkr)
}

export async function getHotelOccupancyReport(): Promise<HotelReport[]> {
  const supabase = await createClient()

  const { data: hotels } = await supabase.from('hotels').select('id, name, city')

  if (!hotels) return []

  const reports: HotelReport[] = []

  for (const hotel of hotels) {
    const { data: accommodations } = await supabase
      .from('accommodations')
      .select('nights')
      .eq('hotel_id', hotel.id)

    const totalNights = accommodations?.reduce((sum, a) => sum + a.nights, 0) || 0
    const totalRooms = accommodations?.length || 0

    reports.push({
      hotel_id: hotel.id,
      hotel_name: hotel.name,
      city: hotel.city,
      total_nights: totalNights,
      total_rooms: totalRooms,
      occupancy_rate: totalRooms > 0 ? Math.round((totalNights / (totalRooms * 30)) * 100) : 0,
      revenue_pkr: 0, // Would need pricing data
    })
  }

  return reports
}

export async function exportReportToJSON(
  report: any,
  reportName: string
): Promise<{
  json: string
  filename: string
}> {
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `${reportName}-${timestamp}.json`

  return {
    json: JSON.stringify(report, null, 2),
    filename,
  }
}
