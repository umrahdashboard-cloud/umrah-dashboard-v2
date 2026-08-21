'use server'

import { createClient } from '@/lib/supabase/server'
import { logActivity } from './activity-log'

export interface AgentCommissionSummary {
  agent_id: string
  agent_name: string
  total_bookings: number
  total_booking_amount: number
  commission_percentage: number
  total_commission_earned: number
  total_commission_paid: number
  pending_commission: number
}

export async function recordCommission(
  agentId: string,
  bookingId: string,
  bookingAmountPkr: number,
  commissionPercentage: number
): Promise<string> {
  const supabase = await createClient()

  const commissionAmount = Math.round((bookingAmountPkr * commissionPercentage) / 100)

  const { data, error } = await supabase
    .from('commissions')
    .insert({
      agent_id: agentId,
      booking_id: bookingId,
      booking_amount_pkr: bookingAmountPkr,
      commission_percentage: commissionPercentage,
      commission_amount_pkr: commissionAmount,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error

  await logActivity('Commission Created', 'booking', bookingId, {
    agent_id: agentId,
    commission_amount_pkr: commissionAmount,
    commission_percentage: commissionPercentage,
  })

  return data.id
}

export async function getAgentCommissionSummary(agentId: string): Promise<AgentCommissionSummary> {
  const supabase = await createClient()

  // Get agent info
  const { data: agent } = await supabase
    .from('users')
    .select('display_name, username')
    .eq('id', agentId)
    .eq('role', 'agent')
    .single()

  // Get commissions
  const { data: commissions } = await supabase
    .from('commissions')
    .select('*')
    .eq('agent_id', agentId)

  const totalBookings = commissions?.length || 0
  const totalBookingAmount = commissions?.reduce((sum, c) => sum + c.booking_amount_pkr, 0) || 0
  const totalCommissionEarned = commissions?.reduce((sum, c) => sum + c.commission_amount_pkr, 0) || 0
  const totalCommissionPaid = commissions
    ?.filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.commission_amount_pkr, 0) || 0
  const pendingCommission = totalCommissionEarned - totalCommissionPaid

  const commissionPercentage = (commissions && commissions.length > 0) ? commissions[0].commission_percentage : 0

  return {
    agent_id: agentId,
    agent_name: agent?.display_name || agent?.username || 'Unknown',
    total_bookings: totalBookings,
    total_booking_amount: totalBookingAmount,
    commission_percentage: commissionPercentage,
    total_commission_earned: totalCommissionEarned,
    total_commission_paid: totalCommissionPaid,
    pending_commission: pendingCommission,
  }
}

export async function approveCommission(commissionId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('commissions')
    .update({ status: 'approved' })
    .eq('id', commissionId)

  if (error) throw error

  await logActivity('Commission Approved', 'booking', commissionId, {
    status: 'approved',
  })
}

export async function markCommissionPaid(commissionId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('commissions')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', commissionId)

  if (error) throw error

  await logActivity('Commission Paid', 'booking', commissionId, {
    status: 'paid',
  })
}

export async function getAgentCommissions(agentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
