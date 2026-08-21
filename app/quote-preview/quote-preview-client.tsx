'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { QuotePreview } from '@/components/quote-preview'
import type { CostBreakdown } from '@/lib/calc'
import type { BrandingSettings, CalculatorState } from '@/lib/types'

function QuoteContent({ branding }: { branding: BrandingSettings }) {
  const searchParams = useSearchParams()
  const calcJson = searchParams.get('calc')
  const costJson = searchParams.get('cost')

  if (!calcJson || !costJson) {
    return <div className="p-8 text-center">Error: Quote data not found</div>
  }

  let calc: CalculatorState
  let cost: CostBreakdown

  try {
    calc = JSON.parse(calcJson)
    cost = JSON.parse(costJson)
  } catch (err) {
    console.error('Parse error:', err)
    return <div className="p-8 text-center">Error: Invalid quote data</div>
  }

  return (
    <QuotePreview
      calc={calc}
      cost={cost}
      branding={branding}
    />
  )
}

export function QuotePreviewClient({ branding }: { branding: BrandingSettings }) {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading quote...</div>}>
      <QuoteContent branding={branding} />
    </Suspense>
  )
}
