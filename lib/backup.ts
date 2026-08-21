import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { store } from '@/lib/demo-store'

export interface BackupData {
  version: string
  exportDate: string
  timeline: {
    from: string
    to: string
  }
  data: {
    bookings: any[]
    payments: any[]
    invoices: any[]
    ledgers: any[]
    expenses: any[]
    hotelVouchers: any[]
    masterData: {
      airlines: any[]
      hotels: any[]
      visa: any
      routes: any[]
      ziarats: any[]
    }
  }
  checksum: string
}

function generateChecksum(data: any): string {
  const json = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

export async function exportBackup(timelineFrom: string, timelineTo: string): Promise<BackupData> {
  try {
    await requireRole('admin')
  } catch (error) {
    console.error('[v0] Auth check failed:', error)
    throw new Error('You must be logged in as admin to export backups')
  }

  const supabase = await createClient()

  // Fetch all data from Supabase with error handling
  const results = await Promise.allSettled([
    supabase.from('bookings').select('*'),
    supabase.from('payments').select('*'),
    Promise.resolve(supabase.from('invoices').select('*')).catch(() => ({ data: [] })),
    Promise.resolve(supabase.from('ledgers').select('*')).catch(() => ({ data: [] })),
    Promise.resolve(supabase.from('expenses').select('*')).catch(() => ({ data: [] })),
    Promise.resolve(supabase.from('hotel_vouchers').select('*')).catch(() => ({ data: [] })),
    supabase.from('airlines').select('*'),
    supabase.from('hotels').select('*'),
    Promise.resolve(supabase.from('visa_settings').select('*').single()).catch(() => ({ data: null })),
    supabase.from('routes').select('*'),
    supabase.from('ziarats').select('*'),
  ])

  const extractData = (result: PromiseSettledResult<any>, index: number) => {
    if (result.status === 'fulfilled') {
      return result.value?.data || []
    }
    console.warn(`[v0] Failed to fetch table at index ${index}`)
    return []
  }

  let bookings = extractData(results[0], 0)
  if (!bookings || bookings.length === 0) {
    bookings = store.bookings
  }

  let payments = extractData(results[1], 1)
  if (!payments || payments.length === 0) {
    payments = store.payments
  }

  const invoices = store.invoices || []
  const ledgers = extractData(results[3], 3)
  const expenses = store.expenses || []
  const hotelVouchers = store.vouchers || []

  let airlines = extractData(results[6], 6)
  if (!airlines || airlines.length === 0) {
    airlines = store.airlines
  }

  let hotels = extractData(results[7], 7)
  if (!hotels || hotels.length === 0) {
    hotels = store.hotels
  }

  let visa = results[8].status === 'fulfilled' ? (results[8].value?.data || null) : null
  if (!visa) {
    visa = store.visa
  }

  let routes = extractData(results[9], 9)
  if (!routes || routes.length === 0) {
    routes = store.routes
  }

  let ziarats = extractData(results[10], 10)
  if (!ziarats || ziarats.length === 0) {
    ziarats = store.ziarats
  }

  const backupData: BackupData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    timeline: {
      from: timelineFrom,
      to: timelineTo,
    },
    data: {
      bookings: bookings || [],
      payments: payments || [],
      invoices: invoices || [],
      ledgers: ledgers || [],
      expenses: expenses || [],
      hotelVouchers: hotelVouchers || [],
      masterData: {
        airlines: airlines || [],
        hotels: hotels || [],
        visa: visa || null,
        routes: routes || [],
        ziarats: ziarats || [],
      },
    },
    checksum: '',
  }

  backupData.checksum = generateChecksum(backupData.data)
  return backupData
}

export async function restoreBackup(backupData: BackupData, password: string): Promise<void> {
  const session = await requireRole('admin')
  const currentUserId = session.userId
  
  // Verify password (use default if not set)
  const backupPassword = process.env.BACKUP_RESTORE_PASSWORD || 'CRM-RESTORE-2026'
  if (password !== backupPassword) {
    throw new Error('Invalid backup password')
  }

  // Verify checksum
  const calculatedChecksum = generateChecksum(backupData.data)
  if (calculatedChecksum !== backupData.checksum) {
    throw new Error('Backup data integrity check failed - file may be corrupted')
  }

  const supabase = await createClient()

  // 1. Restore in-memory store
  store.bookings = backupData.data.bookings || []
  store.payments = backupData.data.payments || []
  store.invoices = backupData.data.invoices || []
  store.expenses = backupData.data.expenses || []
  store.vouchers = backupData.data.hotelVouchers || []

  if (backupData.data.masterData) {
    const md = backupData.data.masterData
    if (md.airlines) store.airlines = md.airlines
    if (md.hotels) store.hotels = md.hotels
    if (md.visa) store.visa = md.visa
    if (md.routes) store.routes = md.routes
    if (md.ziarats) store.ziarats = md.ziarats
  }

  // 2. Restore Supabase tables
  // Delete existing data (with caution, handling foreign keys)
  await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Get valid users to satisfy FK constraint on bookings(created_by)
  const { data: dbUsers } = await supabase.from('users').select('id')
  const validUserIds = new Set(dbUsers?.map((u) => u.id) || [currentUserId])

  // Insert bookings
  if (backupData.data.bookings && backupData.data.bookings.length > 0) {
    const bookingsToInsert = backupData.data.bookings.map((b) => ({
      ...b,
      created_by: validUserIds.has(b.created_by) ? b.created_by : currentUserId,
    }))
    await supabase.from('bookings').insert(bookingsToInsert)
  }

  // Insert payments (ensuring they correspond to restored bookings)
  if (backupData.data.payments && backupData.data.payments.length > 0 && backupData.data.bookings && backupData.data.bookings.length > 0) {
    const bookingIds = new Set(backupData.data.bookings.map((b) => b.id))
    const paymentsToInsert = backupData.data.payments.filter((p) => bookingIds.has(p.booking_id))
    if (paymentsToInsert.length > 0) {
      await supabase.from('payments').insert(paymentsToInsert)
    }
  }

  // Restore master setting tables
  if (backupData.data.masterData) {
    const md = backupData.data.masterData
    if (md.airlines && md.airlines.length > 0) {
      await supabase.from('airlines').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('airlines').insert(md.airlines)
    }
    if (md.hotels && md.hotels.length > 0) {
      await supabase.from('hotels').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('hotels').insert(md.hotels)
    }
    if (md.routes && md.routes.length > 0) {
      await supabase.from('routes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('routes').insert(md.routes)
    }
    if (md.ziarats && md.ziarats.length > 0) {
      await supabase.from('ziarats').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('ziarats').insert(md.ziarats)
    }
    if (md.visa) {
      await supabase.from('visa_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      const visaData = Array.isArray(md.visa) ? md.visa : [md.visa]
      await supabase.from('visa_settings').insert(visaData)
    }
  }
}

