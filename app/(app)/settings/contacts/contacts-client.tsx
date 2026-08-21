'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Building2, Bus } from 'lucide-react'
import {
  deleteHotelContact,
  deleteTransportContact,
  upsertHotelContact,
  upsertTransportContact,
} from '@/lib/actions'
import type { City, ContactCity, Hotel, HotelContactEntry, TransportContactEntry } from '@/lib/types'
import { GlassButton, GlassCard, GlassInput, GlassSelect, Field, PageHeader } from '@/components/glass'
import { SlideOver } from '@/components/overlay'
import { useToast } from '@/components/toast'

const HOTEL_CITIES: City[] = ['Makkah', 'Madinah']
const TRANSPORT_CITIES: ContactCity[] = ['Makkah', 'Madinah', 'Jeddah']

const EMPTY_HOTEL_CONTACT: HotelContactEntry = { id: '', hotel_id: '', phone: '' }
const EMPTY_TRANSPORT_CONTACT: TransportContactEntry = { id: '', city: 'Makkah', company_name: '', phone: '' }

function CityHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 font-heading text-sm font-semibold text-primary">{children}</h3>
}

export function ContactsClient({
  hotels,
  hotelContacts,
  transportContacts,
}: {
  hotels: Hotel[]
  hotelContacts: HotelContactEntry[]
  transportContacts: TransportContactEntry[]
}) {
  const [editingHotel, setEditingHotel] = useState<(HotelContactEntry & { city?: City }) | null>(null)
  const [editingTransport, setEditingTransport] = useState<TransportContactEntry | null>(null)
  const toast = useToast()

  const hotelName = (hotelId: string) => hotels.find((h) => h.id === hotelId)?.name ?? 'Unknown hotel'

  async function saveHotelContact(formData: FormData) {
    await upsertHotelContact({
      id: editingHotel?.id || undefined,
      hotel_id: String(formData.get('hotel_id')),
      phone: String(formData.get('phone')),
    })
    toast('Hotel contact saved')
    setEditingHotel(null)
  }

  async function saveTransportContact(formData: FormData) {
    await upsertTransportContact({
      id: editingTransport?.id || undefined,
      city: formData.get('city') as ContactCity,
      company_name: String(formData.get('company_name')),
      phone: String(formData.get('phone')),
    })
    toast('Transport contact saved')
    setEditingTransport(null)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Contacts"
        subtitle="Hotel and transport phone numbers for hotel vouchers — grouped by city"
      />

      <GlassCard className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="font-heading text-sm font-semibold">Hotel Contacts</h2>
        </div>

        <div className="flex flex-col gap-8">
          {HOTEL_CITIES.map((city) => {
            const cityHotels = hotels.filter((h) => h.city === city)
            const rows = hotelContacts.filter((c) => cityHotels.some((h) => h.id === c.hotel_id))
            return (
              <div key={city}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <CityHeading>{city}</CityHeading>
                  <GlassButton
                    variant="secondary"
                    onClick={() => setEditingHotel({ ...EMPTY_HOTEL_CONTACT, city })}
                  >
                    <Plus className="h-4 w-4" aria-hidden /> Add {city} Hotel Contact
                  </GlassButton>
                </div>
                {rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No {city} hotel contacts yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-glass-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-glass-border text-left text-xs text-muted-foreground">
                          <th className="px-4 py-3 font-medium">Hotel</th>
                          <th className="px-4 py-3 font-medium">Phone</th>
                          <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((c, i) => (
                          <tr key={c.id} className={i % 2 === 1 ? 'bg-white/2' : ''}>
                            <td className="px-4 py-3 font-medium">{hotelName(c.hotel_id)}</td>
                            <td className="px-4 py-3 tabular">{c.phone}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => setEditingHotel({ ...c, city })}
                                  aria-label="Edit contact"
                                  className="rounded-md p-1.5 text-muted-foreground hover:bg-white/6 hover:text-foreground cursor-pointer"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={async () => { await deleteHotelContact(c.id); toast('Contact deleted') }}
                                  aria-label="Delete contact"
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
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bus className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="font-heading text-sm font-semibold">Transport Contacts</h2>
        </div>

        <div className="flex flex-col gap-8">
          {TRANSPORT_CITIES.map((city) => {
            const rows = transportContacts.filter((c) => c.city === city)
            return (
              <div key={city}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <CityHeading>{city}</CityHeading>
                  <GlassButton
                    variant="secondary"
                    onClick={() => setEditingTransport({ ...EMPTY_TRANSPORT_CONTACT, city })}
                  >
                    <Plus className="h-4 w-4" aria-hidden /> Add {city} Transport Contact
                  </GlassButton>
                </div>
                {rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No {city} transport contacts yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-glass-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-glass-border text-left text-xs text-muted-foreground">
                          <th className="px-4 py-3 font-medium">Company</th>
                          <th className="px-4 py-3 font-medium">Phone</th>
                          <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((c, i) => (
                          <tr key={c.id} className={i % 2 === 1 ? 'bg-white/2' : ''}>
                            <td className="px-4 py-3 font-medium">{c.company_name}</td>
                            <td className="px-4 py-3 tabular">{c.phone}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => setEditingTransport(c)}
                                  aria-label="Edit contact"
                                  className="rounded-md p-1.5 text-muted-foreground hover:bg-white/6 hover:text-foreground cursor-pointer"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={async () => { await deleteTransportContact(c.id); toast('Contact deleted') }}
                                  aria-label="Delete contact"
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
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </GlassCard>

      <SlideOver
        open={!!editingHotel}
        onClose={() => setEditingHotel(null)}
        title={editingHotel?.id ? 'Edit Hotel Contact' : 'Add Hotel Contact'}
      >
        {editingHotel && (
          <form action={saveHotelContact} className="flex flex-col gap-4">
            <Field label="Hotel">
              <GlassSelect name="hotel_id" defaultValue={editingHotel.hotel_id} required>
                <option value="">Select hotel…</option>
                {(editingHotel.city
                  ? hotels.filter((h) => h.city === editingHotel.city)
                  : hotels
                ).map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} — {h.location} ({h.distance})
                  </option>
                ))}
              </GlassSelect>
            </Field>
            <Field label="Phone number">
              <GlassInput name="phone" defaultValue={editingHotel.phone} placeholder="+966 12 xxx xxxx" required />
            </Field>
            <GlassButton type="submit" className="mt-2">Save Contact</GlassButton>
          </form>
        )}
      </SlideOver>

      <SlideOver
        open={!!editingTransport}
        onClose={() => setEditingTransport(null)}
        title={editingTransport?.id ? 'Edit Transport Contact' : 'Add Transport Contact'}
      >
        {editingTransport && (
          <form action={saveTransportContact} className="flex flex-col gap-4">
            <Field label="City">
              <GlassSelect name="city" defaultValue={editingTransport.city} required>
                {TRANSPORT_CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </GlassSelect>
            </Field>
            <Field label="Transport company">
              <GlassInput name="company_name" defaultValue={editingTransport.company_name} placeholder="Company name" required />
            </Field>
            <Field label="Phone number">
              <GlassInput name="phone" defaultValue={editingTransport.phone} placeholder="+966 55 xxx xxxx" required />
            </Field>
            <GlassButton type="submit" className="mt-2">Save Contact</GlassButton>
          </form>
        )}
      </SlideOver>
    </div>
  )
}
