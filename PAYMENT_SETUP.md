# Payment Gateway Integration Setup Guide

This guide explains how to configure each payment gateway for your Umrah Dashboard.

## Environment Variables Required

Add these to your `.env.local` file:

### Stripe Setup

```env
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

**Steps to get credentials:**
1. Go to https://dashboard.stripe.com
2. Navigate to Developers → API Keys
3. Copy your Secret Key and Publishable Key
4. Set webhook endpoint to: `https://yourdomain.com/api/payment/webhook`

### JazzCash Setup

```env
JAZZCASH_API_KEY=your_api_key
JAZZCASH_MERCHANT_ID=your_merchant_id
```

**Steps to get credentials:**
1. Sign up at https://jazzcash.com.pk (Business account)
2. Go to Integration → API Settings
3. Generate API Key and get your Merchant ID
4. Set callback URL to: `https://yourdomain.com/payment/jazzcash/callback`

### EasyPaisa Setup

```env
EASYPAISA_STORE_ID=your_store_id
EASYPAISA_MERCHANT_KEY=your_merchant_key
```

**Steps to get credentials:**
1. Register at https://easypaisapk.com
2. Go to Merchant Dashboard → Settings
3. Find Store ID and Merchant Key
4. Configure return URL: `https://yourdomain.com/payment/easypaisa/callback`

## Available Payment Methods

### 1. **Stripe Card Payment**
- Supported: Credit/Debit Cards (Visa, Mastercard, American Express)
- Fees: 2.9% + PKR 5 per transaction
- Settlement: 2-3 business days
- Use for: International customers, high-value transactions

### 2. **JazzCash Mobile Wallet**
- Supported: Jazz/Warid mobile numbers
- Fees: 1.5-2.5% depending on volume
- Settlement: Same day
- Use for: Pakistani customers with JazzCash accounts

### 3. **EasyPaisa Digital Wallet**
- Supported: All Pakistani mobile numbers
- Fees: 2% per transaction
- Settlement: Same day
- Use for: Mass market Pakistani payments

### 4. **Manual Payment**
- Supported: Bank transfer, cash on delivery
- Fees: 0% (handle separately)
- Settlement: As arranged
- Use for: High-value corporate bookings

## How to Use Payment Gateway Selector

### In Your Component:

```tsx
import { PaymentGatewaySelector } from '@/components/payment-gateway-selector'

export function BookingPaymentPage() {
  return (
    <PaymentGatewaySelector
      bookingId="booking-123"
      amountPkr={500000} // Amount in paisas (500,000 paisas = PKR 5,000)
      customerEmail="customer@example.com"
      customerName="Ahmed Hassan"
      customerPhone="03001234567" // Required for JazzCash
      onPaymentSuccess={() => {
        // Handle successful payment
        console.log('Payment successful!')
      }}
    />
  )
}
```

## Payment Flow

1. **User Initiates Payment**
   - Select payment gateway
   - System validates amount and customer details

2. **Payment Processing**
   - Creates payment intent with selected gateway
   - User redirected to payment gateway

3. **Payment Gateway Handles**
   - Collects payment information securely
   - Returns to callback URL

4. **Webhook Verification**
   - Payment gateway sends webhook to `/api/payment/webhook`
   - System verifies payment and records in database
   - Activity log created for audit trail

5. **Success/Failure Handling**
   - Success: Payment recorded, booking confirmed
   - Failure: User notified, option to retry

## Testing Payments

### Stripe Test Mode
```
Card: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
```

### JazzCash Sandbox
- Use test merchant credentials from sandbox portal
- All test transactions marked as TEST

### EasyPaisa Sandbox
- Available in EasyPaisa merchant dashboard
- Select "Sandbox Mode" for testing

## Payment Status Tracking

All payments are automatically tracked with these statuses:

- **Pending**: Payment initiated, awaiting gateway response
- **Processing**: Payment gateway processing
- **Completed**: Payment successful, recorded in database
- **Failed**: Payment declined or cancelled

Access payment history via:
```tsx
import { getPaymentsByBooking } from '@/lib/payments'

const payments = await getPaymentsByBooking('booking-123')
```

## Commission Calculations

When payment is recorded, commissions are automatically calculated:

```tsx
import { recordCommission } from '@/lib/commissions'

// After payment recorded:
await recordCommission(
  agentId,
  bookingId,
  amountPkr,
  commissionPercentage // e.g., 5 for 5%
)
```

## Reporting & Analytics

All payment data is available in reports:

```tsx
import { getRevenueByPeriod } from '@/lib/reports'

const revenue = await getRevenueByPeriod('2026-01-01', '2026-06-30')
```

## Activity Logging

All payment transactions are logged in activity_logs:

```sql
SELECT * FROM activity_logs 
WHERE entity_type = 'payment' 
AND action LIKE 'Payment%'
ORDER BY timestamp DESC;
```

## Security Best Practices

1. **Never log card details** - Only store transaction IDs
2. **Use HTTPS only** - All payment flows must be encrypted
3. **Validate webhooks** - Verify webhook signatures before processing
4. **PCI Compliance** - Never process raw card data on your server
5. **Audit trail** - All payment modifications logged automatically

## Troubleshooting

### Payment not recorded after webhook
- Check if webhook endpoint is accessible
- Verify webhook signature validation
- Check activity logs for webhook processing errors

### Customer redirected to wrong URL
- Verify callback URLs match in gateway settings
- Check that domain is public (not localhost)

### Payment appears twice
- Webhook idempotency check - only record once per transaction ID
- Check for duplicate webhook events from gateway

## Support

For issues with:
- **Stripe**: https://support.stripe.com
- **JazzCash**: https://jazzcash.com.pk/support
- **EasyPaisa**: https://easypaisapk.com/support
- **Umrah Dashboard**: Check activity logs and payment gateway webhooks
