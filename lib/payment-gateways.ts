'use server'

import { createClient } from '@/lib/supabase/server'
import { logActivity } from './activity-log'

export type PaymentGateway = 'stripe' | 'jazzcash' | 'easypaisa' | 'manual'

export interface PaymentIntent {
  gateway: PaymentGateway
  booking_id: string
  amount_pkr: number
  customer_email: string
  customer_name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  transaction_id?: string
  created_at: Date
}

// ── Stripe Integration ────────────────────────────────────────────
export async function createStripePaymentIntent(
  bookingId: string,
  amountPkr: number,
  customerEmail: string,
  customerName: string
): Promise<{
  clientSecret: string
  paymentIntentId: string
}> {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) throw new Error('Stripe not configured')

  try {
    // Convert PKR to cents (assuming 1 PKR = 100 cents for Stripe)
    const amountCents = Math.round(amountPkr * 100)

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(amountCents),
        currency: 'pkr',
        description: `Fast Travels Booking - ${bookingId}`,
        metadata: JSON.stringify({
          booking_id: bookingId,
          customer_name: customerName,
        }),
        receipt_email: customerEmail,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create Stripe payment intent')
    }

    const data: any = await response.json()

    // Log payment intent creation
    await logActivity('Stripe Payment Intent Created', 'payment', bookingId, {
      payment_intent_id: data.id,
      amount_pkr: amountPkr,
      customer_email: customerEmail,
    })

    return {
      clientSecret: data.client_secret,
      paymentIntentId: data.id,
    }
  } catch (error) {
    console.error('[v0] Stripe error:', error)
    throw error
  }
}

export async function confirmStripePayment(
  paymentIntentId: string,
  bookingId: string
): Promise<boolean> {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) throw new Error('Stripe not configured')

  try {
    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
      },
    })

    if (!response.ok) throw new Error('Failed to verify Stripe payment')

    const data: any = await response.json()

    if (data.status === 'succeeded') {
      // Record the payment
      const amountPkr = Math.round(data.amount / 100) // Convert from cents back to PKR
      const supabase = await createClient()

      await supabase.from('payments').insert({
        booking_id: bookingId,
        amount_pkr: amountPkr,
        payment_date: new Date().toISOString(),
        method: 'card',
        status: 'paid',
      })

      await logActivity('Stripe Payment Confirmed', 'payment', bookingId, {
        payment_intent_id: paymentIntentId,
        status: 'succeeded',
        amount_pkr: amountPkr,
      })

      return true
    }

    return false
  } catch (error) {
    console.error('[v0] Stripe confirmation error:', error)
    throw error
  }
}

// ── JazzCash Integration ──────────────────────────────────────────
export async function createJazzCashPaymentLink(
  bookingId: string,
  amountPkr: number,
  customerPhone: string,
  customerName: string
): Promise<{
  paymentLink: string
  referenceId: string
}> {
  const jazzCashApiKey = process.env.JAZZCASH_API_KEY
  const jazzCashMerchantId = process.env.JAZZCASH_MERCHANT_ID
  if (!jazzCashApiKey || !jazzCashMerchantId) throw new Error('JazzCash not configured')

  try {
    const referenceId = `FT-${bookingId}-${Date.now()}`

    const response = await fetch('https://sandbox.jazzcash.com.pk/api/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jazzCashApiKey}`,
      },
      body: JSON.stringify({
        merchant_id: jazzCashMerchantId,
        order_id: referenceId,
        order_amount: amountPkr,
        order_description: `Fast Travels Booking - ${bookingId}`,
        customer_phone: customerPhone,
        customer_name: customerName,
        redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/jazzcash/callback`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/jazzcash/webhook`,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create JazzCash payment')
    }

    const data: any = await response.json()

    await logActivity('JazzCash Payment Link Created', 'payment', bookingId, {
      reference_id: referenceId,
      amount_pkr: amountPkr,
      customer_phone: customerPhone,
    })

    return {
      paymentLink: data.payment_url,
      referenceId,
    }
  } catch (error) {
    console.error('[v0] JazzCash error:', error)
    throw error
  }
}

// ── EasyPaisa Integration ─────────────────────────────────────────
export async function createEasyPaisaPaymentLink(
  bookingId: string,
  amountPkr: number,
  customerEmail: string,
  customerName: string
): Promise<{
  paymentLink: string
  storeId: string
}> {
  const easypaisaStoreId = process.env.EASYPAISA_STORE_ID
  const easypaisaMerchantKey = process.env.EASYPAISA_MERCHANT_KEY
  if (!easypaisaStoreId || !easypaisaMerchantKey) throw new Error('EasyPaisa not configured')

  try {
    const transactionId = `FT-${bookingId}-${Date.now()}`

    // EasyPaisa payment link construction
    const paymentLink = new URL('https://easypaisapk.com/payment/payment')
    paymentLink.searchParams.set('store_id', easypaisaStoreId)
    paymentLink.searchParams.set('transaction_id', transactionId)
    paymentLink.searchParams.set('amount', String(amountPkr))
    paymentLink.searchParams.set('customer_name', customerName)
    paymentLink.searchParams.set('customer_email', customerEmail)
    paymentLink.searchParams.set('description', `Fast Travels Booking - ${bookingId}`)
    paymentLink.searchParams.set('return_url', `${process.env.NEXT_PUBLIC_BASE_URL}/payment/easypaisa/callback`)

    await logActivity('EasyPaisa Payment Link Created', 'payment', bookingId, {
      transaction_id: transactionId,
      amount_pkr: amountPkr,
      customer_email: customerEmail,
    })

    return {
      paymentLink: paymentLink.toString(),
      storeId: easypaisaStoreId,
    }
  } catch (error) {
    console.error('[v0] EasyPaisa error:', error)
    throw error
  }
}

// ── Generic Payment Processing ────────────────────────────────────
export async function processPaymentByGateway(
  gateway: PaymentGateway,
  bookingId: string,
  amountPkr: number,
  customerEmail: string,
  customerName: string,
  customerPhone?: string
): Promise<any> {
  switch (gateway) {
    case 'stripe':
      return createStripePaymentIntent(bookingId, amountPkr, customerEmail, customerName)

    case 'jazzcash':
      if (!customerPhone) throw new Error('Phone number required for JazzCash')
      return createJazzCashPaymentLink(bookingId, amountPkr, customerPhone, customerName)

    case 'easypaisa':
      return createEasyPaisaPaymentLink(bookingId, amountPkr, customerEmail, customerName)

    case 'manual':
      // Manual payment - just log the intent
      await logActivity('Manual Payment Initiated', 'payment', bookingId, {
        amount_pkr: amountPkr,
        gateway: 'manual',
      })
      return { success: true, message: 'Manual payment initiated' }

    default:
      throw new Error(`Unknown payment gateway: ${gateway}`)
  }
}

// ���─ Webhook Handlers ──────────────────────────────────────────────
export async function handleStripeWebhook(event: any): Promise<void> {
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object
    const bookingId = paymentIntent.metadata?.booking_id

    if (bookingId) {
      const amountPkr = Math.round(paymentIntent.amount / 100)
      const supabase = await createClient()

      await supabase.from('payments').insert({
        booking_id: bookingId,
        amount_pkr: amountPkr,
        payment_date: new Date().toISOString(),
        method: 'card',
        status: 'paid',
      })

      await logActivity('Stripe Payment Webhook Processed', 'payment', bookingId, {
        event_id: event.id,
        amount_pkr: amountPkr,
      })
    }
  }
}

export async function handleJazzCashWebhook(data: any): Promise<void> {
  const bookingId = data.order_id?.split('-')[1]

  if (bookingId && data.status === 'SUCCESS') {
    const amountPkr = Number(data.amount)
    const supabase = await createClient()

    await supabase.from('payments').insert({
      booking_id: bookingId,
      amount_pkr: amountPkr,
      payment_date: new Date().toISOString(),
      method: 'jazzcash',
      status: 'paid',
    })

    await logActivity('JazzCash Payment Webhook Processed', 'payment', bookingId, {
      reference_id: data.order_id,
      amount_pkr: amountPkr,
    })
  }
}

export async function handleEasyPaisaWebhook(data: any): Promise<void> {
  const bookingId = data.transaction_id?.split('-')[1]

  if (bookingId && data.status === 'SUCCESS') {
    const amountPkr = Number(data.amount)
    const supabase = await createClient()

    await supabase.from('payments').insert({
      booking_id: bookingId,
      amount_pkr: amountPkr,
      payment_date: new Date().toISOString(),
      method: 'easypaisa',
      status: 'paid',
    })

    await logActivity('EasyPaisa Payment Webhook Processed', 'payment', bookingId, {
      transaction_id: data.transaction_id,
      amount_pkr: amountPkr,
    })
  }
}

// ── Retrieve Available Gateways ───────────────────────────────────
export async function getAvailablePaymentGateways(): Promise<PaymentGateway[]> {
  const available: PaymentGateway[] = ['manual']

  if (process.env.STRIPE_SECRET_KEY) available.push('stripe')
  if (process.env.JAZZCASH_API_KEY && process.env.JAZZCASH_MERCHANT_ID) available.push('jazzcash')
  if (process.env.EASYPAISA_STORE_ID && process.env.EASYPAISA_MERCHANT_KEY) available.push('easypaisa')

  return available
}
