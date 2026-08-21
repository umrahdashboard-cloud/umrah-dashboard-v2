// ── Client-side invoice PDF via pdf-lib. Returns byte size for tracking. ──
'use client'

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { fmt, toPkr } from '@/lib/currency'
import type { BrandingSettings, Invoice } from '@/lib/types'

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

export async function downloadInvoicePdf(
  inv: Invoice,
  branding: BrandingSettings,
  exchangeRate: number,
): Promise<number> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()
  const brandBg = hexToRgb(branding.primary_bg)
  const brandText = hexToRgb(branding.primary_text)
  const gray = rgb(0.45, 0.48, 0.54)
  const dark = rgb(0.1, 0.12, 0.16)

  // Header band
  page.drawRectangle({ x: 0, y: height - 110, width, height: 110, color: brandBg })
  page.drawText(branding.company_name, { x: 40, y: height - 58, size: 22, font: bold, color: brandText })
  page.drawText(`${branding.phone}  ·  ${branding.email}`, { x: 40, y: height - 78, size: 9, font, color: brandText })
  page.drawText(branding.location, { x: 40, y: height - 92, size: 9, font, color: brandText })
  page.drawText('INVOICE', { x: width - 140, y: height - 58, size: 18, font: bold, color: brandText })
  page.drawText(`INV-${inv.invoice_number}`, { x: width - 140, y: height - 78, size: 10, font, color: brandText })
  page.drawText(inv.invoice_date, { x: width - 140, y: height - 92, size: 10, font, color: brandText })

  // Bill to
  let y = height - 150
  page.drawText('BILL TO', { x: 40, y, size: 8, font: bold, color: gray })
  y -= 16
  page.drawText(inv.customer_name, { x: 40, y, size: 12, font: bold, color: dark })
  y -= 14
  page.drawText(`Currency: ${inv.currency}`, { x: 40, y, size: 9, font, color: gray })

  // Table header
  y -= 34
  page.drawRectangle({ x: 40, y: y - 6, width: width - 80, height: 22, color: rgb(0.93, 0.94, 0.96) })
  page.drawText('Description', { x: 48, y, size: 9, font: bold, color: dark })
  page.drawText('Mode', { x: 300, y, size: 9, font: bold, color: dark })
  page.drawText('Unit', { x: 360, y, size: 9, font: bold, color: dark })
  page.drawText('Qty', { x: 430, y, size: 9, font: bold, color: dark })
  page.drawText('Amount', { x: 480, y, size: 9, font: bold, color: dark })

  y -= 26
  for (const l of inv.lines) {
    const amount = l.unit_price * l.count
    page.drawText(l.description.slice(0, 52), { x: 48, y, size: 9, font, color: dark })
    page.drawText(l.mode === 'pax' ? 'Per pax' : 'Per night', { x: 300, y, size: 9, font, color: gray })
    page.drawText(fmt(l.unit_price, l.currency), { x: 360, y, size: 9, font, color: dark })
    page.drawText(String(l.count), { x: 430, y, size: 9, font, color: dark })
    page.drawText(fmt(amount, l.currency), { x: 480, y, size: 9, font, color: dark })
    y -= 18
  }

  // Totals
  y -= 10
  page.drawLine({ start: { x: 360, y: y + 8 }, end: { x: width - 40, y: y + 8 }, thickness: 0.7, color: gray })
  const totalDisplay = inv.currency === 'SAR'
    ? fmt(inv.lines.reduce((s, l) => s + l.unit_price * l.count, 0), 'SAR')
    : fmt(inv.total_pkr, 'PKR')
  page.drawText('TOTAL', { x: 360, y: y - 8, size: 11, font: bold, color: dark })
  page.drawText(totalDisplay, { x: 445, y: y - 8, size: 11, font: bold, color: dark })
  if (inv.currency === 'SAR') {
    page.drawText(`= ${fmt(inv.total_pkr, 'PKR')} @ ${exchangeRate}`, { x: 360, y: y - 24, size: 8, font, color: gray })
  }

  // Bank + terms footer
  page.drawText('PAYMENT DETAILS', { x: 40, y: 150, size: 8, font: bold, color: gray })
  page.drawText(`${branding.bank_name} — ${branding.account_number}`, { x: 40, y: 136, size: 9, font, color: dark })
  page.drawText('TERMS', { x: 40, y: 112, size: 8, font: bold, color: gray })
  const words = branding.terms.split(' ')
  let line = ''
  let ty = 98
  for (const w of words) {
    if ((line + ' ' + w).length > 95) {
      page.drawText(line, { x: 40, y: ty, size: 8, font, color: gray })
      ty -= 11
      line = w
    } else {
      line = line ? `${line} ${w}` : w
    }
  }
  if (line) page.drawText(line, { x: 40, y: ty, size: 8, font, color: gray })
  page.drawText(branding.signee_name, { x: width - 160, y: 112, size: 10, font: bold, color: dark })
  page.drawText('Authorized Signature', { x: width - 160, y: 98, size: 8, font, color: gray })

  const bytes = await doc.save()
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `INV-${inv.invoice_number}-${inv.customer_name.replace(/\s+/g, '-')}.pdf`
  a.click()
  URL.revokeObjectURL(url)
  return bytes.byteLength
}

// re-export for convenience in callers that need PKR math
export { toPkr }
