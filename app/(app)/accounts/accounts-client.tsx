'use client'

import { useState, useMemo, useTransition, useDeferredValue, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, Wallet, Receipt, Banknote, AlertCircle, ArrowUpRight, ArrowDownRight, PlusCircle, Download, FileSpreadsheet, Ban } from 'lucide-react'
import {
  GlassCard, GlassInput, GlassSelect, GlassButton, Field, PageHeader,
} from '@/components/glass'
import { GlassModal } from '@/components/overlay'
import { useToast } from '@/components/toast'
import { addPayment, upsertExpense, deleteExpense, deleteExpenses, voidPayment } from '@/lib/actions'
import { fmt } from '@/lib/currency'
import { isPaymentActive, sumActivePayments } from '@/lib/payment-utils'
import { canWrite, isAdmin, hasPermission } from '@/lib/roles'
import type { Booking, Expense, ExpenseType, Payment, PaymentMethod, Role } from '@/lib/types'

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Bank', 'JazzCash', 'EasyPaisa']
const EXPENSE_TYPES: ExpenseType[] = [
  'Umrah Supplier', 'Airline/Ticket', 'Hotel Supplier', 'Transport Supplier', 'Other Umrah Expense',
]

const blankExpense = (): Expense => ({
  id: '',
  expense_date: new Date().toISOString().slice(0, 10),
  expense_type: 'Umrah Supplier',
  supplier: '',
  amount_pkr: 0,
  method: 'Bank',
  note: '',
  booking_id: null,
  invoice_id: null,
})

export function AccountsClient({
  role, payments, bookings, expenses,
}: {
  role: Role
  payments: Payment[]
  bookings: Booking[]
  expenses: Expense[]
}) {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'ledger' | 'expenses'>('ledger')

  // ── Record Payment Form State ──────────────────────────────────────────
  const unpaidBookings = useMemo(
    () => bookings.filter((b) => (b.remaining_pkr ?? (b.total_pkr - b.paid_pkr)) > 0),
    [bookings],
  )

  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    unpaidBookings.length > 0 ? unpaidBookings[0].id : ''
  )

  useEffect(() => {
    if (selectedBookingId && !unpaidBookings.some((b) => b.id === selectedBookingId)) {
      setSelectedBookingId(unpaidBookings.length > 0 ? unpaidBookings[0].id : '')
    } else if (!selectedBookingId && unpaidBookings.length > 0) {
      setSelectedBookingId(unpaidBookings[0].id)
    }
  }, [unpaidBookings, selectedBookingId])
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')
  const [paymentNote, setPaymentNote] = useState<string>('')
  const [recordPending, startRecordTransition] = useTransition()

  const selectedBooking = useMemo(
    () => bookings.find((b) => b.id === selectedBookingId) || null,
    [bookings, selectedBookingId],
  )

  const dueAmount = selectedBooking
    ? (selectedBooking.remaining_pkr ?? Math.max(0, selectedBooking.total_pkr - selectedBooking.paid_pkr))
    : 0

  const handleFillFull = () => {
    if (dueAmount > 0) {
      setPaymentAmount(String(dueAmount))
    }
  }

  const handleRecordPayment = () => {
    const amt = Number(paymentAmount)
    if (!selectedBookingId) {
      toast('Please select a booking', 'error')
      return
    }
    if (!amt || amt <= 0) {
      toast('Please enter a valid payment amount', 'error')
      return
    }

    startRecordTransition(async () => {
      await addPayment({
        booking_id: selectedBookingId,
        amount_pkr: amt,
        method: paymentMethod,
        note: paymentNote,
      })
      toast('Payment recorded successfully')
      setPaymentAmount('')
      setPaymentNote('')
    })
  }

  // ── Cashbook Summary Calculations ─────────────────────────────────────
  const totalReceived = useMemo(() => sumActivePayments(payments), [payments])
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + (e.amount_pkr || 0), 0), [expenses])
  const netBalance = totalReceived - totalExpenses
  const outstandingDue = useMemo(
    () => bookings.reduce((s, b) => s + (b.remaining_pkr ?? Math.max(0, b.total_pkr - b.paid_pkr)), 0),
    [bookings],
  )

  const methodTotals = useMemo(() => {
    const map: Record<string, number> = { Cash: 0, Bank: 0, JazzCash: 0, EasyPaisa: 0 }
    for (const p of payments) {
      if (!isPaymentActive(p)) continue
      if (map[p.method] !== undefined) {
        map[p.method] += p.amount_pkr || 0
      }
    }
    return map
  }, [payments])

  // ── Client Ledger State ────────────────────────────────────────────────
  const [ledgerQuery, setLedgerQuery] = useState('')
  const deferredLedgerQuery = useDeferredValue(ledgerQuery)
  const [ledgerMethodFilter, setLedgerMethodFilter] = useState<'all' | PaymentMethod>('all')
  const [voidPaymentFor, setVoidPaymentFor] = useState<Payment | null>(null)
  const [voidNote, setVoidNote] = useState('')
  const [voidPending, startVoidTransition] = useTransition()

  const filteredPayments = useMemo(
    () =>
      payments.filter((p) => {
        if (ledgerMethodFilter !== 'all' && p.method !== ledgerMethodFilter) return false
        const q = deferredLedgerQuery.trim().toLowerCase()
        return !q
          || (p.customer_name || '').toLowerCase().includes(q)
          || (p.note || '').toLowerCase().includes(q)
          || (p.void_note || '').toLowerCase().includes(q)
      }),
    [payments, deferredLedgerQuery, ledgerMethodFilter],
  )

  const handleVoidPayment = () => {
    if (!voidPaymentFor) return
    const note = voidNote.trim()
    if (!note) {
      toast('Please enter a reason for voiding this payment', 'error')
      return
    }

    startVoidTransition(async () => {
      try {
        await voidPayment({ payment_id: voidPaymentFor.id, void_note: note })
        toast('Payment voided — it no longer counts in totals')
        setVoidPaymentFor(null)
        setVoidNote('')
      } catch (error) {
        toast(error instanceof Error ? error.message : 'Failed to void payment', 'error')
      }
    })
  }

  // ── Expenses Ledger State ──────────────────────────────────────────────
  const [expensesQuery, setExpensesQuery] = useState('')
  const deferredExpensesQuery = useDeferredValue(expensesQuery)
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<'all' | ExpenseType>('all')
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deleteExpenseFor, setDeleteExpenseFor] = useState<Expense | null>(null)
  const [expensePending, startExpenseTransition] = useTransition()
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([])
  const [expenseDeletePending, startExpenseDeleteTransition] = useTransition()

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        if (expenseTypeFilter !== 'all' && e.expense_type !== expenseTypeFilter) return false
        const q = deferredExpensesQuery.trim().toLowerCase()
        return !q || e.supplier.toLowerCase().includes(q) || e.note.toLowerCase().includes(q)
      }),
    [expenses, deferredExpensesQuery, expenseTypeFilter],
  )

  const toggleSelectExpense = (id: string) => {
    setSelectedExpenseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const isAllExpensesSelected =
    filteredExpenses.length > 0 && filteredExpenses.every((e) => selectedExpenseIds.includes(e.id))

  const toggleSelectAllExpenses = () => {
    if (isAllExpensesSelected) {
      setSelectedExpenseIds((prev) => prev.filter((id) => !filteredExpenses.some((e) => e.id === id)))
    } else {
      const newSelected = [...selectedExpenseIds]
      filteredExpenses.forEach((e) => {
        if (!newSelected.includes(e.id)) newSelected.push(e.id)
      })
      setSelectedExpenseIds(newSelected)
    }
  }

  const handleDeleteSelectedExpenses = () => {
    if (selectedExpenseIds.length === 0) return
    if (!window.confirm(`Are you sure you want to delete the ${selectedExpenseIds.length} selected expense(s)?`)) return

    startExpenseDeleteTransition(async () => {
      await deleteExpenses(selectedExpenseIds)
      toast(`${selectedExpenseIds.length} expense(s) deleted`)
      setSelectedExpenseIds([])
    })
  }

  const handleSaveExpense = () => {
    if (!editingExpense || !editingExpense.supplier.trim() || editingExpense.amount_pkr <= 0) {
      toast('Supplier and a positive amount are required', 'error')
      return
    }
    startExpenseTransition(async () => {
      await upsertExpense(editingExpense)
      toast(editingExpense.id ? 'Expense updated' : 'Expense added')
      setEditingExpense(null)
    })
  }

  const handleDeleteSingleExpense = () => {
    if (!deleteExpenseFor) return
    startExpenseTransition(async () => {
      await deleteExpense(deleteExpenseFor.id)
      toast('Expense deleted')
      setDeleteExpenseFor(null)
    })
  }

  // ── CSV Export Helpers & Handlers ─────────────────────────────────────
  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const triggerCSVDownload = (content: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportClientLedger = () => {
    const headers = ['Date', 'Customer Name', 'Payment Method', 'Status', 'Note', 'Void Reason', 'Amount (PKR)']
    const rows = filteredPayments.map((p) => [
      p.payment_date,
      p.customer_name || '',
      p.method,
      p.voided ? 'Voided' : 'Active',
      p.note || '',
      p.void_note || '',
      p.voided ? 0 : p.amount_pkr,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n')
    triggerCSVDownload(csvContent, `Client_Receipts_Ledger_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const handleExportExpensesLedger = () => {
    const headers = ['Date', 'Category', 'Supplier', 'Payment Method', 'Note', 'Amount (PKR)']
    const rows = filteredExpenses.map((e) => [
      e.expense_date,
      e.expense_type,
      e.supplier,
      e.method,
      e.note || '',
      e.amount_pkr,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n')
    triggerCSVDownload(csvContent, `Expenses_Ledger_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const handleExportAccountsSummary = () => {
    const lines: string[] = []

    lines.push('Umrah Dashboard - Accounts Summary Report')
    lines.push(`Generated Date: ${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 8)}`)
    lines.push('')

    lines.push('CASHBOOK FINANCIAL OVERVIEW')
    lines.push('Metric,Amount (PKR)')
    lines.push(`Total Cash In (Received),${totalReceived}`)
    lines.push(`Total Cash Out (Expenses),${totalExpenses}`)
    lines.push(`Net Cash Balance,${netBalance}`)
    lines.push(`Total Outstanding Due,${outstandingDue}`)
    lines.push('')

    lines.push('PAYMENT METHOD DISTRIBUTION')
    lines.push('Method,Total Collected (PKR)')
    lines.push(`Cash,${methodTotals.Cash}`)
    lines.push(`Bank,${methodTotals.Bank}`)
    lines.push(`JazzCash,${methodTotals.JazzCash}`)
    lines.push(`EasyPaisa,${methodTotals.EasyPaisa}`)
    lines.push('')

    lines.push('CLIENT RECEIPTS HISTORY')
    lines.push('Date,Customer Name,Method,Status,Note,Void Reason,Amount (PKR)')
    filteredPayments.forEach((p) => {
      lines.push([
        p.payment_date,
        p.customer_name || '',
        p.method,
        p.voided ? 'Voided' : 'Active',
        p.note || '',
        p.void_note || '',
        p.voided ? 0 : p.amount_pkr,
      ].map(escapeCSV).join(','))
    })
    lines.push('')

    lines.push('EXPENSES HISTORY')
    lines.push('Date,Category,Supplier,Method,Note,Amount (PKR)')
    filteredExpenses.forEach((e) => {
      lines.push([
        e.expense_date,
        e.expense_type,
        e.supplier,
        e.method,
        e.note || '',
        e.amount_pkr,
      ].map(escapeCSV).join(','))
    })

    const csvContent = lines.join('\n')
    triggerCSVDownload(csvContent, `Accounts_Summary_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Accounts"
        subtitle="Centralized financial management, payments, client ledger, and expenses"
        actions={
          <GlassButton onClick={handleExportAccountsSummary} className='rounded-full'>
            <FileSpreadsheet className="h-4 w-4" aria-hidden /> Export Accounts Summary
          </GlassButton>
        }
      />

      {/* ══ Cashbook Summary Cards ══ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Cash In (Received)</span>
            <ArrowDownRight className="h-4 w-4 text-success" aria-hidden />
          </div>
          <p className="font-heading mt-2 text-xl font-semibold tabular text-success">
            {fmt(totalReceived, 'PKR')}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{payments.length} total receipts</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Cash Out (Expenses)</span>
            <ArrowUpRight className="h-4 w-4 text-danger" aria-hidden />
          </div>
          <p className="font-heading mt-2 text-xl font-semibold tabular text-danger">
            {fmt(totalExpenses, 'PKR')}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{expenses.length} total expenses</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Net Cash Balance</span>
            <Wallet className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <p className={`font-heading mt-2 text-xl font-semibold tabular ${netBalance >= 0 ? 'text-primary' : 'text-danger'}`}>
            {fmt(netBalance, 'PKR')}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Received minus Expenses</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Outstanding Due</span>
            <AlertCircle className="h-4 w-4 text-warning" aria-hidden />
          </div>
          <p className="font-heading mt-2 text-xl font-semibold tabular text-warning">
            {fmt(outstandingDue, 'PKR')}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{unpaidBookings.length} pending bookings</p>
        </GlassCard>
      </div>

      {/* Payment Method Distribution */}
      <div className="flex flex-wrap items-center gap-3 rounded-full bg-card border border-border p-3 text-xs">
        <span className="font-medium text-muted-foreground">Collected by Method:</span>
        <span className="rounded-md bg-input px-2.5 py-1 text-foreground border border-border">
          Cash: <strong className="tabular">{fmt(methodTotals.Cash, 'PKR')}</strong>
        </span>
        <span className="rounded-md bg-input px-2.5 py-1 text-foreground border border-border">
          Bank: <strong className="tabular">{fmt(methodTotals.Bank, 'PKR')}</strong>
        </span>
        <span className="rounded-md bg-input px-2.5 py-1 text-foreground border border-border">
          JazzCash: <strong className="tabular">{fmt(methodTotals.JazzCash, 'PKR')}</strong>
        </span>
        <span className="rounded-md bg-input px-2.5 py-1 text-foreground border border-border">
          EasyPaisa: <strong className="tabular">{fmt(methodTotals.EasyPaisa, 'PKR')}</strong>
        </span>
      </div>

      {/* ══ Record Payment Section (Exact reference design) ══ */}
      {canWrite(role) && (
        <GlassCard className="p-5 border border-primary/30">
          <div className="mb-4 flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-primary">
              RECORD PAYMENT
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-[1.5fr_1.2fr_0.8fr]">
              {/* Booking / Customer Select */}
              <Field label="Booking / Customer">
                <GlassSelect
                  value={selectedBookingId}
                  onChange={(e) => {
                    setSelectedBookingId(e.target.value)
                    setPaymentAmount('')
                  }}
                >
                  {unpaidBookings.length === 0 ? (
                    <option value="">No unpaid bookings</option>
                  ) : (
                    unpaidBookings.map((b) => {
                      const due = b.remaining_pkr ?? (b.total_pkr - b.paid_pkr)
                      return (
                        <option key={b.id} value={b.id}>
                          {b.customer_name} (Due: {fmt(due, 'PKR')})
                        </option>
                      )
                    })
                  )}
                </GlassSelect>
                {selectedBooking && (
                  <span className="mt-1 text-[11px] text-muted-foreground tabular">
                    Total: {fmt(selectedBooking.total_pkr, 'PKR')} · Paid: {fmt(selectedBooking.paid_pkr, 'PKR')} · Due: {fmt(dueAmount, 'PKR')}
                  </span>
                )}
              </Field>

              {/* Amount input with Full button */}
              <Field label="Amount (PKR)">
                <div className="flex items-center gap-2">
                  <GlassInput
                    type="number"
                    placeholder="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleFillFull}
                    disabled={dueAmount <= 0}
                    className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-white/10 active:scale-95 disabled:opacity-40 cursor-pointer"
                  >
                    Full
                  </button>
                </div>
                <span className="mt-1 text-[11px] text-muted-foreground tabular">
                  Max: {fmt(dueAmount, 'PKR')}
                </span>
              </Field>

              {/* Method Select */}
              <Field label="Method">
                <GlassSelect
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </GlassSelect>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
              {/* Note (optional) */}
              <Field label="Note (optional)">
                <GlassInput
                  placeholder="e.g. Advance payment via JazzCash"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                />
              </Field>

              {/* Add Payment Action */}
              <GlassButton
                onClick={handleRecordPayment}
                disabled={recordPending || !selectedBookingId || !paymentAmount || Number(paymentAmount) <= 0}
                className="w-full md:w-auto px-6 h-[38px] rounded-full"
              >
                {recordPending ? 'Adding…' : 'Add Payment'}
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* ══ Client Receipts Ledger Section ══ */}
      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="font-heading text-base font-semibold">Client Receipts Ledger</h2>
          <span className="text-xs text-muted-foreground">({filteredPayments.length} entries)</span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 sm:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <GlassInput
                  className="pl-9"
                  placeholder="Search customer, note…"
                  value={ledgerQuery}
                  onChange={(e) => setLedgerQuery(e.target.value)}
                  aria-label="Search ledger"
                />
              </div>
              <GlassSelect
                className="w-36"
                value={ledgerMethodFilter}
                onChange={(e) => setLedgerMethodFilter(e.target.value as any)}
                aria-label="Filter payment method"
              >
                <option value="all">All methods</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </GlassSelect>
            </div>

            <div className="flex items-center gap-2">
              <GlassButton variant="ghost" onClick={handleExportClientLedger}>
                <Download className="h-4 w-4" /> Export Ledger
              </GlassButton>
            </div>
          </div>

          <GlassCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Customer</th>
                    <th className="p-3 font-semibold">Method</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Note</th>
                    <th className="p-3 text-right font-semibold">Amount</th>
                    {hasPermission(role, 'manage_payments') && (
                      <th className="p-3 w-16 text-right font-semibold">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={hasPermission(role, 'manage_payments') ? 7 : 6} className="p-8 text-center text-muted-foreground">
                        No payments found.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => {
                      const voided = Boolean(p.voided)
                      return (
                        <tr
                          key={p.id}
                          className={voided ? 'bg-muted/30 opacity-80' : 'hover:bg-card/50'}
                        >
                          <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{p.payment_date}</td>
                          <td className="p-3 font-medium">{p.customer_name || '—'}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs border border-border">
                              {p.method}
                            </span>
                          </td>
                          <td className="p-3">
                            {voided ? (
                              <span className="inline-flex items-center rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger border border-danger/30">
                                Voided
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success border border-success/20">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground max-w-xs">
                            <div className="truncate">{p.note || '—'}</div>
                            {voided && p.void_note && (
                              <div className="mt-1 text-danger truncate" title={p.void_note}>
                                Void reason: {p.void_note}
                              </div>
                            )}
                          </td>
                          <td className={`p-3 text-right font-semibold tabular ${voided ? 'text-muted-foreground line-through' : 'text-success'}`}>
                            {voided ? fmt(p.amount_pkr, 'PKR') : `+ ${fmt(p.amount_pkr, 'PKR')}`}
                          </td>
                          {hasPermission(role, 'manage_payments') && (
                            <td className="p-3 text-right">
                              {!voided && (
                                <button
                                  onClick={() => {
                                    setVoidPaymentFor(p)
                                    setVoidNote('')
                                  }}
                                  className="rounded p-1 text-muted-foreground hover:bg-warning/20 hover:text-warning cursor-pointer"
                                  title="Void payment"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ══ Expenses Ledger Section ══ */}
      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="font-heading text-base font-semibold">Expenses Ledger</h2>
            <span className="text-xs text-muted-foreground">({filteredExpenses.length} entries)</span>
          </div>
          {canWrite(role) && (
            <GlassButton onClick={() => setEditingExpense(blankExpense())} className='rounded-full'>
              <Plus className="h-4 w-4" aria-hidden /> Add Expense
            </GlassButton>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 sm:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <GlassInput
                  className="pl-9"
                  placeholder="Search supplier, note…"
                  value={expensesQuery}
                  onChange={(e) => setExpensesQuery(e.target.value)}
                  aria-label="Search expenses"
                />
              </div>
              <GlassSelect
                className="w-40"
                value={expenseTypeFilter}
                onChange={(e) => setExpenseTypeFilter(e.target.value as any)}
                aria-label="Filter expense type"
              >
                <option value="all">All types</option>
                {EXPENSE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </GlassSelect>
            </div>

            <div className="flex items-center gap-2">
              <GlassButton variant="ghost" onClick={handleExportExpensesLedger}>
                <Download className="h-4 w-4" /> Export Expenses
              </GlassButton>
              {isAdmin(role) && selectedExpenseIds.length > 0 && (
                <GlassButton
                  variant="destructive"
                  onClick={handleDeleteSelectedExpenses}
                  disabled={expenseDeletePending}
                >
                  <Trash2 className="h-4 w-4" /> Delete ({selectedExpenseIds.length})
                </GlassButton>
              )}
            </div>
          </div>

          <GlassCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    {isAdmin(role) && (
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllExpensesSelected}
                          onChange={toggleSelectAllExpenses}
                          className="rounded border-border cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold">Supplier</th>
                    <th className="p-3 font-semibold">Method</th>
                    <th className="p-3 font-semibold">Note</th>
                    <th className="p-3 text-right font-semibold">Amount</th>
                    {canWrite(role) && <th className="p-3 w-20 text-right font-semibold">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={canWrite(role) ? (isAdmin(role) ? 8 : 7) : 6} className="p-8 text-center text-muted-foreground">
                        No expenses found.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((e) => {
                      const isSelected = selectedExpenseIds.includes(e.id)
                      return (
                        <tr key={e.id} className={isSelected ? 'bg-primary/10' : 'hover:bg-card/50'}>
                          {isAdmin(role) && (
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectExpense(e.id)}
                                className="rounded border-border cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{e.expense_date}</td>
                          <td className="p-3 text-xs font-medium text-foreground">{e.expense_type}</td>
                          <td className="p-3 font-medium">{e.supplier}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs border border-border">
                              {e.method}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">{e.note || '—'}</td>
                          <td className="p-3 text-right font-semibold tabular text-danger">
                            - {fmt(e.amount_pkr, 'PKR')}
                          </td>
                          {canWrite(role) && (
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setEditingExpense({ ...e })}
                                  className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                                  title="Edit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                {isAdmin(role) && (
                                  <button
                                    onClick={() => setDeleteExpenseFor(e)}
                                    className="rounded p-1 text-muted-foreground hover:bg-danger/20 hover:text-danger cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Expense Edit / Create Modal */}
      <GlassModal
        open={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        title={editingExpense?.id ? 'Edit Expense' : 'Add Expense'}
      >
        {editingExpense && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Expense Date">
                <GlassInput
                  type="date"
                  value={editingExpense.expense_date}
                  onChange={(e) => setEditingExpense({ ...editingExpense, expense_date: e.target.value })}
                />
              </Field>
              <Field label="Category">
                <GlassSelect
                  value={editingExpense.expense_type}
                  onChange={(e) => setEditingExpense({ ...editingExpense, expense_type: e.target.value as ExpenseType })}
                >
                  {EXPENSE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </GlassSelect>
              </Field>
            </div>

            <Field label="Supplier Name">
              <GlassInput
                placeholder="e.g. Saudi Airlines, Anjum Hotel..."
                value={editingExpense.supplier}
                onChange={(e) => setEditingExpense({ ...editingExpense, supplier: e.target.value })}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Amount (PKR)">
                <GlassInput
                  type="number"
                  placeholder="0"
                  value={editingExpense.amount_pkr || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount_pkr: Number(e.target.value) })}
                />
              </Field>
              <Field label="Payment Method">
                <GlassSelect
                  value={editingExpense.method}
                  onChange={(e) => setEditingExpense({ ...editingExpense, method: e.target.value as PaymentMethod })}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </GlassSelect>
              </Field>
            </div>

            <Field label="Link to Booking (optional)">
              <GlassSelect
                value={editingExpense.booking_id || ''}
                onChange={(e) => setEditingExpense({ ...editingExpense, booking_id: e.target.value || null })}
              >
                <option value="">General Expense (No booking)</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>{b.customer_name}</option>
                ))}
              </GlassSelect>
            </Field>

            <Field label="Notes">
              <GlassInput
                placeholder="Description / reference details..."
                value={editingExpense.note || ''}
                onChange={(e) => setEditingExpense({ ...editingExpense, note: e.target.value })}
              />
            </Field>

            <div className="mt-2 flex justify-end gap-2">
              <GlassButton variant="ghost" onClick={() => setEditingExpense(null)}>Cancel</GlassButton>
              <GlassButton onClick={handleSaveExpense} disabled={expensePending}>
                {expensePending ? 'Saving…' : 'Save Expense'}
              </GlassButton>
            </div>
          </div>
        )}
      </GlassModal>

      {/* Delete Expense Modal */}
      <GlassModal
        open={Boolean(deleteExpenseFor)}
        onClose={() => setDeleteExpenseFor(null)}
        title="Delete Expense"
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete the expense for <strong>{deleteExpenseFor?.supplier}</strong> ({fmt(deleteExpenseFor?.amount_pkr || 0, 'PKR')})?
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <GlassButton variant="ghost" onClick={() => setDeleteExpenseFor(null)}>Cancel</GlassButton>
          <GlassButton variant="destructive" onClick={handleDeleteSingleExpense} disabled={expensePending}>
            {expensePending ? 'Deleting…' : 'Delete'}
          </GlassButton>
        </div>
      </GlassModal>

      {/* Void Payment Modal */}
      <GlassModal
        open={Boolean(voidPaymentFor)}
        onClose={() => {
          setVoidPaymentFor(null)
          setVoidNote('')
        }}
        title="Void Payment"
      >
        {voidPaymentFor && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Void the receipt for <strong>{voidPaymentFor.customer_name || 'Walk-in Customer'}</strong>{' '}
              ({fmt(voidPaymentFor.amount_pkr, 'PKR')}) dated {voidPaymentFor.payment_date}.
              The record stays in history but will no longer count in totals or booking balances.
            </p>
            <Field label="Reason for voiding" required>
              <GlassInput
                placeholder="e.g. Wrong amount entered, duplicate receipt…"
                value={voidNote}
                onChange={(e) => setVoidNote(e.target.value)}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <GlassButton
                variant="ghost"
                onClick={() => {
                  setVoidPaymentFor(null)
                  setVoidNote('')
                }}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="destructive"
                onClick={handleVoidPayment}
                disabled={voidPending || !voidNote.trim()}
              >
                {voidPending ? 'Voiding…' : 'Void Payment'}
              </GlassButton>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  )
}
