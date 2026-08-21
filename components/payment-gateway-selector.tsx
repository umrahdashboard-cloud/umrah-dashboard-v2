'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Smartphone, Zap, AlertCircle } from 'lucide-react'
import { GlassCard, GlassButton } from '@/components/glass'
import { useToast } from '@/components/toast'
import { processPaymentByGateway, getAvailablePaymentGateways } from '@/lib/payment-gateways'
import type { PaymentGateway } from '@/lib/payment-gateways'

interface PaymentGatewaySelectorProps {
  bookingId: string
  amountPkr: number
  customerEmail: string
  customerName: string
  customerPhone?: string
  onPaymentSuccess?: () => void
}

const GatewayConfig: Record<PaymentGateway, { name: string; icon: any; color: string; description: string }> = {
  stripe: {
    name: 'Stripe Card Payment',
    icon: CreditCard,
    color: 'from-blue-600 to-blue-700',
    description: 'Pay securely with credit or debit card',
  },
  jazzcash: {
    name: 'JazzCash Mobile',
    icon: Smartphone,
    color: 'from-orange-500 to-orange-600',
    description: 'Pay using JazzCash mobile wallet',
  },
  easypaisa: {
    name: 'EasyPaisa',
    icon: Zap,
    color: 'from-purple-600 to-purple-700',
    description: 'Pay via EasyPaisa digital wallet',
  },
  manual: {
    name: 'Manual Payment',
    icon: AlertCircle,
    color: 'from-gray-600 to-gray-700',
    description: 'Bank transfer or cash on delivery',
  },
}

export function PaymentGatewaySelector({
  bookingId,
  amountPkr,
  customerEmail,
  customerName,
  customerPhone,
  onPaymentSuccess,
}: PaymentGatewaySelectorProps) {
  const toast = useToast()
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null)
  const [availableGateways, setAvailableGateways] = useState<PaymentGateway[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  useEffect(() => {
    getAvailablePaymentGateways().then((gateways) => {
      setAvailableGateways(gateways)
      if (gateways.length > 0) {
        setSelectedGateway(gateways[0])
      }
    })
  }, [])

  const handlePayment = async () => {
    if (!selectedGateway) {
      toast('Please select a payment method', 'error')
      return
    }

    // Validate required fields
    if (selectedGateway === 'jazzcash' && !customerPhone) {
      toast('Phone number required for JazzCash', 'error')
      return
    }

    setPaymentProcessing(true)
    try {
      const result = await processPaymentByGateway(
        selectedGateway,
        bookingId,
        amountPkr,
        customerEmail,
        customerName,
        customerPhone
      )

      if (selectedGateway === 'stripe' && result.clientSecret) {
        // Redirect to Stripe checkout
        window.location.href = `/payment/stripe/checkout?clientSecret=${result.clientSecret}&paymentIntentId=${result.paymentIntentId}`
      } else if (selectedGateway === 'jazzcash' && result.paymentLink) {
        // Redirect to JazzCash
        window.location.href = result.paymentLink
      } else if (selectedGateway === 'easypaisa' && result.paymentLink) {
        // Redirect to EasyPaisa
        window.location.href = result.paymentLink
      } else if (selectedGateway === 'manual') {
        toast('Please arrange manual payment. Contact support for bank details.')
        onPaymentSuccess?.()
      }
    } catch (error) {
      console.error('[v0] Payment error:', error)
      toast(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setPaymentProcessing(false)
    }
  }

  if (availableGateways.length === 0) {
    return (
      <GlassCard className="p-6 text-center">
        <AlertCircle size={32} className="mx-auto text-red-400 mb-2" />
        <p className="text-red-400">No payment gateways configured</p>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Payment Method</h3>
        <p className="text-sm text-gray-400">Amount: PKR {(amountPkr / 100).toLocaleString()}</p>
      </div>

      {/* Gateway Options */}
      <div className="grid grid-cols-1 gap-3">
        {availableGateways.map((gateway) => {
          const config = GatewayConfig[gateway]
          const Icon = config.icon

          return (
            <button
              key={gateway}
              onClick={() => setSelectedGateway(gateway)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedGateway === gateway
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${config.color} flex-shrink-0`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{config.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{config.description}</p>
                </div>
                <input
                  type="radio"
                  checked={selectedGateway === gateway}
                  onChange={() => setSelectedGateway(gateway)}
                  className="mt-2"
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* Additional Info */}
      {selectedGateway && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-300">
            {selectedGateway === 'stripe' && 'You will be redirected to Stripe secure checkout'}
            {selectedGateway === 'jazzcash' && 'You will be redirected to JazzCash mobile wallet'}
            {selectedGateway === 'easypaisa' && 'You will be redirected to EasyPaisa portal'}
            {selectedGateway === 'manual' && 'Contact us for bank transfer or cash payment details'}
          </p>
        </div>
      )}

      {/* Payment Button */}
      <GlassButton
        onClick={handlePayment}
        disabled={!selectedGateway || paymentProcessing}
        className="w-full"
      >
        {paymentProcessing ? (
          <>
            <span className="mr-2">Processing...</span>
            <span className="inline-block animate-spin">⟳</span>
          </>
        ) : (
          `Pay PKR ${(amountPkr / 100).toLocaleString()}`
        )}
      </GlassButton>

      {/* Security Notice */}
      <p className="text-xs text-gray-500 text-center">
        Your payment information is encrypted and secure. We never store your card details.
      </p>
    </GlassCard>
  )
}
