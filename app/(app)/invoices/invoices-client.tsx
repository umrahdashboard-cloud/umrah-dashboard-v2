'use client'

import { useMemo, useState, useTransition, useDeferredValue } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil, FileDown, Search } from 'lucide-react'
import {
  GlassCard, GlassInput, GlassSelect, GlassButton, Field, PageHeader,
} from '@/components/glass'
import { GlassModal } from '@/components/overlay'
import { useToast } from '@/components/toast'
import { saveInvoice, deleteInvoice, deleteInvoices, trackPdfBytes } from '@/lib/actions'
import { fmt, toPkr } from '@/lib/currency'
import { canWrite, isAdmin } from '@/lib/roles'
import { downloadInvoicePdf } from '@/lib/pdf/invoice-pdf'
import { isCalculatorInvoice } from '@/lib/invoice-calc'
import type { Booking, BrandingSettings, Currency, Invoice, InvoiceLine, Role } from '@/lib/types'

const emptyLine = (currency: Currency): InvoiceLine => ({
  id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  description: '', mode: 'pax', unit_price: 0, count: 1, currency,
})

export function InvoicesClient({
  role, invoices, bookings, exchangeRate, branding,
}: {
  role: Role
  invoices: Invoice[]
  bookings: Booking[]
  exchangeRate: number
  branding: BrandingSettings
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [editing, setEditing] = useState<Invoice | null | 'new'>(null)
  const [customer, setCustomer] = useState('')
  const [lines, setLines] = useState<InvoiceLine[]>([])
  const [deleteFor, setDeleteFor] = useState<Invoice | null>(null)
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  // Currency lock: first line's currency decides the invoice currency
  const lockedCurrency: Currency | null = lines.length > 0 ? lines[0].currency : null

  const filtered = useMemo(
    () => invoices.filter((v) => v.customer_name.toLowerCase().includes(deferredQuery.trim().toLowerCase())),
    [invoices, deferredQuery],
  )

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deletePending, startDeleteTransition] = useTransition()

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const isAllSelected = filtered.length > 0 && filtered.every((inv) => selectedIds.includes(inv.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((inv) => inv.id === id)))
    } else {
      const newSelected = [...selectedIds]
      filtered.forEach((inv) => {
        if (!newSelected.includes(inv.id)) {
          newSelected.push(inv.id)
        }
      })
      setSelectedIds(newSelected)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected invoice(s)?`)) return

    startDeleteTransition(async () => {
      await deleteInvoices(selectedIds)
      toast(`${selectedIds.length} invoice(s) deleted`)
      setSelectedIds([])
    })
  }

  const openEditor = (inv: Invoice | 'new') => {
    if (inv !== 'new' && isCalculatorInvoice(inv, bookings)) {
      router.push(`/calculator?invoice=${inv.id}`)
      return
    }
    if (inv === 'new') {
      setCustomer('')
      setLines([emptyLine('PKR')])
    } else {
      setCustomer(inv.customer_name)
      setLines(inv.lines.map((l) => ({ ...l })))
    }
    setEditing(inv)
  }

  const setLine = (id: string, patch: Partial<InvoiceLine>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))

  const total_pkr = lines.reduce((s, l) => s + toPkr(l.unit_price * l.count, l.currency, exchangeRate), 0)

  const submit = () => {
    const valid = lines.filter((l) => l.description.trim() && l.unit_price > 0 && l.count > 0)
    if (!customer.trim() || valid.length === 0) {
      toast('Add a customer name and at least one complete line', 'error')
      return
    }
    startTransition(async () => {
      await saveInvoice({
        id: editing !== 'new' && editing ? editing.id : null,
        customer_name: customer.trim(),
        lines: valid,
      })
      toast(editing === 'new' ? 'Invoice created' : 'Invoice updated')
      setEditing(null)
    })
  }

  const submitDelete = () => {
    if (!deleteFor) return
    startTransition(async () => {
      await deleteInvoice(deleteFor.id)
      toast('Invoice deleted')
      setDeleteFor(null)
    })
  }

  const onDownload = (inv: Invoice) => {
    startTransition(async () => {
      const bytes = await downloadInvoicePdf(inv, branding, exchangeRate)
      await trackPdfBytes(bytes)
      toast('PDF downloaded')
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} invoices issued`}
        actions={
          canWrite(role) ? (
            <GlassButton className='rounded-full' onClick={() => openEditor('new')}>
              <Plus className="h-4 w-4 " aria-hidden /> New Invoice
            </GlassButton>
          ) : undefined
        }
      />

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <GlassInput
          className="pl-9 rounded-full"
          placeholder="Search customer…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search invoices"
        />
      </div>

      {role === 'admin' && selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-white/5 border border-glass-border/30 rounded-lg px-4 py-2.5 text-xs text-muted-foreground mb-4">
          <span>{selectedIds.length} invoice(s) selected</span>
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
        <table className="w-full min-w-[560px] text-sm">
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
              <th className="px-4 py-3 font-medium">Invoice #</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Currency</th>
              <th className="px-4 py-3 text-right font-medium">Total (PKR)</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={role === 'admin' ? 7 : 6} className="px-4 py-10 text-center text-muted-foreground">
                  No invoices found.
                </td>
              </tr>
            )}
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-b border-glass-border/50 last:border-0 hover:bg-white/[0.02]">
                {role === 'admin' && (
                  <td className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(inv.id)}
                      onChange={() => toggleSelect(inv.id)}
                      className="cursor-pointer rounded border-glass-border bg-input focus:ring-ring h-4 w-4"
                    />
                  </td>
                )}
                <td className="tabular px-4 py-3">INV-{inv.invoice_number}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.invoice_date}</td>
                <td className="px-4 py-3">{inv.customer_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.currency}</td>
                <td className="tabular px-4 py-3 text-right">{fmt(inv.total_pkr, 'PKR')}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground cursor-pointer"
                      onClick={() => onDownload(inv)}
                      aria-label={`Download PDF for invoice ${inv.invoice_number}`}
                    >
                      <FileDown className="h-4 w-4" />
                    </button>
                    {canWrite(role) && (
                      <button
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground cursor-pointer"
                        onClick={() => openEditor(inv)}
                        aria-label={`Edit invoice ${inv.invoice_number}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {isAdmin(role) && (
                      <button
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger/15 hover:text-danger cursor-pointer"
                        onClick={() => setDeleteFor(inv)}
                        aria-label={`Delete invoice ${inv.invoice_number}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {/* Editor */}
      <GlassModal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New Invoice' : `Edit INV-${editing?.invoice_number ?? ''}`}
        wide
      >
        <div className="flex flex-col gap-4">
          <Field label="Customer Name">
            <GlassInput value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name" />
          </Field>

          {lockedCurrency && (
            <p className="text-xs text-muted-foreground">
              Invoice currency locked to <span className="text-foreground">{lockedCurrency}</span> (set by first line).
            </p>
          )}

          <div className="flex flex-col gap-3">
            {lines.map((l, idx) => (
              <div key={l.id} className="grid grid-cols-2 gap-2 rounded-xl border border-glass-border p-3 sm:grid-cols-[1fr_100px_90px_70px_100px_36px] sm:items-end">
                <Field label={idx === 0 ? 'Description' : ''} className="col-span-2 sm:col-span-1">
                  <GlassInput
                    value={l.description}
                    onChange={(e) => setLine(l.id, { description: e.target.value })}
                    placeholder="e.g. Extra night — hotel"
                  />
                </Field>
                <Field label={idx === 0 ? 'Mode' : ''}>
                  <GlassSelect value={l.mode} onChange={(e) => setLine(l.id, { mode: e.target.value as 'pax' | 'night' })}>
                    <option value="pax">Per pax</option>
                    <option value="night">Per night</option>
                  </GlassSelect>
                </Field>
                <Field label={idx === 0 ? 'Unit price' : ''}>
                  <GlassInput
                    type="number" min={0} value={l.unit_price}
                    onChange={(e) => setLine(l.id, { unit_price: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </Field>
                <Field label={idx === 0 ? (l.mode === 'pax' ? 'Pax' : 'Nights') : ''}>
                  <GlassInput
                    type="number" min={1} value={l.count}
                    onChange={(e) => setLine(l.id, { count: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </Field>
                <Field label={idx === 0 ? 'Currency' : ''}>
                  <GlassSelect
                    value={l.currency}
                    disabled={idx > 0}
                    onChange={(e) => {
                      const c = e.target.value as Currency
                      // First line changes propagate the lock to all lines
                      setLines((ls) => ls.map((x) => ({ ...x, currency: c })))
                    }}
                  >
                    <option value="PKR">PKR</option>
                    <option value="SAR">SAR</option>
                  </GlassSelect>
                </Field>
                <button
                  className="mb-0.5 rounded-lg p-2 text-muted-foreground hover:bg-danger/15 hover:text-danger cursor-pointer disabled:opacity-30"
                  onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}
                  disabled={lines.length === 1}
                  aria-label="Remove line"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <GlassButton variant="secondary" onClick={() => setLines((ls) => [...ls, emptyLine(lockedCurrency ?? 'PKR')])}>
              <Plus className="h-3.5 w-3.5" aria-hidden /> Add Line
            </GlassButton>
            <p className="text-sm">
              Total: <span className="tabular font-medium">{fmt(total_pkr, 'PKR')}</span>
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-glass-border pt-4">
            <GlassButton variant="ghost" onClick={() => setEditing(null)}>Cancel</GlassButton>
            <GlassButton onClick={submit} disabled={pending}>
              {pending ? 'Saving…' : 'Save Invoice'}
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* Delete confirm */}
      <GlassModal open={!!deleteFor} onClose={() => setDeleteFor(null)} title="Delete invoice?">
        <p className="text-sm text-muted-foreground">
          Permanently delete invoice INV-{deleteFor?.invoice_number} for{' '}
          <span className="text-foreground">{deleteFor?.customer_name}</span>?
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
