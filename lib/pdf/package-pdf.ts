'use client'

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { fmt } from '@/lib/currency'
import type { CostBreakdown } from '@/lib/calc'
import type { CalculatorState } from '@/lib/types'
import { store } from '@/lib/demo-store'

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

export async function downloadPackagePdf(
  calc: CalculatorState,
  cost: CostBreakdown,
  masterData: {
    airlineName?: string
    makkahHotelName?: string
    madinahHotelName?: string
    transportVehicle?: string
    ziaratNames?: string[]
  },
): Promise<number> {
  try {
    const doc = await PDFDocument.create()
    const page = doc.addPage([595, 842]) // A4
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const bold = await doc.embedFont(StandardFonts.HelveticaBold)
    const { width, height } = page.getSize()

    // Colors
    const primaryColor = hexToRgb('#0d6b4f')
    const accentColor = hexToRgb('#d4af6a')
    const darkText = hexToRgb('#1a1a1a')
    const gray = hexToRgb('#666666')
    const lightGray = hexToRgb('#f5f5f5')
    const white = rgb(1, 1, 1)

    let y = height - 20

    // ═══ TOP BORDER ═══
    page.drawRectangle({ x: 0, y: y, width, height: 20, color: primaryColor })
    y -= 35

    // ═══ HEADER ═══
    page.drawRectangle({ x: 40, y: y - 30, width: 30, height: 30, color: primaryColor })
    page.drawText('AS', { x: 45, y: y - 27, size: 14, font: bold, color: white })

    page.drawText((store as any).company_name || 'Fast Travels', { x: 80, y: y - 8, size: 14, font: bold, color: darkText })
    page.drawText('SACRED JOURNEYS, SEAMLESS SERVICE', { x: 80, y: y - 19, size: 7, font, color: accentColor })
    page.drawText((store as any).phone || '+92 300 1234567', { x: 80, y: y - 28, size: 8, font, color: gray })

    page.drawText('QUOTE', { x: width - 90, y: y - 8, size: 14, font: bold, color: darkText })
    page.drawText('REFERENCE QT-2026-0184', { x: width - 90, y: y - 19, size: 8, font, color: gray })
    page.drawText('ISSUED 18/07/2026', { x: width - 90, y: y - 28, size: 8, font, color: gray })

    y -= 50

    // ═══ PACKAGE SUMMARY ═══
    page.drawText('PACKAGE SUMMARY', { x: 40, y, size: 11, font: bold, color: primaryColor })
    page.drawLine({ start: { x: 40, y: y - 3 }, end: { x: 80, y: y - 3 }, color: accentColor, thickness: 2 })
    y -= 18

    const summaryBoxWidth = (width - 80) / 4
    const summaryBoxX = [40, 40 + summaryBoxWidth, 40 + summaryBoxWidth * 2, 40 + summaryBoxWidth * 3]

    page.drawText('CUSTOMER', { x: summaryBoxX[0], y, size: 7, font: bold, color: gray })
    page.drawText(calc.customer_name || 'Not Specified', { x: summaryBoxX[0], y: y - 12, size: 10, font: bold, color: darkText })

    page.drawText('TRAVEL DATE', { x: summaryBoxX[1], y, size: 7, font: bold, color: gray })
    page.drawText('TBD', { x: summaryBoxX[1], y: y - 12, size: 10, font: bold, color: darkText })

    const totalNights = (calc.makkah_enabled ? calc.makkah_nights : 0) + (calc.madinah_enabled ? calc.madinah_nights : 0)
    page.drawText('DURATION', { x: summaryBoxX[2], y, size: 7, font: bold, color: gray })
    page.drawText(`${totalNights} days`, { x: summaryBoxX[2], y: y - 12, size: 10, font: bold, color: darkText })

    page.drawText('PASSENGERS', { x: summaryBoxX[3], y, size: 7, font: bold, color: gray })
    const paxText = `${cost.total_pax} (${calc.adults} adults, ${calc.children} children, ${calc.infants} infants)`
    page.drawText(paxText, { x: summaryBoxX[3], y: y - 12, size: 9, font: bold, color: darkText })

    y -= 40

    // ═══ COST BREAKDOWN ═══
    page.drawText('COST BREAKDOWN', { x: 40, y, size: 11, font: bold, color: primaryColor })
    page.drawLine({ start: { x: 40, y: y - 3 }, end: { x: 120, y: y - 3 }, color: accentColor, thickness: 2 })
    y -= 18

    page.drawText('ITEM', { x: 40, y, size: 8, font: bold, color: gray })
    page.drawText('AMOUNT', { x: width - 80, y, size: 8, font: bold, color: gray })
    y -= 12

    // Cost items
    const items: Array<[string, number]> = []
    if (calc.tickets_enabled) items.push(['Airline Tickets', cost.tickets_pkr || 0])
    if (calc.visa_enabled) items.push(['Visa', cost.visa_pkr || 0])
    if (calc.transport_enabled) items.push(['Transport', cost.transport_pkr || 0])
    if (calc.makkah_enabled) items.push(['Makkah Hotel', cost.makkah_pkr || 0])
    if (calc.madinah_enabled) items.push(['Madinah Hotel', cost.madinah_pkr || 0])
    if (calc.ziarat_enabled) items.push(['Ziarat Tours', cost.ziarat_pkr || 0])

    for (const [label, amount] of items) {
      page.drawText(label, { x: 40, y, size: 9, font, color: darkText })
      page.drawText(`PKR ${fmt(amount)}`, { x: width - 80, y, size: 9, font, color: darkText })
      y -= 12
    }

    page.drawLine({ start: { x: 40, y: y + 2 }, end: { x: width - 40, y: y + 2 }, color: primaryColor, thickness: 1 })
    y -= 8

    page.drawText('Total Cost', { x: 40, y, size: 10, font: bold, color: darkText })
    page.drawText(`PKR ${fmt(cost.total_cost_pkr || 0)}`, { x: width - 80, y, size: 10, font: bold, color: darkText })
    y -= 25

    // ═══ PRICE BOX ═══
    const boxHeight = 40
    page.drawRectangle({ x: 40, y: y - boxHeight, width: width - 80, height: boxHeight, color: primaryColor })

    page.drawText('TOTAL SELLING PRICE', { x: 60, y: y - 12, size: 8, font: bold, color: white })
    page.drawText(`PKR ${fmt(cost.total_selling_pkr || 0)}`, { x: 60, y: y - 28, size: 16, font: bold, color: white })

    page.drawLine({ start: { x: width / 2, y: y - 8 }, end: { x: width / 2, y: y - 38 }, color: white, thickness: 1 })

    page.drawText('PER PILGRIM', { x: width / 2 + 20, y: y - 12, size: 8, font: bold, color: white })
    page.drawText(`PKR ${fmt(cost.per_pax_selling_pkr || 0)}`, { x: width / 2 + 20, y: y - 28, size: 16, font: bold, color: white })

    y -= boxHeight + 25

    // ═══ PAYMENT SCHEDULE ═══
    page.drawText('PAYMENT SCHEDULE', { x: 40, y, size: 11, font: bold, color: primaryColor })
    page.drawLine({ start: { x: 40, y: y - 3 }, end: { x: 150, y: y - 3 }, color: accentColor, thickness: 2 })
    y -= 25

    // Advance Paid
    page.drawRectangle({ x: 40, y: y - 50, width: (width - 80) / 2 - 5, height: 50, color: lightGray })
    page.drawText('ADVANCE PAID', { x: 50, y: y - 15, size: 8, font: bold, color: gray })
    page.drawText('PKR 0', { x: 50, y: y - 35, size: 14, font: bold, color: darkText })

    // Remaining Balance
    page.drawRectangle({ x: 40 + (width - 80) / 2 + 5, y: y - 50, width: (width - 80) / 2 - 5, height: 50, color: lightGray })

    page.drawText('REMAINING BALANCE', { x: 40 + (width - 80) / 2 + 15, y: y - 15, size: 8, font: bold, color: gray })
    page.drawText(`PKR ${fmt(cost.total_selling_pkr || 0)}`, { x: 40 + (width - 80) / 2 + 15, y: y - 35, size: 14, font: bold, color: primaryColor })

    y -= 75

    // ═══ NOTES & TERMS ═══
    page.drawText('NOTES & TERMS', { x: 40, y, size: 11, font: bold, color: primaryColor })
    page.drawLine({ start: { x: 40, y: y - 3 }, end: { x: 140, y: y - 3 }, color: accentColor, thickness: 2 })
    y -= 20

    const termsText = 'Prices are subject to visa approval and airline seat availability at the time of booking. Hotel category and room-sharing basis as per attached itinerary.'
    const termsLines = termsText.match(/.{1,80}/g) || []
    for (const line of termsLines) {
      page.drawText(line, { x: 40, y, size: 8, font, color: darkText })
      y -= 12
    }

    y -= 8
    page.drawText('This quotation is valid for 7 days from the date of issue. Generated on 18/07/2026.', { x: 40, y, size: 7, font, color: gray })

    y -= 25

    // ═══ BOTTOM BORDER ═══
    page.drawRectangle({ x: 0, y: y - 30, width, height: 30, color: primaryColor })
    page.drawText((store as any).company_name || 'Fast Travels', { x: width - 90, y: y - 12, size: 8, font: bold, color: white })
    page.drawText('SACRED JOURNEYS, SEAMLESS SERVICE', { x: width - 90, y: y - 22, size: 6, font, color: accentColor })

    // ═══ SAVE & DOWNLOAD ═══
    const bytes = await doc.save()
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const filename = calc.customer_name ? `Package-${calc.customer_name.replace(/\s+/g, '-')}.pdf` : 'Package-Quote.pdf'
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return bytes.byteLength
  } catch (err) {
    console.error('[v0] PDF generation error:', err)
    throw err
  }
}
