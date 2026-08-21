'use client'

import { useMemo, useState, useDeferredValue } from 'react'
import { Search } from 'lucide-react'
import { GlassCard, GlassInput, GlassSelect, PageHeader } from '@/components/glass'
import { fmt } from '@/lib/currency'
import { sumActivePayments } from '@/lib/payment-utils'
import type { Payment, PaymentMethod, Role } from '@/lib/types'

export function LedgerClient({ payments, role }: { payments: Payment[]; role: Role }) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all')

  const filtered = useMemo(
    () =>
      payments.filter((p) => {
        if (methodFilter !== 'all' && p.method !== methodFilter) return false
        const q = deferredQuery.trim().toLowerCase()
        return !q
          || (p.customer_name || '').toLowerCase().includes(q)
          || (p.note || '').toLowerCase().includes(q)
          || (p.void_note || '').toLowerCase().includes(q)
      }),
    [payments, deferredQuery, methodFilter],
  )

  const total = sumActivePayments(filtered)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payments Ledger"
        subtitle={`${filtered.length} receipts · ${fmt(total, 'PKR')} received`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <GlassInput
            className="pl-9"
            placeholder="Search customer or note…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search payments"
          />
        </div>
        <GlassSelect
          className="w-auto"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)}
          aria-label="Filter by method"
        >
          <option value="all">All methods</option>
          <option value="Cash">Cash</option>
          <option value="Bank">Bank</option>
          <option value="JazzCash">JazzCash</option>
          <option value="EasyPaisa">EasyPaisa</option>
        </GlassSelect>
      </div>

      <GlassCard className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="btn-gradient border-b border-glass-border text-left text-xs text-white">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No payments found.</td>
              </tr>
            )}
            {filtered.map((p) => {
              const voided = Boolean(p.voided)
              return (
                <tr
                  key={p.id}
                  className={`border-b border-glass-border/50 last:border-0 ${voided ? 'opacity-70' : 'hover:bg-white/[0.02]'}`}
                >
                  <td className="px-4 py-3 text-muted-foreground">{p.payment_date}</td>
                  <td className="px-4 py-3">{p.customer_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.method}</td>
                  <td className="px-4 py-3">
                    {voided ? (
                      <span className="text-xs font-medium text-danger">Voided</span>
                    ) : (
                      <span className="text-xs font-medium text-success">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.note || '—'}
                    {voided && p.void_note && (
                      <span className="mt-0.5 block text-xs text-danger">Void: {p.void_note}</span>
                    )}
                  </td>
                  <td className={`tabular px-4 py-3 text-right ${voided ? 'text-muted-foreground line-through' : 'text-success'}`}>
                    {fmt(p.amount_pkr, 'PKR')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </GlassCard>
    </div>
  )
}
