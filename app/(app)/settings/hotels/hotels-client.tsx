'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { upsertHotel, deleteHotel } from '@/lib/actions'
import { fmt } from '@/lib/currency'
import type { Hotel } from '@/lib/types'
import { GlassButton, GlassCard, GlassInput, GlassSelect, Field, PageHeader } from '@/components/glass'
import { SlideOver } from '@/components/overlay'
import { useToast } from '@/components/toast'

const EMPTY: Hotel = {
  id: '', city: 'Makkah', name: '', location: '', distance: '', contact: '',
  room_sar: 0, sharing_sar: 0, double_sar: 0, triple_sar: 0, quad_sar: 0,
}

export function HotelsClient({ hotels }: { hotels: Hotel[] }) {
  const [editing, setEditing] = useState<Hotel | null>(null)
  const [cityFilter, setCityFilter] = useState<'all' | 'Makkah' | 'Madinah'>('all')
  const toast = useToast()

  const filtered = cityFilter === 'all' ? hotels : hotels.filter((h) => h.city === cityFilter)

  async function save(formData: FormData) {
    await upsertHotel({
      id: editing?.id ?? '',
      city: formData.get('city') as Hotel['city'],
      name: String(formData.get('name')),
      location: String(formData.get('location')),
      distance: String(formData.get('distance')),
      contact: String(formData.get('contact')),
      room_sar: Number(formData.get('room_sar')),
      sharing_sar: Number(formData.get('sharing_sar')),
      double_sar: Number(formData.get('double_sar')),
      triple_sar: Number(formData.get('triple_sar')),
      quad_sar: Number(formData.get('quad_sar')),
    })
    toast('Hotel saved')
    setEditing(null)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Hotel Registry"
        subtitle="SAR nightly rates — whole room and per-person by room type"
        actions={
          <div className="flex items-center gap-2">
            <GlassSelect value={cityFilter} onChange={(e) => setCityFilter(e.target.value as typeof cityFilter)} aria-label="Filter city" className="w-32">
              <option value="all">All cities</option>
              <option value="Makkah">Makkah</option>
              <option value="Madinah">Madinah</option>
            </GlassSelect>
            <GlassButton onClick={() => setEditing(EMPTY)}>
              <Plus className="h-4 w-4" aria-hidden /> Add Hotel
            </GlassButton>
          </div>
        }
      />
      <GlassCard className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Hotel</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Distance</th>
              <th className="px-4 py-3 text-right font-medium">Room</th>
              <th className="px-4 py-3 text-right font-medium">Sharing</th>
              <th className="px-4 py-3 text-right font-medium">Double</th>
              <th className="px-4 py-3 text-right font-medium">Triple</th>
              <th className="px-4 py-3 text-right font-medium">Quad</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h, i) => (
              <tr key={h.id} className={i % 2 === 1 ? 'bg-white/2' : ''}>
                <td className="px-4 py-3">
                  <p className="font-medium">{h.name}</p>
                  <p className="text-xs text-muted-foreground">{h.location}</p>
                </td>
                <td className="px-4 py-3">{h.city}</td>
                <td className="px-4 py-3 tabular">{h.distance}</td>
                <td className="px-4 py-3 text-right tabular">{fmt(h.room_sar)}</td>
                <td className="px-4 py-3 text-right tabular">{fmt(h.sharing_sar)}</td>
                <td className="px-4 py-3 text-right tabular">{fmt(h.double_sar)}</td>
                <td className="px-4 py-3 text-right tabular">{fmt(h.triple_sar)}</td>
                <td className="px-4 py-3 text-right tabular">{fmt(h.quad_sar)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(h)} aria-label={`Edit ${h.name}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/6 hover:text-foreground cursor-pointer">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={async () => { await deleteHotel(h.id); toast('Hotel deleted') }}
                      aria-label={`Delete ${h.name}`}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/15 hover:text-danger cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <SlideOver open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Hotel' : 'Add Hotel'}>
        {editing && (
          <form action={save} className="flex flex-col gap-4">
            <Field label="City">
              <GlassSelect name="city" defaultValue={editing.city}>
                <option value="Makkah">Makkah</option>
                <option value="Madinah">Madinah</option>
              </GlassSelect>
            </Field>
            <Field label="Hotel name"><GlassInput name="name" defaultValue={editing.name} required /></Field>
            <Field label="Location"><GlassInput name="location" defaultValue={editing.location} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Distance from Haram"><GlassInput name="distance" defaultValue={editing.distance} placeholder="e.g. 400m" /></Field>
              <Field label="Contact"><GlassInput name="contact" defaultValue={editing.contact} /></Field>
            </div>
            <p className="text-xs font-medium text-gold">SAR rates per night</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Whole room"><GlassInput name="room_sar" type="number" min={0} step="0.01" defaultValue={editing.room_sar || ''} required /></Field>
              <Field label="Sharing (per person)"><GlassInput name="sharing_sar" type="number" min={0} step="0.01" defaultValue={editing.sharing_sar || ''} required /></Field>
              <Field label="Double (per person)"><GlassInput name="double_sar" type="number" min={0} step="0.01" defaultValue={editing.double_sar || ''} required /></Field>
              <Field label="Triple (per person)"><GlassInput name="triple_sar" type="number" min={0} step="0.01" defaultValue={editing.triple_sar || ''} required /></Field>
              <Field label="Quad (per person)"><GlassInput name="quad_sar" type="number" min={0} step="0.01" defaultValue={editing.quad_sar || ''} required /></Field>
            </div>
            <GlassButton type="submit" className="mt-2">Save Hotel</GlassButton>
          </form>
        )}
      </SlideOver>
    </div>
  )
}
