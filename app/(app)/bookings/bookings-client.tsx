'use client'

import { useMemo, useState, useTransition, useRef, useEffect, useDeferredValue } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Wallet, ChevronDown } from 'lucide-react'
import {
  GlassCard, GlassInput, GlassSelect, GlassButton, Field, PageHeader, StatusPill,
} from '@/components/glass'
import { GlassModal } from '@/components/overlay'
import { useToast } from '@/components/toast'
import { addPayment, deleteBooking, deleteBookings } from '@/lib/actions'
import { fmt } from '@/lib/currency'
import { canWrite, isAdmin } from '@/lib/roles'
import type { Booking, Payment, PaymentMethod, Role } from '@/lib/types'

const METHODS: PaymentMethod[] = ['Cash', 'Bank', 'JazzCash', 'EasyPaisa']

function paymentStatus(b: Booking): 'paid' | 'partial' | 'unpaid' {
  const remaining = b.remaining_pkr || 0
  const paid = b.paid_pkr || 0
  if (remaining <= 0) return 'paid'
  if (paid > 0) return 'partial'
  return 'unpaid'
}

export function BookingsClient({
  role, bookings, payments,
}: {
  role: Role
  bookings: Booking[]
  payments: Payment[]
  exchangeRate: number
}) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all')
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [payFor, setPayFor] = useState<Booking | null>(null)
  const [deleteFor, setDeleteFor] = useState<Booking | null>(null)
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<PaymentMethod>('Bank')
  const [note, setNote] = useState('')
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  const filtered = useMemo(
    () =>
      bookings.filter((b) => {
        if (!b || !b.customer_name) return false
        if (statusFilter !== 'all' && paymentStatus(b) !== statusFilter) return false
        const q = deferredQuery.trim().toLowerCase()
        if (!q) return true
        return (
          (b.customer_name || '').toLowerCase().includes(q) ||
          (b.airline_name || '').toLowerCase().includes(q) ||
          (b.makkah_hotel_name || '').toLowerCase().includes(q) ||
          (b.madinah_hotel_name || '').toLowerCase().includes(q)
        )
      }),
    [bookings, deferredQuery, statusFilter],
  )

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deletePending, startDeleteTransition] = useTransition()

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const isAllSelected = filtered.length > 0 && filtered.every((b) => selectedIds.includes(b.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((b) => b.id === id)))
    } else {
      const newSelected = [...selectedIds]
      filtered.forEach((b) => {
        if (!newSelected.includes(b.id)) {
          newSelected.push(b.id)
        }
      })
      setSelectedIds(newSelected)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected booking(s)?`)) return

    startDeleteTransition(async () => {
      await deleteBookings(selectedIds)
      toast(`${selectedIds.length} booking(s) deleted`)
      setSelectedIds([])
    })
  }

  const submitPayment = () => {
    if (!payFor || amount <= 0) return
    startTransition(async () => {
      await addPayment({ booking_id: payFor.id, amount_pkr: amount, method, note })
      toast('Payment recorded')
      setPayFor(null)
      setAmount(0)
      setNote('')
    })
  }

  const submitDelete = () => {
    if (!deleteFor) return
    startTransition(async () => {
      await deleteBooking(deleteFor.id)
      toast('Booking deleted')
      setDeleteFor(null)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bookings"
        subtitle={`${bookings.length} bookings · ${fmt(bookings.reduce((s, b) => s + (b?.remaining_pkr || 0), 0), 'PKR')} outstanding`}
        actions={
          canWrite(role) ? (
            <Link href="/calculator">
              <GlassButton className='rounded-full'>
                <Plus className="h-4 w-4" aria-hidden /> New Booking
              </GlassButton>
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <GlassInput
            className="pl-9 rounded-full"
            placeholder="Search customer, airline, hotel…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search bookings"
          />
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className="flex items-center justify-between gap-2 rounded-full bg-input border border-glass-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer min-w-32"
          >
            <span>
              {statusFilter === 'all' && 'All statuses'}
              {statusFilter === 'paid' && 'Paid'}
              {statusFilter === 'partial' && 'Partial'}
              {statusFilter === 'unpaid' && 'Unpaid'}
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" aria-hidden />
          </button>
          {statusDropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 min-w-36 rounded-lg border border-glass-border bg-[#101b2e] p-1 shadow-lg glass">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all')
                  setStatusDropdownOpen(false)
                }}
                className={`w-full text-left rounded-md px-3 py-1.5 text-sm cursor-pointer hover:bg-white/5 transition-colors ${statusFilter === 'all' ? 'text-primary font-medium' : 'text-foreground'}`}
              >
                All statuses
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('paid')
                  setStatusDropdownOpen(false)
                }}
                className={`w-full text-left rounded-md px-3 py-1.5 text-sm cursor-pointer hover:bg-white/5 transition-colors ${statusFilter === 'paid' ? 'text-primary font-medium' : 'text-foreground'}`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('partial')
                  setStatusDropdownOpen(false)
                }}
                className={`w-full text-left rounded-md px-3 py-1.5 text-sm cursor-pointer hover:bg-white/5 transition-colors ${statusFilter === 'partial' ? 'text-primary font-medium' : 'text-foreground'}`}
              >
                Partial
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('unpaid')
                  setStatusDropdownOpen(false)
                }}
                className={`w-full text-left rounded-md px-3 py-1.5 text-sm cursor-pointer hover:bg-white/5 transition-colors ${statusFilter === 'unpaid' ? 'text-primary font-medium' : 'text-foreground'}`}
              >
                Unpaid
              </button>
            </div>
          )}
        </div>
      </div>

      {role === 'admin' && filtered.length > 0 && (
        <div className="flex items-center justify-between bg-white/5 border border-glass-border/30 rounded-lg px-4 py-2.5 text-xs text-muted-foreground">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="cursor-pointer rounded border-glass-border bg-input focus:ring-ring h-4 w-4"
            />
            <span>Select All ({filtered.length} shown)</span>
          </label>
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deletePending}
              className="px-2.5 py-1 rounded bg-danger text-white hover:bg-danger/85 cursor-pointer font-medium transition-colors disabled:opacity-50"
            >
              {deletePending ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <GlassCard className="p-10 text-center text-sm text-muted-foreground">
            No bookings match your filters.
          </GlassCard>
        )}
        {filtered.map((b) => {
          if (!b) return null
          const isOpen = expanded === b.id
          const bookingPayments = payments.filter((p) => p && p.booking_id === b.id)
          return (
            <GlassCard key={b.id} className="overflow-hidden">
              <div className="flex items-center">
                {role === 'admin' && (
                  <div className="pl-4 shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(b.id)}
                      onChange={() => toggleSelect(b.id)}
                      className="cursor-pointer rounded border-glass-border bg-input focus:ring-ring h-4 w-4"
                    />
                  </div>
                )}
                <button
                  className="flex-1 flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-left cursor-pointer hover:bg-white/[0.03] transition-colors"
                  onClick={() => setExpanded(isOpen ? null : b.id)}
                  aria-expanded={isOpen}
                >
                  <div className="min-w-40 flex-1">
                    <p className="text-sm font-medium">{b.customer_name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {b.booking_date} · {b.adult_count}A {b.child_count}C {b.infant_count}I
                      {b.airline_name ? ` · ${b.airline_name}` : ''}
                    </p>
                  </div>
                  <div className="hidden text-xs text-muted-foreground md:block">
                    {b.makkah_hotel_name && <p>Makkah: {b.makkah_hotel_name} ({b.makkah_nights}n {b.makkah_room_type})</p>}
                    {b.madinah_hotel_name && <p>Madinah: {b.madinah_hotel_name} ({b.madinah_nights}n {b.madinah_room_type})</p>}
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm font-medium">{fmt(b.total_pkr, 'PKR')}</p>
                    <p className="tabular mt-0.5 text-xs text-muted-foreground">
                      Remaining {fmt(b.remaining_pkr, 'PKR')}
                    </p>
                  </div>
                  <StatusPill status={paymentStatus(b)} />
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-glass-border p-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">Payment history</h3>
                      {bookingPayments.length === 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">No payments recorded.</p>
                      ) : (
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {bookingPayments.map((p) => (
                            <li key={p.id} className="flex items-center justify-between gap-4 text-xs">
                              <span className="text-muted-foreground">
                                {p.payment_date} · {p.method}
                                {p.note ? ` · ${p.note}` : ''}
                              </span>
                              <span className="tabular">{fmt(p.amount_pkr, 'PKR')}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-3 flex items-center justify-between border-t border-glass-border pt-2 text-xs">
                        <span className="text-muted-foreground">
                          Paid {fmt(b.paid_pkr, 'PKR')} · Profit {fmt(b.profit_pkr, 'PKR')}
                        </span>
                      </div>
                    </div>
                    {canWrite(role) && (
                      <div className="flex flex-wrap items-start gap-2">
                        <GlassButton variant="secondary" onClick={() => { setPayFor(b); setAmount(b.remaining_pkr) }}>
                          <Wallet className="h-3.5 w-3.5" aria-hidden /> Add Payment
                        </GlassButton>
                        {b.calc_state && (
                          <Link href={`/calculator?booking=${b.id}`}>
                            <GlassButton variant="secondary">
                              <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit Package
                            </GlassButton>
                          </Link>
                        )}
                        {isAdmin(role) && (
                          <GlassButton variant="destructive" onClick={() => setDeleteFor(b)}>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                          </GlassButton>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </GlassCard>
          )
        })}
      </div>

      {/* Add payment modal */}
      <GlassModal open={!!payFor} onClose={() => setPayFor(null)} title={`Add Payment — ${payFor?.customer_name ?? ''}`}>
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground tabular">
            Remaining balance: {payFor ? fmt(payFor.remaining_pkr, 'PKR') : ''}
          </p>
          <Field label="Amount (PKR)">
            <GlassInput
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            />
          </Field>
          <Field label="Method">
            <GlassSelect value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </GlassSelect>
          </Field>
          <Field label="Note">
            <GlassInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 2nd installment" />
          </Field>
          <div className="flex justify-end gap-2">
            <GlassButton variant="ghost" onClick={() => setPayFor(null)}>Cancel</GlassButton>
            <GlassButton onClick={submitPayment} disabled={pending || amount <= 0}>
              {pending ? 'Saving…' : 'Record Payment'}
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* Delete confirm */}
      <GlassModal open={!!deleteFor} onClose={() => setDeleteFor(null)} title="Delete booking?">
        <p className="text-sm text-muted-foreground">
          This permanently removes <span className="text-foreground">{deleteFor?.customer_name}</span> and all linked payments.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <GlassButton variant="ghost" onClick={() => setDeleteFor(null)}>Cancel</GlassButton>
          <GlassButton variant="destructive" onClick={submitDelete} disabled={pending}>
            {pending ? 'Deleting…' : 'Delete'}
          </GlassButton>
        </div>
      </GlassModal>
    </div>
  )
}
