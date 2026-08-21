'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { store, uid, hashPassword } from './demo-store'
import {
  encodeSession, requireRole, requireSession, verifyCredentials, SESSION_COOKIE,
} from './auth'
import { toPkr } from './currency'
import { computeCosts } from './calc'
import { buildInvoiceLinesFromCalc } from './invoice-calc'
import { createClient } from './supabase/server'
import {
  isSupabaseUnavailableError,
  paidOtherFromStore,
  syncAdvancePaymentInStore,
  upsertBookingInStore,
} from './bookings-persistence'
import { bookingPaidFromPayments } from './payment-utils'
import type {
  Airline, Booking, BrandingSettings, CalculatorState, Expense, Hotel, HotelContactEntry,
  HotelVoucherSettings, Invoice, InvoiceLine, Payment, Role, TransportContactEntry, TransportRoute,
  User, Vehicle, VisaSettings, Voucher, Ziarat,
} from './types'

// ── Auth ───────────────────────────────────────────────────────────────

export async function login(_prev: { error?: string } | null, formData: FormData) {
  const username = String(formData.get('username') ?? '')
  const password = String(formData.get('password') ?? '')
  const user = verifyCredentials(username, password)
  if (!user) return { error: 'Invalid username or password' }
  const jar = await cookies()
  // sameSite must be 'none' (+ secure) so the cookie survives inside the
  // embedded preview iframe, which browsers treat as a third-party context
  // and would otherwise drop Lax cookies on navigation.
  jar.set(SESSION_COOKIE, encodeSession({ userId: user.id, role: user.role, displayName: user.display_name }), {
    httpOnly: true, sameSite: 'none', secure: true, path: '/', maxAge: 60 * 60 * 24 * 7,
  })
  redirect('/dashboard')
}

export async function logout() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  redirect('/login')
}

// ── Master registries (Admin only) ─────────────────────────────────────

export async function upsertAirline(data: Airline) {
  await requireRole('admin')
  const i = store.airlines.findIndex((a) => a.id === data.id)
  if (i >= 0) store.airlines[i] = data
  else store.airlines.push({ ...data, id: uid('al') })
  revalidatePath('/settings/airlines')
}

export async function deleteAirline(id: string) {
  await requireRole('admin')
  store.airlines = store.airlines.filter((a) => a.id !== id)
  revalidatePath('/settings/airlines')
}

export async function upsertHotel(data: Hotel) {
  await requireRole('admin')
  const i = store.hotels.findIndex((h) => h.id === data.id)
  if (i >= 0) store.hotels[i] = data
  else store.hotels.push({ ...data, id: uid('h') })
  revalidatePath('/settings/hotels')
}

export async function deleteHotel(id: string) {
  await requireRole('admin')
  store.hotels = store.hotels.filter((h) => h.id !== id)
  store.hotelContacts = store.hotelContacts.filter((c) => c.hotel_id !== id)
  revalidatePath('/settings/hotels')
  revalidatePath('/settings/contacts')
}

export async function upsertHotelContact(data: Omit<HotelContactEntry, 'id'> & { id?: string }) {
  await requireRole('admin')
  const i = store.hotelContacts.findIndex((c) => c.id === data.id)
  if (i >= 0) store.hotelContacts[i] = { ...store.hotelContacts[i], ...data, id: data.id! }
  else store.hotelContacts.push({ id: uid('hc'), hotel_id: data.hotel_id, phone: data.phone })
  revalidatePath('/settings/contacts')
  revalidatePath('/hotel-vouchers')
}

export async function deleteHotelContact(id: string) {
  await requireRole('admin')
  store.hotelContacts = store.hotelContacts.filter((c) => c.id !== id)
  revalidatePath('/settings/contacts')
  revalidatePath('/hotel-vouchers')
}

export async function upsertTransportContact(data: Omit<TransportContactEntry, 'id'> & { id?: string }) {
  await requireRole('admin')
  const i = store.transportContacts.findIndex((c) => c.id === data.id)
  if (i >= 0) store.transportContacts[i] = { ...store.transportContacts[i], ...data, id: data.id! }
  else store.transportContacts.push({
    id: uid('tc'),
    city: data.city,
    company_name: data.company_name,
    phone: data.phone,
  })
  revalidatePath('/settings/contacts')
  revalidatePath('/hotel-vouchers')
}

export async function deleteTransportContact(id: string) {
  await requireRole('admin')
  store.transportContacts = store.transportContacts.filter((c) => c.id !== id)
  revalidatePath('/settings/contacts')
  revalidatePath('/hotel-vouchers')
}

export async function saveVisaSettings(data: VisaSettings) {
  await requireRole('admin')
  store.visa = data
  revalidatePath('/settings/visa')
}

export async function upsertVehicle(data: Vehicle) {
  await requireRole('admin')
  const i = store.vehicles.findIndex((v) => v.id === data.id)
  if (i >= 0) store.vehicles[i] = data
  else store.vehicles.push({ ...data, id: uid('v') })
  revalidatePath('/settings/transport')
}

export async function deleteVehicle(id: string) {
  await requireRole('admin')
  store.vehicles = store.vehicles.filter((v) => v.id !== id)
  store.rateMatrix = store.rateMatrix.filter((r) => r.vehicle_id !== id)
  revalidatePath('/settings/transport')
}

export async function upsertRoute(data: TransportRoute) {
  await requireRole('admin')
  const i = store.routes.findIndex((r) => r.id === data.id)
  if (i >= 0) store.routes[i] = data
  else store.routes.push({ ...data, id: uid('r') })
  revalidatePath('/settings/transport')
}

export async function deleteRoute(id: string) {
  await requireRole('admin')
  store.routes = store.routes.filter((r) => r.id !== id)
  store.rateMatrix = store.rateMatrix.filter((r) => r.route_id !== id)
  revalidatePath('/settings/transport')
}

export async function setMatrixRate(routeId: string, vehicleId: string, rateSar: number) {
  await requireRole('admin')
  const i = store.rateMatrix.findIndex((r) => r.route_id === routeId && r.vehicle_id === vehicleId)
  if (i >= 0) store.rateMatrix[i].rate_sar = rateSar
  else store.rateMatrix.push({ route_id: routeId, vehicle_id: vehicleId, rate_sar: rateSar })
  revalidatePath('/settings/transport')
}

export async function upsertZiarat(data: Ziarat) {
  await requireRole('admin')
  const i = store.ziarats.findIndex((z) => z.id === data.id)
  if (i >= 0) store.ziarats[i] = data
  else store.ziarats.push({ ...data, id: uid('z') })
  revalidatePath('/settings/ziarat')
}

export async function deleteZiarat(id: string) {
  await requireRole('admin')
  store.ziarats = store.ziarats.filter((z) => z.id !== id)
  revalidatePath('/settings/ziarat')
}

export async function setExchangeRate(rate: number) {
  await requireRole('admin')
  if (rate > 0) store.exchangeRate = rate
  revalidatePath('/', 'layout')
}

export async function saveBranding(data: BrandingSettings) {
  await requireRole('admin')
  store.branding = data
  revalidatePath('/settings/branding')
}

export async function saveHotelVoucherSettings(data: HotelVoucherSettings) {
  await requireRole('admin')
  store.hotelVoucherSettings = data
  revalidatePath('/settings/hotel-voucher')
  revalidatePath('/hotel-vouchers')
}

export async function upsertUser(data: Omit<User, 'password_hash'> & { password?: string }) {
  await requireRole('admin')
  const i = store.users.findIndex((u) => u.id === data.id)
  if (i >= 0) {
    const existing = store.users[i]
    store.users[i] = {
      ...existing, ...data,
      password_hash: data.password ? hashPassword(data.password) : existing.password_hash,
    }
  } else {
    store.users.push({
      ...data, id: uid('u'),
      password_hash: hashPassword(data.password || 'changeme'),
    })
  }
  revalidatePath('/settings/users')
}

export async function deleteUser(id: string) {
  await requireRole('admin')
  store.users = store.users.filter((u) => u.id !== id)
  revalidatePath('/settings/users')
}

// ── Bookings (Admin + Moderator) ───────────────────────────────────────

export interface SaveBookingInput {
  booking_id: string | null
  calc: CalculatorState
  computed: {
    airline_name: string
    total_pkr: number
    cost_pkr: number
    profit_pkr: number
    advance_pkr: number
    makkah_hotel_name: string
    madinah_hotel_name: string
  }
}

export async function saveBooking(input: SaveBookingInput): Promise<{ id: string }> {
  const session = await requireRole('admin', 'moderator')
  const { calc, computed } = input

  const localExisting = input.booking_id
    ? store.bookings.find((b) => b.id === input.booking_id) ?? null
    : null

  let existing: Booking | null = localExisting
  let paidOther = existing ? paidOtherFromStore(existing.id) : 0

  try {
    const supabase = await createClient()
    if (input.booking_id) {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', input.booking_id)
        .single()
      if (data) existing = data as Booking
    }

    if (existing) {
      const { data: payments } = await supabase
        .from('payments')
        .select('amount_pkr, voided')
        .eq('booking_id', existing.id)
        .neq('note', 'Advance')
      paidOther = payments?.filter((p) => !p.voided).reduce((s, p) => s + (p.amount_pkr || 0), 0) ?? paidOther
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.warn('[v0] Supabase unavailable for booking lookup, using local store:', msg)
  }

  const paid = computed.advance_pkr + paidOther

  const bookingData = {
    booking_date: existing?.booking_date ?? new Date().toISOString().slice(0, 10),
    customer_name: calc.customer_name || 'Walk-in Customer',
    airline_name: computed.airline_name || '',
    total_pkr: Math.round(Number(computed.total_pkr) || 0),
    cost_pkr: Math.round(Number(computed.cost_pkr) || 0),
    profit_pkr: Math.round(Number(computed.profit_pkr) || 0),
    advance_pkr: Math.round(Number(computed.advance_pkr) || 0),
    paid_pkr: Math.round(paid || 0),
    remaining_pkr: Math.round((computed.total_pkr - paid) || 0),
    adult_count: Number(calc.adults) || 0,
    child_count: Number(calc.children) || 0,
    infant_count: Number(calc.infants) || 0,
    makkah_hotel_name: calc.makkah_enabled ? computed.makkah_hotel_name || '' : '',
    makkah_room_type: calc.makkah_enabled ? calc.makkah_room_type || '' : '',
    makkah_nights: calc.makkah_enabled ? Number(calc.makkah_nights) || 0 : 0,
    madinah_hotel_name: calc.madinah_enabled ? computed.madinah_hotel_name || '' : '',
    madinah_room_type: calc.madinah_enabled ? calc.madinah_room_type || '' : '',
    madinah_nights: calc.madinah_enabled ? Number(calc.madinah_nights) || 0 : 0,
    calc_state: JSON.stringify(calc),
  }

  let bookingId = existing?.id ?? null

  try {
    const supabase = await createClient()

    if (existing) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', existing.id)
      if (updateError) throw new Error(updateError.message)
      bookingId = existing.id
    } else {
      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
      if (insertError) throw new Error(insertError.message)
      if (!data?.[0]?.id) throw new Error('No booking ID returned from insert')
      bookingId = data[0].id
    }

    const { data: advPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('note', 'Advance')
      .maybeSingle()

    if (computed.advance_pkr > 0) {
      if (advPayment) {
        await supabase
          .from('payments')
          .update({
            amount_pkr: computed.advance_pkr,
            customer_name: bookingData.customer_name,
          })
          .eq('id', advPayment.id)
      } else {
        await supabase.from('payments').insert({
          booking_id: bookingId,
          customer_name: bookingData.customer_name,
          payment_date: bookingData.booking_date,
          amount_pkr: computed.advance_pkr,
          method: 'Cash',
          note: 'Advance',
        })
      }
    } else if (advPayment) {
      await supabase.from('payments').delete().eq('id', advPayment.id)
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (!isSupabaseUnavailableError(msg)) {
      console.warn('[v0] Supabase booking sync failed, saved locally instead:', msg)
    } else {
      console.warn('[v0] Supabase unreachable, saving booking to local store')
    }
  }

  const booking = upsertBookingInStore(bookingId, bookingData, session.userId)
  bookingId = booking.id
  syncAdvancePaymentInStore(booking, computed.advance_pkr)

  if (bookingData.cost_pkr > 0) {
    const existingExpenseIndex = store.expenses.findIndex(
      (e) => e.booking_id === bookingId && e.note?.includes('Booking Cost'),
    )
    const expenseData: Expense = {
      id: existingExpenseIndex >= 0 ? store.expenses[existingExpenseIndex].id : uid('e'),
      expense_date: bookingData.booking_date,
      expense_type: 'Umrah Supplier',
      supplier: bookingData.customer_name,
      amount_pkr: bookingData.cost_pkr,
      method: 'Bank',
      note: `Booking Cost for ${bookingData.customer_name}`,
      booking_id: bookingId,
      invoice_id: null,
    }
    if (existingExpenseIndex >= 0) store.expenses[existingExpenseIndex] = expenseData
    else store.expenses.push(expenseData)
  } else {
    store.expenses = store.expenses.filter(
      (e) => !(e.booking_id === bookingId && e.note?.includes('Booking Cost')),
    )
  }

  revalidatePath('/bookings')
  revalidatePath('/dashboard')
  revalidatePath('/ledger')
  revalidatePath('/accounts')
  return { id: bookingId }
}

export async function deleteBooking(id: string) {
  await requireRole('admin')
  const supabase = await createClient()
  
  // Delete all payments for this booking
  await supabase
    .from('payments')
    .delete()
    .eq('booking_id', id)
  
  // Delete the booking
  await supabase
    .from('bookings')
    .delete()
    .eq('id', id)

  // Remove linked expenses
  store.expenses = store.expenses.filter((e) => e.booking_id !== id)
  
  revalidatePath('/bookings')
  revalidatePath('/dashboard')
  revalidatePath('/accounts')
}

export async function addPayment(input: {
  booking_id: string
  amount_pkr: number
  method: 'Cash' | 'Bank' | 'JazzCash' | 'EasyPaisa'
  note: string
}) {
  await requireRole('admin', 'moderator')
  const supabase = await createClient()
  
  // Get booking details from Supabase (or fallback to store)
  const { data: dbBooking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', input.booking_id)
    .single()
  
  const booking = dbBooking || store.bookings.find((b) => b.id === input.booking_id)
  
  if (!booking || input.amount_pkr <= 0) {
    console.error('Booking not found or invalid amount')
    return
  }
  
  // Generate ID and paymentDate
  const paymentId = uid('pay')
  const paymentDate = new Date().toISOString().slice(0, 10)
  
  // Insert payment into Supabase if DB booking exists
  if (dbBooking) {
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        id: paymentId,
        booking_id: input.booking_id,
        customer_name: booking.customer_name,
        payment_date: paymentDate,
        amount_pkr: Math.round(input.amount_pkr),
        method: input.method,
        note: input.note,
      })
    if (paymentError) {
      console.error('Failed to record payment on Supabase:', paymentError)
    }
  }

  // Insert payment into local in-memory store
  store.payments.push({
    id: paymentId,
    booking_id: input.booking_id,
    customer_name: booking.customer_name,
    payment_date: paymentDate,
    amount_pkr: Math.round(input.amount_pkr),
    method: input.method,
    note: input.note,
  })
  
  // Update booking paid amount
  const newPaidAmount = (booking.paid_pkr || 0) + Math.round(input.amount_pkr)
  const newRemainingAmount = booking.total_pkr - newPaidAmount
  
  if (dbBooking) {
    await supabase
      .from('bookings')
      .update({
        paid_pkr: newPaidAmount,
        remaining_pkr: newRemainingAmount,
      })
      .eq('id', input.booking_id)
  }

  // Update booking in local in-memory store
  const storeBooking = store.bookings.find((b) => b.id === input.booking_id)
  if (storeBooking) {
    storeBooking.paid_pkr = newPaidAmount
    storeBooking.remaining_pkr = newRemainingAmount
  }
  
  revalidatePath('/bookings')
  revalidatePath('/ledger')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
}

async function recalculateBookingPaidAmounts(bookingId: string) {
  const paid = bookingPaidFromPayments(bookingId, store.payments)
  const storeBooking = store.bookings.find((b) => b.id === bookingId)
  const total = storeBooking?.total_pkr ?? 0
  const remaining = Math.max(0, total - paid)

  if (storeBooking) {
    storeBooking.paid_pkr = paid
    storeBooking.remaining_pkr = remaining
  }

  try {
    const supabase = await createClient()
    const { data: dbBooking } = await supabase
      .from('bookings')
      .select('total_pkr')
      .eq('id', bookingId)
      .single()

    const bookingTotal = dbBooking?.total_pkr ?? total
    const remainingDb = Math.max(0, bookingTotal - paid)

    await supabase
      .from('bookings')
      .update({
        paid_pkr: paid,
        remaining_pkr: remainingDb,
      })
      .eq('id', bookingId)
  } catch (error) {
    console.warn('[v0] Failed to sync recalculated booking totals to Supabase:', error)
  }
}

export async function voidPayment(input: { payment_id: string; void_note: string }) {
  await requireRole('admin', 'moderator')
  const voidNote = input.void_note.trim()
  if (!voidNote) throw new Error('A void reason is required')

  let payment = store.payments.find((p) => p.id === input.payment_id)

  if (!payment) {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('id', input.payment_id)
        .single()
      if (data) {
        payment = data as Payment
        store.payments.push(payment)
      }
    } catch (error) {
      console.warn('[v0] Could not load payment from Supabase for void:', error)
    }
  }

  if (!payment) throw new Error('Payment not found')
  if (payment.voided) throw new Error('This payment is already voided')

  const voidedAt = new Date().toISOString()
  payment.voided = true
  payment.void_note = voidNote
  payment.voided_at = voidedAt

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('payments')
      .update({
        voided: true,
        void_note: voidNote,
        voided_at: voidedAt,
      })
      .eq('id', input.payment_id)

    if (error) {
      console.warn('[v0] Supabase void payment update failed:', error.message)
    }
  } catch (error) {
    console.warn('[v0] Supabase unreachable while voiding payment, saved locally')
  }

  await recalculateBookingPaidAmounts(payment.booking_id)

  revalidatePath('/bookings')
  revalidatePath('/ledger')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
}

// ── Invoices ───────────────────────────────────────────────────────────

export async function saveInvoice(input: {
  id: string | null
  customer_name: string
  lines: InvoiceLine[]
}): Promise<{ id: string }> {
  const session = await requireRole('admin', 'moderator')
  // Currency lock rule: invoice currency = currency of the first line
  const currency = input.lines[0]?.currency ?? 'PKR'
  const rate = store.exchangeRate
  const total_pkr = input.lines.reduce(
    (sum, l) => sum + toPkr(l.unit_price * l.count, l.currency, rate), 0,
  )
  const existing = input.id ? store.invoices.find((v) => v.id === input.id) : null
  const invoice: Invoice = {
    id: existing?.id ?? uid('inv'),
    invoice_number: existing?.invoice_number ?? store.invoiceCounter++,
    invoice_date: existing?.invoice_date ?? new Date().toISOString().slice(0, 10),
    customer_name: input.customer_name,
    currency,
    lines: input.lines,
    total_pkr,
    created_by: existing?.created_by ?? session.userId,
    calc_state: existing?.calc_state,
  }
  const i = store.invoices.findIndex((v) => v.id === invoice.id)
  if (i >= 0) store.invoices[i] = invoice
  else store.invoices.push(invoice)
  revalidatePath('/invoices')
  return { id: invoice.id }
}

export async function saveInvoiceFromCalculator(input: {
  invoice_id: string | null
  calc: CalculatorState
}): Promise<{ id: string }> {
  const session = await requireRole('admin', 'moderator')
  const master = {
    airlines: store.airlines,
    hotels: store.hotels,
    visa: store.visa,
    rateMatrix: store.rateMatrix,
    ziarats: store.ziarats,
    exchangeRate: store.exchangeRate,
  }
  const cost = computeCosts(input.calc, master)
  const existing = input.invoice_id ? store.invoices.find((v) => v.id === input.invoice_id) : null
  const lines = buildInvoiceLinesFromCalc(input.calc, cost, master, existing?.lines)
  const currency = input.calc.currency
  const total_pkr = Math.round(cost.total_selling_pkr)
  const invoice: Invoice = {
    id: existing?.id ?? uid('inv'),
    invoice_number: existing?.invoice_number ?? store.invoiceCounter++,
    invoice_date: existing?.invoice_date ?? new Date().toISOString().slice(0, 10),
    customer_name: input.calc.customer_name.trim() || 'Walk-in Customer',
    currency,
    lines,
    total_pkr,
    created_by: existing?.created_by ?? session.userId,
    calc_state: JSON.stringify(input.calc),
  }
  const i = store.invoices.findIndex((v) => v.id === invoice.id)
  if (i >= 0) store.invoices[i] = invoice
  else store.invoices.push(invoice)

  // Keep linked booking calc_state in sync when editing via invoice
  if (existing) {
    for (const b of store.bookings) {
      if (b.source_invoice_id === invoice.id) {
        b.calc_state = invoice.calc_state ?? ''
        b.customer_name = invoice.customer_name
        b.total_pkr = total_pkr
      }
    }
  }

  revalidatePath('/invoices')
  revalidatePath('/bookings')
  return { id: invoice.id }
}

export async function deleteInvoice(id: string) {
  await requireRole('admin')
  store.invoices = store.invoices.filter((v) => v.id !== id)
  revalidatePath('/invoices')
}

// ── Expenses ───────────────────────────────────────────────────────────

export async function upsertExpense(data: Expense) {
  await requireRole('admin', 'moderator')
  const i = store.expenses.findIndex((e) => e.id === data.id)
  if (i >= 0) store.expenses[i] = data
  else store.expenses.push({ ...data, id: uid('e') })
  revalidatePath('/expenses')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
}

export async function deleteExpense(id: string) {
  await requireRole('admin')
  store.expenses = store.expenses.filter((e) => e.id !== id)
  revalidatePath('/expenses')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
}

// ── Vouchers ───────────────────────────────────────────────────────────

export async function upsertVoucher(data: Voucher): Promise<{ id: string }> {
  await requireRole('admin', 'moderator')
  const i = store.vouchers.findIndex((v) => v.id === data.id)
  let id = data.id
  if (i >= 0) {
    store.vouchers[i] = data
  } else {
    id = uid('vch')
    store.vouchers.push({
      ...data,
      id,
      created_at: new Date().toISOString(),
    })
  }
  revalidatePath('/hotel-vouchers')
  return { id }
}

export async function deleteVoucher(id: string) {
  await requireRole('admin')
  store.vouchers = store.vouchers.filter((v) => v.id !== id)
  revalidatePath('/hotel-vouchers')
}

// ── PDF storage tracker ────────────────────────────────────────────────

export async function trackPdfBytes(bytes: number) {
  await requireSession()
  store.pdfBytesUsed += bytes
  revalidatePath('/dashboard')
}

// ── Bulk Deletion Actions ──────────────────────────────────────────────

export async function deleteBookings(ids: string[]) {
  await requireRole('admin')
  const supabase = await createClient()

  // Delete payments for these bookings
  await supabase
    .from('payments')
    .delete()
    .in('booking_id', ids)

  // Delete the bookings
  await supabase
    .from('bookings')
    .delete()
    .in('id', ids)

  // Remove linked expenses
  store.expenses = store.expenses.filter((e) => !e.booking_id || !ids.includes(e.booking_id))

  revalidatePath('/bookings')
  revalidatePath('/dashboard')
  revalidatePath('/ledger')
  revalidatePath('/accounts')
}

export async function deleteInvoices(ids: string[]) {
  await requireRole('admin')
  store.invoices = store.invoices.filter((v) => !ids.includes(v.id))
  revalidatePath('/invoices')
}

export async function deleteExpenses(ids: string[]) {
  await requireRole('admin')
  store.expenses = store.expenses.filter((e) => !ids.includes(e.id))
  revalidatePath('/expenses')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
}

export async function deletePayments(ids: string[]) {
  await requireRole('admin')
  const supabase = await createClient()

  // Get all payments to be deleted from Supabase
  const { data: dbPayments } = await supabase
    .from('payments')
    .select('*')
    .in('id', ids)

  const paymentsToDelete = dbPayments || []

  // Fallback to check in-memory store for any of the IDs that were not found in Supabase
  const foundDbIds = new Set(paymentsToDelete.map((p) => p.id))
  const missingIds = ids.filter((id) => !foundDbIds.has(id))
  
  for (const id of missingIds) {
    const storePay = store.payments.find((p) => p.id === id)
    if (storePay) {
      paymentsToDelete.push(storePay)
    }
  }

  if (paymentsToDelete.length > 0) {
    const affectedBookingIds = new Set<string>()
    for (const p of paymentsToDelete) {
      if (p.booking_id) affectedBookingIds.add(p.booking_id)
    }

    const dbIds = paymentsToDelete.filter((p) => foundDbIds.has(p.id)).map((p) => p.id)
    if (dbIds.length > 0) {
      await supabase.from('payments').delete().in('id', dbIds)
    }

    store.payments = store.payments.filter((p) => !ids.includes(p.id))

    for (const bookingId of affectedBookingIds) {
      await recalculateBookingPaidAmounts(bookingId)
    }
  }

  revalidatePath('/bookings')
  revalidatePath('/ledger')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
}
