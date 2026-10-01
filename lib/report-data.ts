import type { Booking, Currency, Expense, Invoice, Payment, Voucher } from './types'
import { fromPkr } from './currency'
import { isPaymentActive, sumActivePayments } from './payment-utils'

export interface ReportsData {
  exchangeRate: number
  generatedAt: string
  displayCurrency?: Currency
  dateFrom: string
  dateTo: string
  summary: {
    bookingCount: number
    invoiceCount: number
    voucherCount: number
    totalRevenue: number
    totalProfit: number
    totalExpenses: number
    totalReceived: number
    outstanding: number
    netCash: number
  }
  monthlyCashflow: { month: string; key: string; in_pkr: number; out_pkr: number }[]
  monthlyRevenue: { month: string; key: string; revenue: number; profit: number; bookings: number }[]
  expenseByType: { type: string; amount: number }[]
  paymentsByMethod: { method: string; amount: number }[]
  paymentStatus: { status: string; count: number }[]
  revenueByAirline: { airline: string; revenue: number; bookings: number }[]
  invoiceTrend: { month: string; key: string; count: number; amount: number }[]
  topCustomers: { customer: string; revenue: number; bookings: number }[]
  bookingRows: {
    id: string
    date: string
    customer: string
    airline: string
    total: number
    paid: number
    remaining: number
    status: string
  }[]
}

function inDateRange(date: string, from: string, to: string): boolean {
  if (from && date < from) return false
  if (to && date > to) return false
  return true
}

function monthBuckets(count = 6) {
  const months: { key: string; label: string }[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    months.push({
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleString('en-US', { month: 'short' }),
    })
  }
  return months
}

function bookingStatus(b: Booking): string {
  if (b.remaining_pkr <= 0) return 'Paid'
  if (b.paid_pkr > 0) return 'Partial'
  return 'Unpaid'
}

export function buildReportsData(input: {
  bookings: Booking[]
  payments: Payment[]
  invoices: Invoice[]
  expenses: Expense[]
  vouchers: Voucher[]
  exchangeRate: number
  dateFrom?: string
  dateTo?: string
}): ReportsData {
  const dateFrom = input.dateFrom ?? ''
  const dateTo = input.dateTo ?? ''
  const bookings = input.bookings.filter((b) => inDateRange(b.booking_date, dateFrom, dateTo))
  const payments = input.payments.filter(
    (p) => isPaymentActive(p) && inDateRange(p.payment_date, dateFrom, dateTo),
  )
  const expenses = input.expenses.filter((e) => inDateRange(e.expense_date, dateFrom, dateTo))
  const invoices = input.invoices.filter((i) => inDateRange(i.invoice_date, dateFrom, dateTo))
  const vouchers = input.vouchers.filter((v) => inDateRange(v.voucher_date, dateFrom, dateTo))

  const bookingRevenue = bookings.reduce((s, b) => s + b.total_pkr, 0)
  const invoiceRevenue = invoices.reduce((s, i) => s + i.total_pkr, 0)
  const totalRevenue = bookingRevenue + invoiceRevenue
  const totalProfit = bookings.reduce((s, b) => s + b.profit_pkr, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount_pkr, 0)
  const totalReceived = sumActivePayments(payments)
  const outstanding = bookings.reduce((s, b) => s + b.remaining_pkr, 0)

  const months = monthBuckets(6)
  const monthlyCashflow = months.map(({ key, label }) => ({
    month: label,
    key,
    in_pkr: payments.filter((p) => p.payment_date.startsWith(key)).reduce((s, p) => s + p.amount_pkr, 0),
    out_pkr: expenses.filter((e) => e.expense_date.startsWith(key)).reduce((s, e) => s + e.amount_pkr, 0),
  }))

  const monthlyRevenue = months.map(({ key, label }) => {
    const monthBookings = bookings.filter((b) => b.booking_date.startsWith(key))
    return {
      month: label,
      key,
      revenue: monthBookings.reduce((s, b) => s + b.total_pkr, 0),
      profit: monthBookings.reduce((s, b) => s + b.profit_pkr, 0),
      bookings: monthBookings.length,
    }
  })

  const expenseByType = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.expense_type] = (acc[e.expense_type] ?? 0) + e.amount_pkr
      return acc
    }, {}),
  ).map(([type, amount]) => ({ type, amount }))

  const paymentsByMethod = Object.entries(
    payments.reduce<Record<string, number>>((acc, p) => {
      acc[p.method] = (acc[p.method] ?? 0) + p.amount_pkr
      return acc
    }, {}),
  ).map(([method, amount]) => ({ method, amount }))

  const paymentStatusMap = bookings.reduce<Record<string, number>>((acc, b) => {
    const s = bookingStatus(b)
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})
  const paymentStatus = Object.entries(paymentStatusMap).map(([status, count]) => ({ status, count }))

  const revenueByAirline = Object.entries(
    bookings.reduce<Record<string, { revenue: number; bookings: number }>>((acc, b) => {
      const cur = acc[b.airline_name] ?? { revenue: 0, bookings: 0 }
      cur.revenue += b.total_pkr
      cur.bookings += 1
      acc[b.airline_name] = cur
      return acc
    }, {}),
  )
    .map(([airline, v]) => ({ airline, ...v }))
    .sort((a, b) => b.revenue - a.revenue)

  const invoiceTrend = months.map(({ key, label }) => {
    const monthInvoices = invoices.filter((i) => i.invoice_date.startsWith(key))
    return {
      month: label,
      key,
      count: monthInvoices.length,
      amount: monthInvoices.reduce((s, i) => s + i.total_pkr, 0),
    }
  })

  const topCustomers = Object.entries(
    bookings.reduce<Record<string, { revenue: number; bookings: number }>>((acc, b) => {
      const cur = acc[b.customer_name] ?? { revenue: 0, bookings: 0 }
      cur.revenue += b.total_pkr
      cur.bookings += 1
      acc[b.customer_name] = cur
      return acc
    }, {}),
  )
    .map(([customer, v]) => ({ customer, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const bookingRows = [...bookings]
    .sort((a, b) => b.booking_date.localeCompare(a.booking_date))
    .slice(0, 50)
    .map((b) => ({
      id: b.id,
      date: b.booking_date,
      customer: b.customer_name,
      airline: b.airline_name,
      total: b.total_pkr,
      paid: b.paid_pkr,
      remaining: b.remaining_pkr,
      status: bookingStatus(b),
    }))

  return {
    exchangeRate: input.exchangeRate,
    generatedAt: new Date().toISOString(),
    dateFrom,
    dateTo,
    summary: {
      bookingCount: bookings.length,
      invoiceCount: invoices.length,
      voucherCount: vouchers.length,
      totalRevenue,
      totalProfit,
      totalExpenses,
      totalReceived,
      outstanding,
      netCash: totalReceived - totalExpenses,
    },
    monthlyCashflow,
    monthlyRevenue,
    expenseByType,
    paymentsByMethod,
    paymentStatus,
    revenueByAirline,
    invoiceTrend,
    topCustomers,
    bookingRows,
  }
}

function convertAmount(pkr: number, currency: Currency, rate: number): number {
  return fromPkr(pkr, currency, rate)
}

/** Convert all PKR aggregates to the selected display currency. */
export function applyReportCurrency(data: ReportsData, currency: Currency): ReportsData {
  if (currency === 'PKR') return { ...data, displayCurrency: 'PKR' }
  const rate = data.exchangeRate
  const c = (n: number) => convertAmount(n, currency, rate)

  return {
    ...data,
    displayCurrency: currency,
    summary: {
      ...data.summary,
      totalRevenue: c(data.summary.totalRevenue),
      totalProfit: c(data.summary.totalProfit),
      totalExpenses: c(data.summary.totalExpenses),
      totalReceived: c(data.summary.totalReceived),
      outstanding: c(data.summary.outstanding),
      netCash: c(data.summary.netCash),
    },
    monthlyCashflow: data.monthlyCashflow.map((m) => ({
      ...m,
      in_pkr: c(m.in_pkr),
      out_pkr: c(m.out_pkr),
    })),
    monthlyRevenue: data.monthlyRevenue.map((m) => ({
      ...m,
      revenue: c(m.revenue),
      profit: c(m.profit),
    })),
    expenseByType: data.expenseByType.map((e) => ({ ...e, amount: c(e.amount) })),
    paymentsByMethod: data.paymentsByMethod.map((p) => ({ ...p, amount: c(p.amount) })),
    revenueByAirline: data.revenueByAirline.map((a) => ({ ...a, revenue: c(a.revenue) })),
    invoiceTrend: data.invoiceTrend.map((i) => ({ ...i, amount: c(i.amount) })),
    topCustomers: data.topCustomers.map((t) => ({ ...t, revenue: c(t.revenue) })),
    bookingRows: data.bookingRows.map((b) => ({
      ...b,
      total: c(b.total),
      paid: c(b.paid),
      remaining: c(b.remaining),
    })),
  }
}

export function csvFromRows(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = rows.map((row) =>
    headers.map((h) => {
      const v = row[h]
      const s = String(v ?? '')
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
    }).join(','),
  )
  return [headers.join(','), ...lines].join('\n')
}

export function reportsToCsvRows(data: ReportsData): Record<string, string | number>[] {
  const cur = data.displayCurrency ?? 'PKR'
  const rows: Record<string, string | number>[] = [
    { section: 'Summary', metric: 'Currency', value: cur },
    { section: 'Summary', metric: 'Exchange Rate', value: data.exchangeRate },
    { section: 'Summary', metric: 'Total Revenue', value: data.summary.totalRevenue },
    { section: 'Summary', metric: 'Total Profit', value: data.summary.totalProfit },
    { section: 'Summary', metric: 'Total Received', value: data.summary.totalReceived },
    { section: 'Summary', metric: 'Total Expenses', value: data.summary.totalExpenses },
    { section: 'Summary', metric: 'Outstanding', value: data.summary.outstanding },
    { section: 'Summary', metric: 'Net Cash', value: data.summary.netCash },
    { section: 'Summary', metric: 'Bookings', value: data.summary.bookingCount },
    { section: 'Summary', metric: 'Invoices', value: data.summary.invoiceCount },
    { section: 'Summary', metric: 'Vouchers', value: data.summary.voucherCount },
  ]
  for (const m of data.monthlyCashflow) {
    rows.push({ section: 'Cashflow', month: m.month, received: m.in_pkr, spent: m.out_pkr })
  }
  for (const m of data.monthlyRevenue) {
    rows.push({ section: 'Revenue', month: m.month, revenue: m.revenue, profit: m.profit, bookings: m.bookings })
  }
  for (const e of data.expenseByType) {
    rows.push({ section: 'Expenses', type: e.type, amount: e.amount })
  }
  for (const b of data.bookingRows) {
    rows.push({
      section: 'Bookings',
      date: b.date,
      customer: b.customer,
      airline: b.airline,
      total: b.total,
      paid: b.paid,
      remaining: b.remaining,
      status: b.status,
    })
  }
  return rows
}
