// ── Single shared currency utility. ALL SAR↔PKR math lives here. ──────
import type { Currency } from './types'

export function sarToPkr(sar: number, rate: number): number {
  return Math.round(sar * rate)
}

export function pkrToSar(pkr: number, rate: number): number {
  if (rate === 0) return 0
  return Math.round((pkr / rate) * 100) / 100
}

/** Convert an amount from its currency to PKR */
export function toPkr(amount: number, from: Currency, rate: number): number {
  return from === 'SAR' ? sarToPkr(amount, rate) : Math.round(amount)
}

/** Convert a PKR amount into a display currency */
export function fromPkr(pkr: number, to: Currency, rate: number): number {
  return to === 'SAR' ? pkrToSar(pkr, rate) : Math.round(pkr)
}

/** Format a number for financial display — always toLocaleString */
export function fmt(amount: number, currency?: Currency): string {
  const n = amount.toLocaleString('en-US', {
    maximumFractionDigits: currency === 'SAR' ? 2 : 0,
  })
  return currency ? `${currency} ${n}` : n
}
