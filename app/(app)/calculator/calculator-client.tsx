'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plane, Stamp, Bus, Building2, Landmark, Wallet, Save, RotateCcw, Download, Copy, FileText } from 'lucide-react'
import {
  GlassCard, GlassInput, GlassSelect, GlassButton, Field, Toggle, PageHeader,
} from '@/components/glass'
import { CountUp } from '@/components/count-up'
import { useToast } from '@/components/toast'
import { computeCosts, DEFAULT_CALC, visaTierRate, type MasterData } from '@/lib/calc'
import { fmt, fromPkr } from '@/lib/currency'
import { saveBooking, saveInvoiceFromCalculator } from '@/lib/actions'
import { canWrite } from '@/lib/roles'
import { CustomHotelModal } from './custom-hotel-modal'
import { CUSTOM_HOTEL_ID, resolveHotel } from '@/lib/hotel-custom'
import type {
  Airline, CalculatorState, Currency, Hotel, Role, RouteVehicleRate, RoomType,
  TransportRoute, Vehicle, VisaSettings, Ziarat,
} from '@/lib/types'

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: 'sharing', label: 'Sharing (per person)' },
  { value: 'double', label: 'Double (per person)' },
  { value: 'triple', label: 'Triple (per person)' },
  { value: 'quad', label: 'Quad (per person)' },
  { value: 'room', label: 'Whole Room' },
]

function Section({
  icon: Icon, title, enabled, onToggle, children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  enabled: boolean
  onToggle: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="font-heading text-sm font-semibold">{title}</h2>
        </div>
        <Toggle checked={enabled} onChange={onToggle} label={`Toggle ${title}`} />
      </div>
      {enabled && <div className="mt-4">{children}</div>}
    </GlassCard>
  )
}

function NumField({
  label, value, onChange, min = 0,
}: { label: string; value: number; onChange: (n: number) => void; min?: number }) {
  return (
    <Field label={label}>
      <GlassInput
        type="number"
        min={min}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
      />
    </Field>
  )
}

export function CalculatorClient(props: {
  role: Role
  initial: CalculatorState | null
  editBookingId: string | null
  editInvoiceId: string | null
  airlines: Airline[]
  hotels: Hotel[]
  visa: VisaSettings
  vehicles: Vehicle[]
  routes: TransportRoute[]
  rateMatrix: RouteVehicleRate[]
  ziarats: Ziarat[]
  exchangeRate: number
}) {
  const {
    role, initial, editBookingId, editInvoiceId, airlines, hotels, visa,
    vehicles, routes, rateMatrix, ziarats, exchangeRate,
  } = props

  const [s, setS] = useState<CalculatorState>(() => (initial ? { ...DEFAULT_CALC, ...initial } : DEFAULT_CALC))
  const [customHotelModal, setCustomHotelModal] = useState<'makkah' | 'madinah' | null>(null)
  const [pending, startTransition] = useTransition()
  const toast = useToast()
  const router = useRouter()

  const master: MasterData = useMemo(
    () => ({ airlines, hotels, visa, rateMatrix, ziarats, exchangeRate }),
    [airlines, hotels, visa, rateMatrix, ziarats, exchangeRate],
  )
  const cost = useMemo(() => computeCosts(s, master), [s, master])

  const set = <K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) =>
    setS((prev) => ({ ...prev, [key]: value }))

  const makkahHotels = hotels.filter((h) => h.city === 'Makkah')
  const madinahHotels = hotels.filter((h) => h.city === 'Madinah')
  const cur: Currency = s.currency
  const disp = (pkr: number) => fmt(fromPkr(pkr, cur, exchangeRate), cur)

  const onSaveInvoice = () => {
    startTransition(async () => {
      try {
        const res = await saveInvoiceFromCalculator({
          invoice_id: editInvoiceId,
          calc: s,
        })
        if (!res?.id) throw new Error('Invalid response from server')
        toast(editInvoiceId ? 'Invoice updated' : 'Invoice saved')
        router.push('/invoices')
      } catch (error) {
        console.error('[v0] Save invoice error:', error)
        toast(`Error saving invoice: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      }
    })
  }

  const pageTitle = editInvoiceId
    ? 'Edit Invoice Package'
    : editBookingId
      ? 'Edit Booking Package'
      : 'Package Calculator'

  const onSave = () => {
    startTransition(async () => {
      try {
        const airline = airlines.find((a) => a.id === s.airline_id)
        const res = await saveBooking({
          booking_id: editBookingId,
          calc: s,
          computed: {
            airline_name: s.tickets_enabled
              ? (s.ticket_custom ? s.ticket_custom_label || 'Custom Ticket' : airline?.name ?? '')
              : '',
            total_pkr: cost.total_selling_pkr,
            cost_pkr: cost.total_cost_pkr,
            profit_pkr: cost.profit_pkr,
            advance_pkr: cost.advance_pkr,
            makkah_hotel_name: resolveHotel(s.makkah_hotel_id, s.makkah_custom_hotel, 'Makkah', hotels)?.name ?? '',
            madinah_hotel_name: resolveHotel(s.madinah_hotel_id, s.madinah_custom_hotel, 'Madinah', hotels)?.name ?? '',
          },
        })
        if (!res || !res.id) throw new Error('Invalid response from server')
        toast(editBookingId ? 'Booking updated' : 'Booking saved')
        router.push(`/bookings?highlight=${res.id}`)
      } catch (error) {
        console.error('[v0] Save booking error:', error)
        toast(`Error saving booking: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      }
    })
  }

  const onCopyPackage = async () => {
    try {
      const roomLabel = (rt: RoomType) =>
        rt === 'room' ? 'Whole Room' : `${rt.charAt(0).toUpperCase()}${rt.slice(1)} Room`

      const paxParts: string[] = []
      if (s.adults > 0) paxParts.push(`${s.adults} Adult${s.adults > 1 ? 's' : ''}`)
      if (s.children > 0) paxParts.push(`${s.children} Child${s.children > 1 ? 'ren' : ''}`)
      if (s.infants > 0) paxParts.push(`${s.infants} Infant${s.infants > 1 ? 's' : ''}`)

      const totalNights =
        (s.makkah_enabled ? s.makkah_nights : 0) + (s.madinah_enabled ? s.madinah_nights : 0)

      const airlineName = s.tickets_enabled
        ? (s.ticket_custom
          ? s.ticket_custom_label || 'Custom Ticket'
          : airlines.find((a) => a.id === s.airline_id)?.name ?? '')
        : ''

      const lines: string[] = []
      lines.push('🏷️ *Amere Taiba International*')
      lines.push(`🕋 *${totalNights} Nights Umrah Package*`)
      if (airlineName) lines.push(`🛫 Airline: ${airlineName}`)
      if (paxParts.length > 0) lines.push(`👤 Passengers: ${paxParts.join(', ')}`)

      if (s.makkah_enabled) {
        const h = resolveHotel(s.makkah_hotel_id, s.makkah_custom_hotel, 'Makkah', hotels)
        if (h) {
          lines.push('🏨 *Makkah Hotel*')
          lines.push(`${h.name} · ${h.distance} · ${h.location}`)
          lines.push(`🛏️ ${roomLabel(s.makkah_room_type)} | 🌙 ${s.makkah_nights} Nights`)
        }
      }

      if (s.madinah_enabled) {
        const h = resolveHotel(s.madinah_hotel_id, s.madinah_custom_hotel, 'Madinah', hotels)
        if (h) {
          lines.push('🏨 *Madinah Hotel*')
          lines.push(`${h.name} · ${h.distance} · ${h.location}`)
          lines.push(`🛏️ ${roomLabel(s.madinah_room_type)} | 🌙 ${s.madinah_nights} Nights`)
        }
      }

      if (s.transport_enabled && s.route_ids.length > 0) {
        const routeNames = routes
          .filter((r) => s.route_ids.includes(r.id))
          .map((r) => r.name)
          .join(' + ')
        lines.push(`🚗 *Transport:* ${routeNames} (Included)`)
      }

      const perPerson = Math.round(cost.per_pax_selling_pkr)
      lines.push(`💰 *Per Person: PKR ${fmt(perPerson)}*`)
      lines.push(`💰 *Package Price Total (${cost.total_pax}) Pax: PKR ${fmt(cost.total_selling_pkr)}*`)
      lines.push('🟢 Contact: +923052394810')

      await navigator.clipboard.writeText(lines.join('\n'))
      toast('Package copied to clipboard')
    } catch (err) {
      console.error('Copy package error:', err)
      toast('Failed to copy package', 'error')
    }
  }

  const onPreviewQuote = () => {
    try {
      const url = new URL('/quote-preview', window.location.origin)
      url.searchParams.set('calc', JSON.stringify(s))
      url.searchParams.set('cost', JSON.stringify(cost))
      window.open(url, '_blank')
      toast('Quote opened — use Print / Save PDF')
    } catch (error) {
      console.error('[v0] Quote preview error:', error)
      toast(`Failed to open quote: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={pageTitle}
        subtitle={`Exchange rate: 1 SAR = ${exchangeRate} PKR`}
        actions={
          <div className="flex items-center gap-2">
            <div className="glass flex items-center rounded-lg p-1" role="group" aria-label="Display currency">
              {(['PKR', 'SAR'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => set('currency', c)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${cur === c ? 'btn-gradient text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <GlassButton variant="ghost" onClick={() => setS(DEFAULT_CALC)}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
            </GlassButton>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ── Left: input sections ── */}
        <div className="flex flex-col gap-4">
          {/* Customer + pax */}
          <GlassCard className="p-5">
            <h2 className="font-heading mb-4 text-sm font-semibold">Customer &amp; Travelers</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Customer Name" className="sm:col-span-2">
                <GlassInput
                  value={s.customer_name}
                  onChange={(e) => set('customer_name', e.target.value)}
                  placeholder="e.g. Muhammad Farooq (Family)"
                />
              </Field>
              <Field label="Travel Date">
                <GlassInput type="date" value={s.travel_date} onChange={(e) => set('travel_date', e.target.value)} />
              </Field>
              <NumField label="Adults" value={s.adults} onChange={(n) => set('adults', n)} />
              <NumField label="Children (2–11)" value={s.children} onChange={(n) => set('children', n)} />
              <NumField label="Infants (<2)" value={s.infants} onChange={(n) => set('infants', n)} />
            </div>
          </GlassCard>

          {/* Tickets */}
          <Section icon={Plane} title="Flight Tickets" enabled={s.tickets_enabled} onToggle={(v) => set('tickets_enabled', v)}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Toggle checked={s.ticket_custom} onChange={(v) => set('ticket_custom', v)} label="Custom ticket price" />
                <span className="text-xs text-muted-foreground">Custom price (override airline rates)</span>
              </div>
              {s.ticket_custom ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Label">
                    <GlassInput value={s.ticket_custom_label} onChange={(e) => set('ticket_custom_label', e.target.value)} placeholder="e.g. Group fare" />
                  </Field>
                  <NumField label="Total Amount" value={s.ticket_custom_amount} onChange={(n) => set('ticket_custom_amount', n)} />
                  <Field label="Currency">
                    <GlassSelect value={s.ticket_custom_currency} onChange={(e) => set('ticket_custom_currency', e.target.value as Currency)}>
                      <option value="PKR">PKR</option>
                      <option value="SAR">SAR</option>
                    </GlassSelect>
                  </Field>
                </div>
              ) : (
                <Field label="Airline">
                  <GlassSelect value={s.airline_id} onChange={(e) => set('airline_id', e.target.value)}>
                    <option value="">Select airline…</option>
                    {airlines.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} — Adult {fmt(a.adult_pkr)} / Child {fmt(a.child_pkr)} / Infant {fmt(a.infant_pkr)}
                      </option>
                    ))}
                  </GlassSelect>
                </Field>
              )}
            </div>
          </Section>

          {/* Visa */}
          <Section icon={Stamp} title="Umrah Visa" enabled={s.visa_enabled} onToggle={(v) => set('visa_enabled', v)}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Toggle checked={s.visa_custom} onChange={(v) => set('visa_custom', v)} label="Custom visa price" />
                <span className="text-xs text-muted-foreground">Custom total (PKR)</span>
              </div>
              {s.visa_custom ? (
                <NumField label="Visa Total (PKR)" value={s.visa_custom_pkr} onChange={(n) => set('visa_custom_pkr', n)} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Tiered adult rate: <span className="tabular text-foreground">SAR {visaTierRate(visa, s.adults)}</span> / adult ({s.adults || 0} adults)
                  {' · '}Child SAR {visa.child_sar}{' · '}Infant SAR {visa.infant_sar}
                </p>
              )}
            </div>
          </Section>

          {/* Transport */}
          <Section icon={Bus} title="Transport" enabled={s.transport_enabled} onToggle={(v) => set('transport_enabled', v)}>
            <div className="flex flex-col gap-4">
              <Field label="Vehicle">
                <GlassSelect value={s.vehicle_id} onChange={(e) => set('vehicle_id', e.target.value)}>
                  <option value="">Select vehicle…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </GlassSelect>
              </Field>
              <fieldset>
                <legend className="mb-2 text-xs font-medium text-muted-foreground">Routes</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {routes.map((r) => {
                    const active = s.route_ids.includes(r.id)
                    const rate = rateMatrix.find((x) => x.route_id === r.id && x.vehicle_id === s.vehicle_id)?.rate_sar
                    return (
                      <button
                        key={r.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          set('route_ids', active ? s.route_ids.filter((id) => id !== r.id) : [...s.route_ids, r.id])
                        }
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${active ? 'border-accent/60 bg-accent/10 text-foreground' : 'border-glass-border bg-input text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        <span>{r.name}</span>
                        <span className="tabular shrink-0 pl-2">{rate != null ? `SAR ${rate}` : '—'}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            </div>
          </Section>

          {/* Hotels */}
          {(
            [
              { key: 'makkah' as const, label: 'Makkah Hotel', list: makkahHotels },
              { key: 'madinah' as const, label: 'Madinah Hotel', list: madinahHotels },
            ]
          ).map(({ key, label, list }) => {
            const enabled = key === 'makkah' ? s.makkah_enabled : s.madinah_enabled
            const hotelId = key === 'makkah' ? s.makkah_hotel_id : s.madinah_hotel_id
            const roomType = key === 'makkah' ? s.makkah_room_type : s.madinah_room_type
            const nights = key === 'makkah' ? s.makkah_nights : s.madinah_nights
            return (
              <Section
                key={key}
                icon={Building2}
                title={label}
                enabled={enabled}
                onToggle={(v) => set(`${key}_enabled`, v)}
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Hotel" className="sm:col-span-3">
                    <GlassSelect
                      value={hotelId}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === CUSTOM_HOTEL_ID) {
                          setCustomHotelModal(key)
                          return
                        }
                        set(`${key}_hotel_id`, v)
                        set(`${key}_custom_hotel`, null)
                      }}
                    >
                      <option value="">Select hotel…</option>
                      {list.map((h: Hotel) => (
                        <option key={h.id} value={h.id}>
                          {h.name} — {h.location} ({h.distance})
                        </option>
                      ))}
                      <option value={CUSTOM_HOTEL_ID}>Other (custom)…</option>
                    </GlassSelect>
                    {hotelId === CUSTOM_HOTEL_ID && s[`${key}_custom_hotel`]?.name && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Using: {s[`${key}_custom_hotel`]!.name}
                        {s[`${key}_custom_hotel`]!.distance ? ` (${s[`${key}_custom_hotel`]!.distance})` : ''}
                        {' · '}
                        <button
                          type="button"
                          onClick={() => setCustomHotelModal(key)}
                          className="text-primary hover:underline cursor-pointer"
                        >
                          Edit custom hotel
                        </button>
                      </p>
                    )}
                  </Field>
                  <Field label="Room Type" className="sm:col-span-2">
                    <GlassSelect value={roomType} onChange={(e) => set(`${key}_room_type`, e.target.value as RoomType)}>
                      {ROOM_TYPES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </GlassSelect>
                  </Field>
                  <NumField label="Nights" value={nights} onChange={(n) => set(`${key}_nights`, n)} />
                </div>
              </Section>
            )
          })}

          {/* Ziarat */}
          <Section icon={Landmark} title="Ziarat Tours" enabled={s.ziarat_enabled} onToggle={(v) => set('ziarat_enabled', v)}>
            <div className="grid gap-2 sm:grid-cols-2">
              {ziarats.map((z) => {
                const active = s.ziarat_ids.includes(z.id)
                return (
                  <button
                    key={z.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      set('ziarat_ids', active ? s.ziarat_ids.filter((id) => id !== z.id) : [...s.ziarat_ids, z.id])
                    }
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${active ? 'border-accent/60 bg-accent/10 text-foreground' : 'border-glass-border bg-input text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <span>{z.name}</span>
                    <span className="tabular shrink-0 pl-2">SAR {z.rate_sar} / pax</span>
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Pricing */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2.5">
              <Wallet className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="font-heading text-sm font-semibold">Pricing &amp; Margin</h2>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Margin Mode">
                <GlassSelect
                  value={s.margin_mode}
                  onChange={(e) => set('margin_mode', e.target.value as 'percent' | 'fixed')}
                  disabled={s.selling_override_enabled}
                >
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed amount ({cur})</option>
                </GlassSelect>
              </Field>
              <NumField
                label={s.margin_mode === 'percent' ? 'Margin %' : `Margin (${cur})`}
                value={s.margin_value}
                onChange={(n) => set('margin_value', n)}
              />
              <NumField label={`Advance Received (${cur})`} value={s.advance} onChange={(n) => set('advance', n)} />
              <div className="flex items-center gap-3 sm:col-span-3">
                <Toggle
                  checked={s.selling_override_enabled}
                  onChange={(v) => set('selling_override_enabled', v)}
                  label="Override selling price"
                />
                <span className="text-xs text-muted-foreground">Override total selling price</span>
                {s.selling_override_enabled && (
                  <GlassInput
                    type="number"
                    min={0}
                    className="max-w-[180px]"
                    value={s.selling_override}
                    onChange={(e) => set('selling_override', Math.max(0, Number(e.target.value) || 0))}
                    aria-label={`Selling price override in ${cur}`}
                  />
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ── Right: live summary ── */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <GlassCard blur className="p-5">
            <h2 className="font-heading text-sm font-semibold">Live Summary</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {cost.total_pax} pax · displayed in {cur}
            </p>

            <dl className="mt-4 flex flex-col gap-2 text-sm">
              {(
                [
                  ['Tickets', cost.tickets_pkr, s.tickets_enabled],
                  ['Visa', cost.visa_pkr, s.visa_enabled],
                  ['Transport', cost.transport_pkr, s.transport_enabled],
                  ['Makkah Hotel', cost.makkah_pkr, s.makkah_enabled],
                  ['Madinah Hotel', cost.madinah_pkr, s.madinah_enabled],
                  ['Ziarat', cost.ziarat_pkr, s.ziarat_enabled],
                ] as const
              ).map(([label, pkr, on]) => (
                <div key={label} className={`flex items-center justify-between ${on ? '' : 'opacity-35'}`}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="tabular">{disp(pkr)}</dd>
                </div>
              ))}
              <div className="my-1 border-t border-glass-border" role="presentation" />
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Total Cost</dt>
                <dd className="tabular">{disp(cost.total_cost_pkr)}</dd>
              </div>
              <div className="flex items-center justify-between text-success">
                <dt>Profit</dt>
                <dd className="tabular">{disp(cost.profit_pkr)}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-4">
              <p className="text-xs text-muted-foreground">Total Selling Price</p>
              <p className="font-heading mt-1 text-2xl font-semibold tabular">
                {cur}{' '}
                <CountUp value={fromPkr(cost.total_selling_pkr, cur, exchangeRate)} />
              </p>
              <p className="mt-1 text-xs text-muted-foreground tabular">
                ≈ {disp(Math.round(cost.per_pax_selling_pkr))} / pax
              </p>
            </div>

            <dl className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Advance</dt>
                <dd className="tabular">{disp(cost.advance_pkr)}</dd>
              </div>
              <div className="flex items-center justify-between font-medium">
                <dt>Remaining</dt>
                <dd className={`tabular ${cost.remaining_pkr > 0 ? 'text-warning' : 'text-success'}`}>
                  {disp(cost.remaining_pkr)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-col gap-2">
              <GlassButton className="w-full rounded-full" onClick={onCopyPackage}>
                <Copy className="h-4 w-4" aria-hidden />
                Copy Package
              </GlassButton>
              <GlassButton className="w-full rounded-full" onClick={onPreviewQuote}>
                <Download className="h-4 w-4" aria-hidden />
                Download PDF Quote
              </GlassButton>
              {canWrite(role) && editInvoiceId && (
                <GlassButton className="w-full rounded-full" onClick={onSaveInvoice} disabled={pending}>
                  <Save className="h-4 w-4" aria-hidden />
                  {pending ? 'Saving…' : 'Update Invoice'}
                </GlassButton>
              )}
              {canWrite(role) && !editInvoiceId && (
                <GlassButton className="w-full rounded-full" onClick={onSave} disabled={pending}>
                  <Save className="h-4 w-4" aria-hidden />
                  {pending ? 'Saving…' : editBookingId ? 'Update Booking' : 'Save as Booking'}
                </GlassButton>
              )}
              {canWrite(role) && !editInvoiceId && !editBookingId && (
                <GlassButton className="w-full rounded-full" variant="secondary" onClick={onSaveInvoice} disabled={pending}>
                  <FileText className="h-4 w-4" aria-hidden />
                  {pending ? 'Saving…' : 'Save as Invoice'}
                </GlassButton>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      <CustomHotelModal
        open={customHotelModal !== null}
        city={customHotelModal === 'madinah' ? 'Madinah' : 'Makkah'}
        initial={customHotelModal ? s[`${customHotelModal}_custom_hotel`] : null}
        onClose={() => setCustomHotelModal(null)}
        onSave={(data) => {
          if (!customHotelModal) return
          set(`${customHotelModal}_hotel_id`, CUSTOM_HOTEL_ID)
          set(`${customHotelModal}_custom_hotel`, data)
          setCustomHotelModal(null)
        }}
      />
    </div>
  )
}
