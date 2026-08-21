'use client'

import { useState } from 'react'
import { saveBranding } from '@/lib/actions'
import type { BrandingSettings } from '@/lib/types'
import { GlassButton, GlassCard, GlassInput, GlassTextarea, Field, PageHeader } from '@/components/glass'
import { useToast } from '@/components/toast'

export function BrandingClient({ branding }: { branding: BrandingSettings }) {
  const [b, setB] = useState(branding)
  const toast = useToast()

  const set = <K extends keyof BrandingSettings>(key: K, val: BrandingSettings[K]) =>
    setB((prev) => ({ ...prev, [key]: val }))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title="Invoice Branding" subtitle="Bank details, terms, and PDF layout with live preview" />
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Form */}
        <form
          action={async () => { await saveBranding(b); toast('Branding saved') }}
          className="flex flex-col gap-6"
        >
          <GlassCard className="p-6">
            <h2 className="mb-4 font-heading text-sm font-semibold">Company & Bank</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name"><GlassInput value={b.company_name} onChange={(e) => set('company_name', e.target.value)} /></Field>
              <Field label="Bank name"><GlassInput value={b.bank_name} onChange={(e) => set('bank_name', e.target.value)} /></Field>
              <Field label="Account number / IBAN" className="sm:col-span-2"><GlassInput value={b.account_number} onChange={(e) => set('account_number', e.target.value)} /></Field>
              <Field label="Phone"><GlassInput value={b.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
              <Field label="Email"><GlassInput value={b.email} onChange={(e) => set('email', e.target.value)} /></Field>
              <Field label="Location" className="sm:col-span-2"><GlassInput value={b.location} onChange={(e) => set('location', e.target.value)} /></Field>
              <Field label="Terms & conditions" className="sm:col-span-2">
                <GlassTextarea rows={3} value={b.terms} onChange={(e) => set('terms', e.target.value)} />
              </Field>
              <Field label="Signee name"><GlassInput value={b.signee_name} onChange={(e) => set('signee_name', e.target.value)} /></Field>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="mb-4 font-heading text-sm font-semibold">PDF Layout</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Logo width (pt)"><GlassInput type="number" min={20} max={300} value={b.logo_width} onChange={(e) => set('logo_width', Number(e.target.value))} /></Field>
              <Field label="Logo scale"><GlassInput type="number" min={0.2} max={3} step={0.1} value={b.logo_scale} onChange={(e) => set('logo_scale', Number(e.target.value))} /></Field>
              <Field label="Logo X offset"><GlassInput type="number" value={b.logo_x} onChange={(e) => set('logo_x', Number(e.target.value))} /></Field>
              <Field label="Logo Y offset"><GlassInput type="number" value={b.logo_y} onChange={(e) => set('logo_y', Number(e.target.value))} /></Field>
              <Field label="Primary background">
                <input type="color" value={b.primary_bg} onChange={(e) => set('primary_bg', e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-glass-border bg-input" aria-label="Primary background color" />
              </Field>
              <Field label="Primary text">
                <input type="color" value={b.primary_text} onChange={(e) => set('primary_text', e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-glass-border bg-input" aria-label="Primary text color" />
              </Field>
            </div>
          </GlassCard>

          <GlassButton type="submit" className="self-start">Save Branding</GlassButton>
        </form>

        {/* Live PDF preview pane */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <GlassCard className="overflow-hidden">
            <p className="border-b border-glass-border px-4 py-2.5 text-xs font-medium text-muted-foreground">Live PDF preview</p>
            <div className="aspect-[1/1.35] w-full p-4" style={{ background: '#f5f5f2' }}>
              <div className="relative h-full w-full overflow-hidden rounded shadow-lg" style={{ background: '#ffffff' }}>
                {/* header band */}
                <div className="flex items-start justify-between px-5 py-4" style={{ background: b.primary_bg, color: b.primary_text }}>
                  <div
                    className="flex items-center justify-center rounded font-heading text-[10px] font-bold"
                    style={{
                      width: (b.logo_width * b.logo_scale) / 2,
                      height: 28 * b.logo_scale,
                      marginLeft: b.logo_x / 4,
                      marginTop: b.logo_y / 8,
                      background: 'rgba(255,255,255,0.15)',
                    }}
                  >
                    LOGO
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-sm font-bold">{b.company_name}</p>
                    <p className="text-[9px] opacity-80">{b.location}</p>
                    <p className="text-[9px] opacity-80">{b.phone} · {b.email}</p>
                  </div>
                </div>
                <div className="p-5 text-[10px] leading-relaxed text-neutral-800">
                  <p className="mb-2 font-heading text-xs font-bold">INVOICE #1042</p>
                  <div className="mb-3 grid grid-cols-3 gap-1 border-b border-neutral-200 pb-2 font-medium text-neutral-500">
                    <span>Description</span><span className="text-right">Qty</span><span className="text-right">Amount</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span>Umrah Package (per pax)</span><span className="text-right tabular">4</span><span className="text-right tabular">612,500</span>
                  </div>
                  <div className="mt-4 border-t border-neutral-200 pt-2">
                    <p className="font-medium">Bank: {b.bank_name}</p>
                    <p className="tabular">{b.account_number}</p>
                  </div>
                  <p className="mt-3 text-[8px] leading-relaxed text-neutral-500">{b.terms}</p>
                  <div className="mt-4 flex justify-end">
                    <div className="text-center">
                      <div className="mb-1 h-6 w-24 border-b border-neutral-400" />
                      <p className="text-[8px]">{b.signee_name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
