import type { CostBreakdown, MasterData } from './calc'
import { fromPkr } from './currency'
import { uid } from './demo-store'
import { resolveHotel } from './hotel-custom'
import type { Booking, CalculatorState, Invoice, InvoiceLine } from './types'

/** Resolve calculator JSON from invoice or a linked booking (source_invoice_id). */
export function getInvoiceCalcState(invoice: Invoice, bookings: Booking[]): string | null {
  const direct = invoice.calc_state?.trim()
  if (direct) return direct
  const linked = bookings.find((b) => b.source_invoice_id === invoice.id && b.calc_state?.trim())
  return linked?.calc_state ?? null
}

export function isCalculatorInvoice(invoice: Invoice, bookings: Booking[]): boolean {
  return getInvoiceCalcState(invoice, bookings) !== null
}

/** Build itemized invoice lines from calculator cost sections (selling prices, proportional margin). */
export function buildInvoiceLinesFromCalc(
  calc: CalculatorState,
  cost: CostBreakdown,
  master: Pick<MasterData, 'hotels' | 'ziarats' | 'exchangeRate'>,
  existingLines?: InvoiceLine[],
): InvoiceLine[] {
  const { exchangeRate: rate, hotels, ziarats } = master
  const cur = calc.currency
  const paying = Math.max(1, calc.adults + calc.children)
  const scale = cost.total_cost_pkr > 0 ? cost.total_selling_pkr / cost.total_cost_pkr : 1
  const lines: InvoiceLine[] = []

  const add = (desc: string, costPkr: number, mode: 'pax' | 'night', count: number) => {
    if (costPkr <= 0) return
    const selling = fromPkr(costPkr * scale, cur, rate)
    const unit = count > 0 ? Math.round((selling / count) * 100) / 100 : selling
    lines.push({
      id: existingLines?.[lines.length]?.id ?? uid('l'),
      description: desc,
      mode,
      unit_price: unit,
      count,
      currency: cur,
    })
  }

  if (calc.tickets_enabled && cost.tickets_pkr > 0) {
    const pax = Math.max(1, calc.adults + calc.children + calc.infants)
    add('Flight tickets', cost.tickets_pkr, 'pax', pax)
  }
  if (calc.visa_enabled && cost.visa_pkr > 0) {
    add('Visa processing', cost.visa_pkr, 'pax', paying)
  }
  if (calc.transport_enabled && cost.transport_pkr > 0) {
    add('Transport', cost.transport_pkr, 'pax', 1)
  }
  if (calc.makkah_enabled && cost.makkah_pkr > 0) {
    const h = resolveHotel(calc.makkah_hotel_id, calc.makkah_custom_hotel, 'Makkah', hotels)
    add(
      `Makkah — ${h?.name ?? 'Hotel'} (${calc.makkah_room_type})`,
      cost.makkah_pkr,
      'night',
      Math.max(1, calc.makkah_nights),
    )
  }
  if (calc.madinah_enabled && cost.madinah_pkr > 0) {
    const h = resolveHotel(calc.madinah_hotel_id, calc.madinah_custom_hotel, 'Madinah', hotels)
    add(
      `Madinah — ${h?.name ?? 'Hotel'} (${calc.madinah_room_type})`,
      cost.madinah_pkr,
      'night',
      Math.max(1, calc.madinah_nights),
    )
  }
  if (calc.ziarat_enabled && cost.ziarat_pkr > 0) {
    const names = calc.ziarat_ids
      .map((id) => ziarats.find((z) => z.id === id)?.name)
      .filter(Boolean)
      .join(', ')
    add(names ? `Ziarat — ${names}` : 'Ziarat tours', cost.ziarat_pkr, 'pax', paying)
  }

  if (lines.length === 0 && cost.total_selling_pkr > 0) {
    add('Umrah package', cost.total_selling_pkr, 'pax', paying)
  }

  return lines
}
