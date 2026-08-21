'use client'

import { useEffect, useRef } from 'react'
import type { CostBreakdown } from '@/lib/calc'
import type { BrandingSettings, CalculatorState } from '@/lib/types'
import '@/app/quote-styles.css'

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

interface QuotePreviewProps {
  calc: CalculatorState
  cost: CostBreakdown
  branding?: BrandingSettings
  companyName?: string
  tagline?: string
  phone?: string
  email?: string
  address?: string
  terms?: string
}

const fmtPKR = (n: number) => `PKR ${n.toLocaleString('en-PK')}`

/** Sync active dashboard theme tokens onto the quote shell for print/PDF. */
function syncQuoteThemeColors(shell: HTMLElement) {
  const root = getComputedStyle(document.documentElement)
  const primary = root.getPropertyValue('--primary').trim()
  const accent = root.getPropertyValue('--gold').trim() || root.getPropertyValue('--chart-2').trim() || '#d4af6a'

  if (primary) {
    shell.style.setProperty('--quote-primary', primary)
    shell.style.setProperty('--quote-primary-dark', `color-mix(in srgb, ${primary} 55%, #000)`)
    shell.style.setProperty('--quote-primary-mid', primary)
    shell.style.setProperty('--quote-primary-light', `color-mix(in srgb, ${primary} 10%, #fff)`)
  }
  if (accent) {
    shell.style.setProperty('--quote-accent', accent)
    shell.style.setProperty('--quote-accent-dark', `color-mix(in srgb, ${accent} 72%, #000)`)
    shell.style.setProperty('--quote-accent-light', `color-mix(in srgb, ${accent} 18%, #fff)`)
  }
}

export function QuotePreview({
  calc,
  cost,
  branding,
  companyName,
  tagline = 'Sacred Journeys, Seamless Service',
  phone,
  email,
  address,
  terms,
}: QuotePreviewProps) {
  const shellRef = useRef<HTMLDivElement>(null)

  const resolvedCompany = companyName ?? branding?.company_name ?? 'Fast Travels'
  const resolvedPhone = phone ?? branding?.phone ?? '+92 300 1234567'
  const resolvedEmail = email ?? branding?.email ?? 'hello@company.pk'
  const resolvedAddress = address ?? branding?.location ?? 'Lahore, Pakistan'
  const resolvedTerms = terms ?? branding?.terms

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    syncQuoteThemeColors(shell)

    const observer = new MutationObserver(() => syncQuoteThemeColors(shell))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })

    return () => observer.disconnect()
  }, [])

  const totalPax = calc.adults + calc.children + calc.infants
  const perPilgrim = totalPax > 0 ? Math.round(cost.total_selling_pkr / totalPax) : 0
  const today = new Date()
  const validUntil = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const reference = `QT-${today.getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`

  const costItems: Array<[string, number]> = []
  if (calc.tickets_enabled) costItems.push(['Airline Tickets', cost.tickets_pkr || 0])
  if (calc.visa_enabled) costItems.push(['Visa', cost.visa_pkr || 0])
  if (calc.transport_enabled) costItems.push(['Transport', cost.transport_pkr || 0])
  if (calc.makkah_enabled) costItems.push(['Makkah Hotel', cost.makkah_pkr || 0])
  if (calc.madinah_enabled) costItems.push(['Madinah Hotel', cost.madinah_pkr || 0])
  if (calc.ziarat_enabled) costItems.push(['Ziarat Tours', cost.ziarat_pkr || 0])

  const durationDays = (calc.makkah_enabled ? calc.makkah_nights : 0) + (calc.madinah_enabled ? calc.madinah_nights : 0)

  return (
    <div className="quote-shell" ref={shellRef}>
      <div className="quote-toolbar no-print">
        <button className="btn-print" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>

      <article className="quote-page">
        <div className="pattern-strip" aria-hidden="true" />

        <header className="quote-header">
          <div className="agency">
            <div className="logo" aria-hidden="true">
              {resolvedCompany.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="agency-name">{resolvedCompany}</h1>
              <p className="agency-tagline">{tagline}</p>
              <ul className="agency-contact">
                <li>{resolvedPhone}</li>
                <li>{resolvedEmail}</li>
                <li>{resolvedAddress}</li>
              </ul>
            </div>
          </div>

          <div className="quote-meta">
            <div className="quote-title">QUOTE</div>
            <dl>
              <div>
                <dt>Reference</dt>
                <dd>{reference}</dd>
              </div>
              <div>
                <dt>Issued</dt>
                <dd>{formatDate(today)}</dd>
              </div>
            </dl>
            <span className="validity-badge">
              Valid until {formatDate(validUntil)}
            </span>
          </div>
        </header>

        <section className="card">
          <h2 className="card-title">Package Summary</h2>
          <div className="summary-grid">
            <div>
              <span className="label">Customer</span>
              <span className="value">{calc.customer_name || 'Not Specified'}</span>
            </div>
            <div>
              <span className="label">Travel Date</span>
              <span className="value">TBD</span>
            </div>
            <div>
              <span className="label">Duration</span>
              <span className="value">{durationDays} days</span>
            </div>
            <div>
              <span className="label">Passengers</span>
              <span className="value">
                <strong>{totalPax}</strong>
                <small> ({calc.adults} adults, {calc.children} children, {calc.infants} infants)</small>
              </span>
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="card-title">Cost Breakdown</h2>
          <table className="cost-table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {costItems.map(([item, amount]) => (
                <tr key={item}>
                  <td>{item}</td>
                  <td className="right mono">{fmtPKR(amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="subtotal">
                <td>Total Cost</td>
                <td className="right mono">{fmtPKR(cost.total_cost_pkr || 0)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <section className="hero-price">
          <div className="hero-inner">
            <div>
              <span className="hero-label">Total Selling Price</span>
              <div className="hero-amount mono">{fmtPKR(cost.total_selling_pkr || 0)}</div>
            </div>
            <div className="hero-divider" aria-hidden="true" />
            <div className="per-pilgrim">
              <span className="hero-label">Per Pilgrim</span>
              <div className="per-pilgrim-amount mono">{fmtPKR(perPilgrim)}</div>
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="card-title">Payment Schedule</h2>
          <div className="payment-grid">
            <div className="payment-cell">
              <span className="label">Advance Paid</span>
              <span className="amount mono">PKR 0</span>
            </div>
            <div className="payment-cell remaining">
              <span className="label">Remaining Balance</span>
              <span className="amount mono">{fmtPKR(cost.total_selling_pkr || 0)}</span>
            </div>
          </div>
        </section>

        <footer className="quote-footer">
          <div className="notes">
            <h3>Notes &amp; Terms</h3>
            <p>{resolvedTerms ?? 'Prices are subject to visa approval and airline seat availability at the time of booking. Hotel category and room-sharing basis as per attached itinerary.'}</p>
            <p className="fine-print">
              This quotation is valid for 7 days from the date of issue. Generated on {formatDate(today)}.
            </p>
          </div>
          <div className="footer-brand">
            <div className="footer-logo">{resolvedCompany.substring(0, 2).toUpperCase()}</div>
            <p className="footer-name">{resolvedCompany}</p>
            <p className="footer-tag">{tagline}</p>
          </div>
        </footer>

        <div className="pattern-strip bottom" aria-hidden="true" />
      </article>
    </div>
  )
}
