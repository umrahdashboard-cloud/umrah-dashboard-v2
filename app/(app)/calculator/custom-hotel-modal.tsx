'use client'

import { useEffect, useState } from 'react'
import { GlassButton, GlassInput, Field } from '@/components/glass'
import { GlassModal } from '@/components/overlay'
import type { CustomHotelData } from '@/lib/types'
import { EMPTY_CUSTOM_HOTEL } from '@/lib/hotel-custom'

export function CustomHotelModal({
  open,
  city,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  city: 'Makkah' | 'Madinah'
  initial: CustomHotelData | null
  onClose: () => void
  onSave: (data: CustomHotelData) => void
}) {
  const [form, setForm] = useState<CustomHotelData>(EMPTY_CUSTOM_HOTEL)

  useEffect(() => {
    if (open) setForm(initial ?? EMPTY_CUSTOM_HOTEL)
  }, [open, initial])

  const set = <K extends keyof CustomHotelData>(key: K, val: CustomHotelData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleSave = () => {
    if (!form.name.trim()) return
    onSave({
      ...form,
      name: form.name.trim(),
      location: form.location.trim(),
      distance: form.distance.trim(),
    })
  }

  return (
    <GlassModal open={open} onClose={onClose} title={`Custom ${city} Hotel`} wide>
      <div className="grid gap-4">
        <Field label="Hotel name">
          <GlassInput value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Hotel name" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Distance from Haram">
            <GlassInput value={form.distance} onChange={(e) => set('distance', e.target.value)} placeholder="e.g. 400m" />
          </Field>
          <Field label="Location">
            <GlassInput value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Central Zone" />
          </Field>
        </div>
        <p className="text-xs font-medium text-gold">SAR rates per night</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Whole room">
            <GlassInput type="number" min={0} step="0.01" value={form.room_sar || ''} onChange={(e) => set('room_sar', Number(e.target.value) || 0)} />
          </Field>
          <Field label="Sharing (per person)">
            <GlassInput type="number" min={0} step="0.01" value={form.sharing_sar || ''} onChange={(e) => set('sharing_sar', Number(e.target.value) || 0)} />
          </Field>
          <Field label="Double (per person)">
            <GlassInput type="number" min={0} step="0.01" value={form.double_sar || ''} onChange={(e) => set('double_sar', Number(e.target.value) || 0)} />
          </Field>
          <Field label="Triple (per person)">
            <GlassInput type="number" min={0} step="0.01" value={form.triple_sar || ''} onChange={(e) => set('triple_sar', Number(e.target.value) || 0)} />
          </Field>
          <Field label="Quad (per person)">
            <GlassInput type="number" min={0} step="0.01" value={form.quad_sar || ''} onChange={(e) => set('quad_sar', Number(e.target.value) || 0)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <GlassButton type="button" variant="ghost" onClick={onClose}>Cancel</GlassButton>
          <GlassButton type="button" onClick={handleSave} disabled={!form.name.trim()}>Save Hotel</GlassButton>
        </div>
      </div>
    </GlassModal>
  )
}
