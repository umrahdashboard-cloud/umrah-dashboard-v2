'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActivityLog } from '@/lib/types'

export async function logActivity(
  action: string,
  entityType: 'booking' | 'payment' | 'invoice' | 'settings',
  entityId: string,
  changes?: Record<string, any>
): Promise<void> {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // Get user display name
    const { data: userData } = await supabase
      .from('users')
      .select('display_name, username')
      .eq('id', user.id)
      .single()

    const ipAddress = process.env.CF_CONNECTING_IP || process.env.X_FORWARDED_FOR || 'unknown'

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_name: userData?.display_name || userData?.username || 'Unknown',
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes: changes || {},
      ip_address: ipAddress,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Activity log error:', error)
    // Don't throw - activity logging failure shouldn't break the app
  }
}

export async function getActivityLogs(
  limit: number = 100,
  offset: number = 0,
  filters?: {
    user_id?: string
    entity_type?: string
    start_date?: string
    end_date?: string
  }
): Promise<ActivityLog[]> {
  const supabase = await createClient()

  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id)
  }

  if (filters?.entity_type) {
    query = query.eq('entity_type', filters.entity_type)
  }

  if (filters?.start_date) {
    query = query.gte('timestamp', filters.start_date)
  }

  if (filters?.end_date) {
    query = query.lte('timestamp', filters.end_date)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}
