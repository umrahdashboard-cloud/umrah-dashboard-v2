import { NextRequest, NextResponse } from 'next/server'
import { handleStripeWebhook, handleJazzCashWebhook, handleEasyPaisaWebhook } from '@/lib/payment-gateways'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')
    const body = await request.text()

    // Stripe webhook
    if (request.headers.get('stripe-signature')) {
      const event = JSON.parse(body)
      await handleStripeWebhook(event)
      return NextResponse.json({ received: true })
    }

    // JazzCash webhook
    if (request.headers.get('x-jazzcash-signature')) {
      const data = JSON.parse(body)
      await handleJazzCashWebhook(data)
      return NextResponse.json({ received: true })
    }

    // EasyPaisa webhook
    if (request.headers.get('x-easypaisa-signature')) {
      const data = JSON.parse(body)
      await handleEasyPaisaWebhook(data)
      return NextResponse.json({ received: true })
    }

    return NextResponse.json({ error: 'Unknown webhook source' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
