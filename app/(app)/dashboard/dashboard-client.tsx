'use client'

import Link from 'next/link'
import {
  Banknote, TrendingUp, AlertCircle, Receipt, CalendarCheck, HardDrive, ArrowRight,
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { GlassCard, PageHeader, StatusPill } from '@/components/glass'
import { CountUp } from '@/components/count-up'
import { fmt } from '@/lib/currency'
import type { Booking, Role } from '@/lib/types'

const PIE_COLORS = ['#22d3ee', '#34d399', '#fbbf24', '#f87171', '#818cf8']

interface Kpis {
  totalRevenue: number
  totalProfit: number
  outstanding: number
  totalExpenses: number
  received: number
  bookingCount: number
  pdfBytesUsed: number
  exchangeRate: number
}

function KpiCard({
  icon: Icon, label, value, sub, tone = 'default', iconClassName,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  sub?: string
  tone?: 'default' | 'success' | 'warning' | 'primary'
  iconClassName?: string
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon
          className={`h-4 w-4 ${iconClassName || (tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : tone === 'primary' ? 'text-primary' : 'text-accent')}`}
          aria-hidden
        />
      </div>
      <p className="font-heading mt-2 text-xl font-semibold tabular">
        PKR <CountUp value={value} />
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </GlassCard>
  )
}

function paymentStatus(b: Booking): 'paid' | 'partial' | 'unpaid' {
  if (b.remaining_pkr <= 0) return 'paid'
  if (b.paid_pkr > 0) return 'partial'
  return 'unpaid'
}

export function DashboardClient({
  displayName, kpis, cashflow, expenseByType, recentBookings,
}: {
  displayName: string
  role: Role
  kpis: Kpis
  cashflow: { month: string; in_pkr: number; out_pkr: number }[]
  expenseByType: { type: string; amount: number }[]
  recentBookings: Booking[]
}) {
  const storagePct = Math.min(100, (kpis.pdfBytesUsed / (100 * 1024 * 1024)) * 100)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome back, ${displayName.split(' ')[0]}`}
        subtitle={`Business overview · 1 SAR = ${kpis.exchangeRate} PKR`}
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Banknote} label="Total Revenue" value={kpis.totalRevenue} sub={`${kpis.bookingCount} bookings`} tone="primary" />
        <KpiCard icon={TrendingUp} label="Total Profit" value={kpis.totalProfit} tone="success" />
        <KpiCard icon={AlertCircle} label="Outstanding" value={kpis.outstanding} tone="warning" sub={`Received ${fmt(kpis.received, 'PKR')}`} />
        <KpiCard icon={Receipt} label="Expenses" value={kpis.totalExpenses} tone="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Cashflow chart */}
        <GlassCard className="p-5">
          <h2 className="font-heading text-sm font-semibold">Cash In vs Out — last 6 months</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflow} barGap={4}>
                <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="month" tick={{ fill: '#8fa0b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#8fa0b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}K` : String(v))}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{
                    background: 'rgba(16,27,46,0.95)', border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: 12, fontSize: 12, color: '#e8ecf4',
                  }}
                  formatter={(value, name) => [
                    fmt(Number(value ?? 0), 'PKR'),
                    name === 'in_pkr' ? 'Received' : 'Spent',
                  ]}
                />
                <Bar dataKey="in_pkr" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar dataKey="out_pkr" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Expense breakdown */}
        <GlassCard className="p-5">
          <h2 className="font-heading text-sm font-semibold">Expenses by Type</h2>
          {expenseByType.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">No expenses yet.</p>
          ) : (
            <>
              <div className="mt-2 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByType} dataKey="amount" nameKey="type"
                      innerRadius={48} outerRadius={70} paddingAngle={3} strokeWidth={0}
                    >
                      {expenseByType.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(16,27,46,0.95)', border: '1px solid rgba(148,163,184,0.2)',
                        borderRadius: 12, fontSize: 12, color: '#e8ecf4',
                      }}
                      formatter={(value) => fmt(Number(value ?? 0), 'PKR')}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 flex flex-col gap-1.5">
                {expenseByType.map((e, i) => (
                  <li key={e.type} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} aria-hidden />
                      {e.type}
                    </span>
                    <span className="tabular">{fmt(e.amount, 'PKR')}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Recent bookings */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold">Recent Bookings</h2>
            <Link href="/bookings" className="flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
          <ul className="mt-3 flex flex-col">
            {recentBookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 border-b border-glass-border/50 py-2.5 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-sm">{b.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.booking_date} · {b.adult_count + b.child_count + b.infant_count} pax
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="tabular text-sm">{fmt(b.total_pkr, 'PKR')}</span>
                  <StatusPill status={paymentStatus(b)} />
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* Quick stats */}
        <div className="flex flex-col gap-4">
          <GlassCard className="p-5">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="font-heading text-sm font-semibold">Collection Progress</h2>
            </div>
            <p className="tabular mt-3 text-sm text-muted-foreground">
              {fmt(kpis.received, 'PKR')} of {fmt(kpis.received + kpis.outstanding, 'PKR')}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8" role="progressbar"
              aria-valuenow={Math.round((kpis.received / Math.max(1, kpis.received + kpis.outstanding)) * 100)}
              aria-valuemin={0} aria-valuemax={100} aria-label="Payment collection progress">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${(kpis.received / Math.max(1, kpis.received + kpis.outstanding)) * 100}%` }}
              />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="font-heading text-sm font-semibold">PDF Storage Used</h2>
            </div>
            <p className="tabular mt-3 text-sm text-muted-foreground">
              {(kpis.pdfBytesUsed / (1024 * 1024)).toFixed(1)} MB of 100 MB
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8" role="progressbar"
              aria-valuenow={Math.round(storagePct)} aria-valuemin={0} aria-valuemax={100}
              aria-label="PDF storage usage">
              <div
                className={`h-full rounded-full transition-all ${storagePct > 85 ? 'bg-danger' : storagePct > 60 ? 'bg-warning' : 'bg-accent'}`}
                style={{ width: `${storagePct}%` }}
              />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
