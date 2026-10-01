'use client'

import { useMemo, useState } from 'react'
import { Download, FileJson } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { GlassButton, GlassCard, PageHeader } from '@/components/glass'
import { CountUp } from '@/components/count-up'
import { fmt } from '@/lib/currency'
import { isAdmin } from '@/lib/roles'
import {
  applyReportCurrency, buildReportsData, csvFromRows, reportsToCsvRows, type ReportsData,
} from '@/lib/report-data'
import type { Booking, Currency, Expense, Invoice, Payment, Role, Voucher } from '@/lib/types'

const PIE_COLORS = ['#22d3ee', '#34d399', '#fbbf24', '#f87171', '#818cf8', '#a78bfa']

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function Kpi({
  label, value, sub, currency = 'PKR', showCurrency = true,
}: {
  label: string
  value: number
  sub?: string
  currency?: Currency
  showCurrency?: boolean
}) {
  return (
    <GlassCard className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading mt-1 text-lg font-semibold tabular">
        {showCurrency ? fmt(value, currency) : <CountUp value={value} />}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </GlassCard>
  )
}

function ChartCard({ title, children, onExport }: { title: string; children: React.ReactNode; onExport?: () => void }) {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-semibold">{title}</h2>
        {onExport && (
          <button type="button" onClick={onExport} className="text-xs text-primary hover:underline">
            Export
          </button>
        )}
      </div>
      {children}
    </GlassCard>
  )
}

export function ReportsClient({
  role, bookings, payments, invoices, expenses, vouchers, exchangeRate,
}: {
  role: Role
  bookings: Booking[]
  payments: Payment[]
  invoices: Invoice[]
  expenses: Expense[]
  vouchers: Voucher[]
  exchangeRate: number
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currency, setCurrency] = useState<Currency>('PKR')

  const baseData: ReportsData = useMemo(
    () => buildReportsData({
      bookings, payments, invoices, expenses, vouchers, exchangeRate,
      dateFrom, dateTo,
    }),
    [bookings, payments, invoices, expenses, vouchers, exchangeRate, dateFrom, dateTo],
  )

  const data = useMemo(
    () => applyReportCurrency(baseData, currency),
    [baseData, currency],
  )

  const stamp = today

  const exportJson = () => {
    downloadText(JSON.stringify(data, null, 2), `crm-report-${stamp}-${currency}.json`, 'application/json')
  }

  const exportAllCsv = () => {
    downloadText(csvFromRows(reportsToCsvRows(data)), `crm-report-${stamp}-${currency}.csv`, 'text/csv')
  }

  const exportSummaryCsv = () => {
    const cur = data.displayCurrency ?? 'PKR'
    downloadText(csvFromRows([
      { metric: 'Currency', value: cur },
      { metric: 'Total Revenue', value: data.summary.totalRevenue },
      { metric: 'Total Profit', value: data.summary.totalProfit },
      { metric: 'Total Received', value: data.summary.totalReceived },
      { metric: 'Total Expenses', value: data.summary.totalExpenses },
      { metric: 'Outstanding', value: data.summary.outstanding },
      { metric: 'Net Cash', value: data.summary.netCash },
      { metric: 'Bookings', value: data.summary.bookingCount },
    ]), `crm-summary-${stamp}-${currency}.csv`, 'text/csv')
  }

  const tooltipFmt = (value: number | string | undefined) => fmt(Number(value ?? 0), currency)

  const setPreset = (preset: 'all' | 'ytd' | 'month') => {
    const now = new Date()
    if (preset === 'all') {
      setDateFrom('')
      setDateTo('')
      return
    }
    if (preset === 'ytd') {
      setDateFrom(`${now.getFullYear()}-01-01`)
      setDateTo(today)
      return
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    setDateFrom(start.toISOString().slice(0, 10))
    setDateTo(today)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        subtitle={`Analytics & exports · 1 SAR = ${exchangeRate} PKR`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-glass-border bg-white/4 p-0.5">
              {(['PKR', 'SAR'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    currency === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <GlassButton variant="ghost" className="text-xs" onClick={exportSummaryCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Summary CSV
            </GlassButton>
            <GlassButton variant="ghost" className="text-xs" onClick={exportAllCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Export All CSV
            </GlassButton>
            <GlassButton variant="ghost" className="text-xs" onClick={exportJson}>
              <FileJson className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Export JSON
            </GlassButton>
          </div>
        }
      />

      <GlassCard className="flex flex-wrap items-end gap-3 p-4">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">From</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-glass-border bg-white/4 px-3 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">To</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-glass-border bg-white/4 px-3 py-1.5 text-sm" />
        </label>
        <div className="flex gap-2">
          <GlassButton variant="ghost" className="text-xs" onClick={() => setPreset('all')}>All time</GlassButton>
          <GlassButton variant="ghost" className="text-xs" onClick={() => setPreset('ytd')}>Year to date</GlassButton>
          <GlassButton variant="ghost" className="text-xs" onClick={() => setPreset('month')}>This month</GlassButton>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total Revenue" value={data.summary.totalRevenue} currency={currency} sub={`${data.summary.bookingCount} bookings`} />
        {isAdmin(role) && <Kpi label="Total Profit" value={data.summary.totalProfit} currency={currency} />}
        <Kpi label="Received" value={data.summary.totalReceived} currency={currency} />
        {isAdmin(role) && <Kpi label="Expenses" value={data.summary.totalExpenses} currency={currency} />}
        <Kpi label="Outstanding" value={data.summary.outstanding} currency={currency} />
        <Kpi label="Net Cash" value={data.summary.netCash} currency={currency} />
        <Kpi label="Invoices" value={data.summary.invoiceCount} showCurrency={false} />
        <Kpi label="Vouchers" value={data.summary.voucherCount} showCurrency={false} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue & Profit Trend" onExport={() => downloadText(csvFromRows(data.monthlyRevenue.map((m) => ({ month: m.month, revenue: m.revenue, profit: m.profit, bookings: m.bookings }))), `revenue-trend-${stamp}-${currency}.csv`, 'text/csv')}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyRevenue}>
                <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="month" tick={{ fill: '#8fa0b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8fa0b8', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}K` : String(v))} />
                <Tooltip contentStyle={{ background: 'rgba(16,27,46,0.95)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, fontSize: 12, color: '#e8ecf4' }}
                  formatter={(value, name) => [tooltipFmt(Number(value)), name === 'revenue' ? 'Revenue' : 'Profit']} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2} dot={false} />
                {isAdmin(role) && <Line type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={2} dot={false} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Cash In vs Out — last 6 months" onExport={() => downloadText(csvFromRows(data.monthlyCashflow.map((m) => ({ month: m.month, received: m.in_pkr, spent: m.out_pkr }))), `cashflow-${stamp}-${currency}.csv`, 'text/csv')}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyCashflow} barGap={4}>
                <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="month" tick={{ fill: '#8fa0b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8fa0b8', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}K` : String(v))} />
                <Tooltip contentStyle={{ background: 'rgba(16,27,46,0.95)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, fontSize: 12, color: '#e8ecf4' }}
                  formatter={(value, name) => [tooltipFmt(Number(value)), name === 'in_pkr' ? 'Received' : 'Spent']} />
                <Bar dataKey="in_pkr" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar dataKey="out_pkr" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {isAdmin(role) && data.expenseByType.length > 0 && (
          <ChartCard title="Expenses by Type">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.expenseByType} dataKey="amount" nameKey="type" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                    {data.expenseByType.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(16,27,46,0.95)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, fontSize: 12, color: '#e8ecf4' }}
                    formatter={(value) => tooltipFmt(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {data.paymentsByMethod.length > 0 && (
          <ChartCard title="Payments by Method">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.paymentsByMethod} dataKey="amount" nameKey="method" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                    {data.paymentsByMethod.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(16,27,46,0.95)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, fontSize: 12, color: '#e8ecf4' }}
                    formatter={(value) => tooltipFmt(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {data.paymentStatus.length > 0 && (
          <ChartCard title="Booking Payment Status">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.paymentStatus} dataKey="count" nameKey="status" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                    {data.paymentStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(16,27,46,0.95)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, fontSize: 12, color: '#e8ecf4' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue by Airline">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByAirline} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid horizontal={false} stroke="rgba(148,163,184,0.12)" />
                <XAxis type="number" tick={{ fill: '#8fa0b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="airline" width={90} tick={{ fill: '#8fa0b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(16,27,46,0.95)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, fontSize: 12, color: '#e8ecf4' }}
                  formatter={(value) => tooltipFmt(Number(value))} />
                <Bar dataKey="revenue" fill="#818cf8" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Invoice Trend">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.invoiceTrend}>
                <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="month" tick={{ fill: '#8fa0b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#8fa0b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8fa0b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(16,27,46,0.95)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, fontSize: 12, color: '#e8ecf4' }}
                  formatter={(value, name) => [name === 'amount' ? tooltipFmt(Number(value)) : value, name === 'amount' ? 'Amount' : 'Count']} />
                <Bar yAxisId="left" dataKey="amount" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar yAxisId="right" dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="font-heading text-sm font-semibold">Top Customers by Revenue</h2>
          <ul className="mt-3 flex flex-col">
            {data.topCustomers.map((c) => (
              <li key={c.customer} className="flex items-center justify-between gap-3 border-b border-glass-border/50 py-2.5 last:border-0">
                <div>
                  <p className="text-sm">{c.customer}</p>
                  <p className="text-xs text-muted-foreground">{c.bookings} booking{c.bookings !== 1 ? 's' : ''}</p>
                </div>
                <span className="tabular text-sm">{fmt(c.revenue, currency)}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="font-heading text-sm font-semibold">Bookings Detail</h2>
          <div className="mt-3 max-h-80 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="pb-2 pr-2">Date</th>
                  <th className="pb-2 pr-2">Customer</th>
                  <th className="pb-2 pr-2">Total</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.bookingRows.map((b) => (
                  <tr key={b.id} className="border-t border-glass-border/40">
                    <td className="py-2 pr-2 tabular">{b.date}</td>
                    <td className="py-2 pr-2">{b.customer}</td>
                    <td className="py-2 pr-2 tabular">{fmt(b.total, currency)}</td>
                    <td className="py-2">{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
