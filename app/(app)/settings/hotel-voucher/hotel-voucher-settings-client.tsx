'use client'

import { useState } from 'react'
import { saveHotelVoucherSettings } from '@/lib/actions'
import { buildDefaultVoucherData, DEFAULT_HOTEL_VOUCHER_COLORS } from '@/lib/hotel-voucher-settings'
import type { HotelVoucherColorScheme, HotelVoucherSettings } from '@/lib/types'
import { GlassButton, GlassCard, GlassInput, GlassTextarea, Field, PageHeader } from '@/components/glass'
import { useToast } from '@/components/toast'
import { VoucherPreview } from '@/app/(app)/hotel-vouchers/preview'

const COLOR_FIELDS: Array<{ key: keyof HotelVoucherColorScheme; label: string }> = [
  { key: 'navy', label: 'Primary (Navy)' },
  { key: 'gold', label: 'Accent (Gold)' },
  { key: 'text', label: 'Body Text' },
  { key: 'muted', label: 'Muted Text' },
  { key: 'border', label: 'Borders' },
  { key: 'lightBg', label: 'Light Background' },
  { key: 'noteBg', label: 'Note Background' },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'left-5' : 'left-0.5'}`}
      />
    </button>
  )
}

export function HotelVoucherSettingsClient({ settings }: { settings: HotelVoucherSettings }) {
  const [s, setS] = useState(settings)
  const toast = useToast()

  const set = <K extends keyof HotelVoucherSettings>(key: K, val: HotelVoucherSettings[K]) =>
    setS((prev) => ({ ...prev, [key]: val }))

  const setColor = (key: keyof HotelVoucherColorScheme, val: string) =>
    setS((prev) => ({ ...prev, colors: { ...prev.colors, [key]: val } }))

  const previewData = buildDefaultVoucherData(s)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Hotel Voucher Settings"
        subtitle="Default logo, PDF color scheme, and Urdu guidelines for new vouchers"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <form
          action={async () => {
            await saveHotelVoucherSettings(s)
            toast('Hotel voucher settings saved')
          }}
          className="flex flex-col gap-6"
        >
          <GlassCard className="p-6">
            <h2 className="mb-4 font-heading text-sm font-semibold">Default Logo</h2>
            <div className="space-y-4">
              <Field label="Upload logo">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = (event) => set('default_logo_data', (event.target?.result as string) ?? null)
                    reader.readAsDataURL(file)
                  }}
                  className="w-full rounded-lg border border-glass-border bg-input px-3 py-2 text-sm"
                />
              </Field>
              {s.default_logo_data && (
                <div className="flex items-center gap-4 rounded-lg border border-glass-border bg-muted/20 p-3">
                  <img src={s.default_logo_data} alt="Logo preview" className="h-14 w-auto" />
                  <GlassButton type="button" variant="ghost" onClick={() => set('default_logo_data', null)}>
                    Remove logo
                  </GlassButton>
                </div>
              )}
              <Field label="Logo width (px)">
                <GlassInput
                  type="number"
                  min={40}
                  max={240}
                  value={s.logo_width}
                  onChange={(e) => set('logo_width', Number(e.target.value))}
                />
              </Field>
              <Field label="Logo height (px)">
                <GlassInput
                  type="number"
                  min={30}
                  max={240}
                  value={s.logo_height ?? 64}
                  onChange={(e) => set('logo_height', Number(e.target.value))}
                />
              </Field>
              <div className="flex items-center justify-between">
                <span className="text-sm">Show logo on page 1</span>
                <Toggle checked={s.logo_show_page1} onChange={(v) => set('logo_show_page1', v)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Show logo on page 2</span>
                <Toggle checked={s.logo_show_page2} onChange={(v) => set('logo_show_page2', v)} />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="mb-4 font-heading text-sm font-semibold">Default Company Names</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Header company name">
                <GlassInput value={s.company_name_header} onChange={(e) => set('company_name_header', e.target.value)} />
              </Field>
              <Field label="Meta company name">
                <GlassInput value={s.company_name_meta} onChange={(e) => set('company_name_meta', e.target.value)} />
              </Field>
              <div className="flex items-center justify-between sm:col-span-2">
                <span className="text-sm">Show header company name</span>
                <Toggle checked={s.company_name_header_show} onChange={(v) => set('company_name_header_show', v)} />
              </div>
              <div className="flex items-center justify-between sm:col-span-2">
                <span className="text-sm">Show meta company name</span>
                <Toggle checked={s.company_name_meta_show} onChange={(v) => set('company_name_meta_show', v)} />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="mb-4 font-heading text-sm font-semibold">PDF Color Scheme</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {COLOR_FIELDS.map(({ key, label }) => (
                <Field key={key} label={label}>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={s.colors[key]}
                      onChange={(e) => setColor(key, e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-glass-border bg-input"
                      aria-label={label}
                    />
                    <GlassInput value={s.colors[key]} onChange={(e) => setColor(key, e.target.value)} />
                  </div>
                </Field>
              ))}
            </div>
            <GlassButton
              type="button"
              variant="ghost"
              className="mt-4"
              onClick={() => set('colors', { ...DEFAULT_HOTEL_VOUCHER_COLORS })}
            >
              Reset colors to default
            </GlassButton>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="mb-4 font-heading text-sm font-semibold">Urdu Guidelines</h2>
            <Field label="Default guidelines (one per line)">
              <GlassTextarea
                rows={12}
                value={s.guidelines_urdu}
                onChange={(e) => set('guidelines_urdu', e.target.value)}
                className="font-[inherit] leading-relaxed"
                dir="rtl"
              />
            </Field>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Default check-in time">
                <GlassInput value={s.checkin_time} onChange={(e) => set('checkin_time', e.target.value)} />
              </Field>
              <Field label="Default check-out time">
                <GlassInput value={s.checkout_time} onChange={(e) => set('checkout_time', e.target.value)} />
              </Field>
            </div>
          </GlassCard>

          <GlassButton type="submit" className="self-start">Save Settings</GlassButton>
        </form>

        <div className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
          <GlassCard className="overflow-hidden">
            <p className="border-b border-glass-border px-4 py-2.5 text-xs font-medium text-muted-foreground">Page 1 preview</p>
            <div className="p-4">
              <VoucherPreview
                data={{ ...previewData, voucher_number: 'HV-001', reference_no: 'REF-001' }}
                page={1}
                colors={s.colors}
              />
            </div>
          </GlassCard>
          <GlassCard className="overflow-hidden">
            <p className="border-b border-glass-border px-4 py-2.5 text-xs font-medium text-muted-foreground">Page 2 preview</p>
            <div className="p-4">
              <VoucherPreview
                data={{ ...previewData, voucher_number: 'HV-001' }}
                page={2}
                colors={s.colors}
              />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
