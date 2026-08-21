'use client'

import { useMemo, useState, useTransition, useDeferredValue } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import {
  GlassCard, GlassInput, GlassSelect, GlassButton, Field, PageHeader,
} from '@/components/glass'
import { GlassModal } from '@/components/overlay'
import { useToast } from '@/components/toast'
import { upsertExpense, deleteExpense, deleteExpenses } from '@/lib/actions'
import { fmt } from '@/lib/currency'
import { canWrite, isAdmin } from '@/lib/roles'
import type { Expense, ExpenseType, PaymentMethod, Role } from '@/lib/types'

const TYPES: ExpenseType[] = [
  'Umrah Supplier', 'Airline/Ticket', 'Hotel Supplier', 'Transport Supplier', 'Other Umrah Expense',
]
const METHODS: PaymentMethod[] = ['Cash', 'Bank', 'JazzCash', 'EasyPaisa']

const blank = (): Expense => ({
  id: '', expense_date: new Date().toISOString().slice(0, 10),
  expense_type: 'Umrah Supplier', supplier: '', amount_pkr: 0,
  method: 'Bank', note: '', booking_id: null, invoice_id: null,
})

export function ExpensesClient({
  role, expenses, bookings,
}: {
  role: Role
  expenses: Expense[]
  bookings: { id: string; customer_name: string }[]
}) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [typeFilter, setTypeFilter] = useState<'all' | ExpenseType>('all')
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleteFor, setDeleteFor] = useState<Expense | null>(null)
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  const filtered = useMemo(
    () =>
      expenses.filter((e) => {
        if (typeFilter !== 'all' && e.expense_type !== typeFilter) return false
        const q = deferredQuery.trim().toLowerCase()
        return !q || e.supplier.toLowerCase().includes(q) || e.note.toLowerCase().includes(q)
      }),
    [expenses, deferredQuery, typeFilter],
  )

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deletePending, startDeleteTransition] = useTransition()

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const isAllSelected = filtered.length > 0 && filtered.every((e) => selectedIds.includes(e.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((e) => e.id === id)))
    } else {
      const newSelected = [...selectedIds]
      filtered.forEach((e) => {
        if (!newSelected.includes(e.id)) {
          newSelected.push(e.id)
        }
      })
      setSelectedIds(newSelected)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected expense(s)?`)) return

    startDeleteTransition(async () => {
      await deleteExpenses(selectedIds)
      toast(`${selectedIds.length} expense(s) deleted`)
      setSelectedIds([])
    })
  }

  const total = filtered.reduce((s, e) => s + e.amount_pkr, 0)

  const set = <K extends keyof Expense>(k: K, v: Expense[K]) =>
    setEditing((e) => (e ? { ...e, [k]: v } : e))

  const submit = () => {
    if (!editing || !editing.supplier.trim() || editing.amount_pkr <= 0) {
      toast('Supplier and a positive amount are required', 'error')
      return
    }
    startTransition(async () => {
      await upsertExpense(editing)
      toast(editing.id ? 'Expense updated' : 'Expense added')
      setEditing(null)
    })
  }

  const submitDelete = () => {
    if (!deleteFor) return
    startTransition(async () => {
      await deleteExpense(deleteFor.id)
      toast('Expense deleted')
      setDeleteFor(null)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Expenses"
        subtitle={`${filtered.length} entries · ${fmt(total, 'PKR')} paid out`}
        actions={
          canWrite(role) ? (
            <GlassButton onClick={() => setEditing(blank())}>
              <Plus className="h-4 w-4" aria-hidden /> Add Expense
            </GlassButton>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <GlassInput
            className="pl-9"
            placeholder="Search supplier or note…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search expenses"
          />
        </div>
        <GlassSelect
          className="w-auto"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </GlassSelect>
      </div>

      {role === 'admin' && selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-white/5 border border-glass-border/30 rounded-lg px-4 py-2.5 text-xs text-muted-foreground mb-4">
          <span>{selectedIds.length} expense(s) selected</span>
          <button
            onClick={handleDeleteSelected}
            disabled={deletePending}
            className="px-2.5 py-1 rounded bg-danger text-white hover:bg-danger/85 cursor-pointer font-medium transition-colors disabled:opacity-50"
          >
            {deletePending ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
          </button>
        </div>
      )}

      <GlassCard className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="btn-gradient border-b border-glass-border text-left text-xs text-white">
              {role === 'admin' && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="cursor-pointer rounded border-glass-border bg-input focus:ring-ring h-4 w-4"
                  />
                </th>
              )}
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium">Linked Booking</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              {canWrite(role) && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={role === 'admin' ? 8 : 7} className="px-4 py-10 text-center text-muted-foreground">No expenses found.</td>
              </tr>
            )}
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-glass-border/50 last:border-0 hover:bg-white/[0.02]">
                {role === 'admin' && (
                  <td className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(e.id)}
                      onChange={() => toggleSelect(e.id)}
                      className="cursor-pointer rounded border-glass-border bg-input focus:ring-ring h-4 w-4"
                    />
                  </td>
                )}
                <td className="px-4 py-3 text-muted-foreground">{e.expense_date}</td>
                <td className="px-4 py-3">{e.expense_type}</td>
                <td className="px-4 py-3">{e.supplier}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {e.booking_id ? bookings.find((b) => b.id === e.booking_id)?.customer_name ?? '—' : '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{e.method}</td>
                <td className="tabular px-4 py-3 text-right text-danger">{fmt(e.amount_pkr, 'PKR')}</td>
                {canWrite(role) && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground cursor-pointer"
                        onClick={() => setEditing({ ...e })}
                        aria-label={`Edit expense for ${e.supplier}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {isAdmin(role) && (
                        <button
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger/15 hover:text-danger cursor-pointer"
                          onClick={() => setDeleteFor(e)}
                          aria-label={`Delete expense for ${e.supplier}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {/* Editor */}
      <GlassModal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Expense' : 'Add Expense'}>
        {editing && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <GlassInput type="date" value={editing.expense_date} onChange={(e) => set('expense_date', e.target.value)} />
              </Field>
              <Field label="Type">
                <GlassSelect value={editing.expense_type} onChange={(e) => set('expense_type', e.target.value as ExpenseType)}>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </GlassSelect>
              </Field>
              <Field label="Supplier">
                <GlassInput value={editing.supplier} onChange={(e) => set('supplier', e.target.value)} placeholder="Supplier name" />
              </Field>
              <Field label="Amount (PKR)">
                <GlassInput
                  type="number" min={0} value={editing.amount_pkr}
                  onChange={(e) => set('amount_pkr', Math.max(0, Number(e.target.value) || 0))}
                />
              </Field>
              <Field label="Method">
                <GlassSelect value={editing.method} onChange={(e) => set('method', e.target.value as PaymentMethod)}>
                  {METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </GlassSelect>
              </Field>
              <Field label="Linked Booking (optional)">
                <GlassSelect value={editing.booking_id ?? ''} onChange={(e) => set('booking_id', e.target.value || null)}>
                  <option value="">None</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>{b.customer_name}</option>
                  ))}
                </GlassSelect>
              </Field>
            </div>
            <Field label="Note">
              <GlassInput value={editing.note} onChange={(e) => set('note', e.target.value)} placeholder="Optional note" />
            </Field>
            <div className="flex justify-end gap-2">
              <GlassButton variant="ghost" onClick={() => setEditing(null)}>Cancel</GlassButton>
              <GlassButton onClick={submit} disabled={pending}>{pending ? 'Saving…' : 'Save Expense'}</GlassButton>
            </div>
          </div>
        )}
      </GlassModal>

      {/* Delete confirm */}
      <GlassModal open={!!deleteFor} onClose={() => setDeleteFor(null)} title="Delete expense?">
        <p className="text-sm text-muted-foreground">
          Permanently delete this {fmt(deleteFor?.amount_pkr ?? 0, 'PKR')} expense for{' '}
          <span className="text-foreground">{deleteFor?.supplier}</span>?
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
