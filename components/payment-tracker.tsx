'use client'

import { useState } from 'react'
import { GlassCard, GlassButton } from '@/components/glass'
import { recordPayment, getPaymentsByBooking } from '@/lib/payments'
import type { PaymentStatus } from '@/lib/types'

interface PaymentTrackerProps {
  bookingId: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  paymentStatus: PaymentStatus
}

const StatusConfig: Record<PaymentStatus, { color: string; icon: string; label: string }> = {
  pending: { color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400', icon: '⏳', label: 'Pending' },
  partial: { color: 'bg-blue-500/20 border-blue-500/30 text-blue-400', icon: '📊', label: 'Partial' },
  paid: { color: 'bg-green-500/20 border-green-500/30 text-green-400', icon: '✓', label: 'Paid' },
  overdue: { color: 'bg-red-500/20 border-red-500/30 text-red-400', icon: '⚠', label: 'Overdue' },
}

export function PaymentTracker({
  bookingId,
  totalAmount,
  paidAmount,
  remainingAmount,
  paymentStatus,
}: PaymentTrackerProps) {
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'cash' | 'bank_transfer' | 'card' | 'easypaisa' | 'jazzcash'>('cash')
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState<any[]>([])

  const config = StatusConfig[paymentStatus]
  const progressPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

  const handleAddPayment = async () => {
    if (!amount || Number(amount) <= 0) return

    setLoading(true)
    try {
      await recordPayment(bookingId, Number(amount) * 100, method)
      setAmount('')
      // Refresh payments
      const updated = await getPaymentsByBooking(bookingId)
      setPayments(updated)
      setShowForm(false)
    } catch (error) {
      console.error('[v0] Payment error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard className="p-6 space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Payment Status</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${config.color}`}>
          <span>{config.icon}</span>
          <span className="text-sm font-semibold">{config.label}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Payment Progress</span>
          <span className="text-white font-semibold">{progressPercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Amount Summary */}
      <div className="grid grid-cols-3 gap-3 py-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
          <p className="text-lg font-bold text-white">PKR {(totalAmount / 100).toLocaleString()}</p>
        </div>
        <div className="text-center border-l border-r border-white/10">
          <p className="text-xs text-gray-500 mb-1">Paid</p>
          <p className="text-lg font-bold text-green-400">PKR {(paidAmount / 100).toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Remaining</p>
          <p className={`text-lg font-bold ${remainingAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>
            PKR {(remainingAmount / 100).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Recent Payments */}
      {payments.length > 0 && (
        <div className="space-y-2 py-4 border-t border-white/10">
          <p className="text-sm font-semibold text-gray-400">Recent Payments</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {payments.slice(0, 3).map((payment, idx) => (
              <div key={idx} className="flex justify-between text-sm p-2 bg-white/5 rounded border border-white/10">
                <span className="text-gray-300">{payment.method}</span>
                <span className="text-green-400 font-semibold">PKR {(payment.amount_pkr / 100).toLocaleString()}</span>
                <span className="text-gray-500">{payment.payment_date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Payment Form */}
      {showForm ? (
        <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
          <input
            type="number"
            placeholder="Amount (PKR)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Card</option>
            <option value="easypaisa">EasyPaisa</option>
            <option value="jazzcash">JazzCash</option>
          </select>
          <div className="flex gap-2">
            <GlassButton
              onClick={handleAddPayment}
              disabled={loading || !amount}
              className="flex-1"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </GlassButton>
            <GlassButton
              onClick={() => setShowForm(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </GlassButton>
          </div>
        </div>
      ) : (
        <GlassButton onClick={() => setShowForm(true)} className="w-full">
          Add Payment
        </GlassButton>
      )}
    </GlassCard>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = StatusConfig[status]
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-semibold ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  )
}
