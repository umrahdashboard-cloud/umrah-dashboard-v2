'use client'

import { useState } from 'react'
import { CircleDollarSign } from 'lucide-react'
import { setExchangeRate } from '@/lib/actions'
import { fmt } from '@/lib/currency'
import { GlassButton, GlassCard, GlassInput, Field, PageHeader } from '@/components/glass'
import { useToast } from '@/components/toast'

export function ExchangeClient({ rate }: { rate: number }) {
  const [value, setValue] = useState(String(rate))
  const toast = useToast()
  const preview = Number(value) || 0

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <PageHeader title="Exchange Rate" subtitle="SAR to PKR factor used live across the entire app" />
      <GlassCard className="p-6">
        <form
          action={async () => {
            await setExchangeRate(Number(value))
            toast('Exchange rate updated app-wide')
          }}
          className="flex flex-col gap-5"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent">
              <CircleDollarSign className="h-6 w-6 text-gold" aria-hidden />
            </span>
            <Field label="1 SAR equals (PKR)" className="flex-1">
              <GlassInput
                type="number" min={1} step="0.01" value={value}
                onChange={(e) => setValue(e.target.value)} required
                className="text-lg font-semibold"
              />
            </Field>
          </div>
          <div className="rounded-lg border border-glass-border bg-white/3 p-4 text-sm">
            <p className="text-muted-foreground">Live preview</p>
            <p className="mt-1 tabular">
              SAR 1,000 = <span className="font-semibold text-gold">PKR {fmt(Math.round(1000 * preview))}</span>
            </p>
          </div>
          <GlassButton type="submit" className="self-start">Update Rate</GlassButton>
        </form>
      </GlassCard>
    </div>
  )
}
