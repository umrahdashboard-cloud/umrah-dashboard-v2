'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import { GlassCard, GlassSelect, Toggle } from '@/components/glass'
import type {
  VoucherData, Pilgrim, HotelAccommodation, Hotel, HotelContactEntry, TransportContactEntry,
} from '@/lib/types'

function hotelOptionLabel(h: Hotel): string {
  return `${h.name} — ${h.location} (${h.distance})`
}

function ContactSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}) {
  const presetValues = new Set(options.map((o) => o.value))
  const isManual = Boolean(value) && !presetValues.has(value)
  const selectValue = isManual ? '__custom__' : (value || '')

  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <GlassSelect
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value
          if (v === '__custom__') onChange('')
          else onChange(v)
        }}
        className="py-1 px-2"
      >
        <option value="">Select contact…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
        <option value="__custom__">Other (type manually)</option>
      </GlassSelect>
      {(selectValue === '__custom__' || isManual) && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-2 w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}
    </div>
  )
}

interface FormProps {
  data: VoucherData
  onChange: (data: VoucherData) => void
  availableHotels?: { makkah: Hotel[]; madinah: Hotel[] }
  hotelContacts?: HotelContactEntry[]
  transportContacts?: TransportContactEntry[]
  registryHotels?: Hotel[]
}

export function VoucherForm({
  data,
  onChange,
  availableHotels,
  hotelContacts = [],
  transportContacts = [],
  registryHotels = [],
}: FormProps) {
  const [expandedSections, setExpandedSections] = useState({
    voucher: true,
    pilgrims: true,
    hotels: true,
    contacts: true,
    branding: true,
  })

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const updateData = (updates: Partial<VoucherData>) => {
    onChange({ ...data, ...updates })
  }

  const addPilgrim = () => {
    const newPilgrim: Pilgrim = {
      id: Date.now().toString(),
      mutamer_name: '',
      passport_no: '',
      passport_show: false,
      visa_number: '',
      visa_show: false,
      pax: 1,
      beds: 1,
      gender: 'M',
    }
    updateData({ pilgrims: [...data.pilgrims, newPilgrim] })
  }

  const updatePilgrim = (id: string, updates: Partial<Pilgrim>) => {
    updateData({
      pilgrims: data.pilgrims.map(p => p.id === id ? { ...p, ...updates } : p)
    })
  }

  const removePilgrim = (id: string) => {
    updateData({ pilgrims: data.pilgrims.filter(p => p.id !== id) })
  }

  const addHotel = () => {
    const newHotel: HotelAccommodation = {
      id: Date.now().toString(),
      city: 'Makkah',
      confirmation_no: '',
      hotel_name: '',
      hotel_id: null,
      is_custom: false,
      room_type: 'double',
      meal_plan: 'BB',
      checkin_date: '',
      nights: 0,
    }
    updateData({ hotels: [...data.hotels, newHotel] })
  }

  const updateHotel = (id: string, updates: Partial<HotelAccommodation>) => {
    updateData({
      hotels: data.hotels.map(h => h.id === id ? { ...h, ...updates } : h)
    })
  }

  const removeHotel = (id: string) => {
    updateData({ hotels: data.hotels.filter(h => h.id !== id) })
  }

  const hotelNameById = (hotelId: string) =>
    registryHotels.find((h) => h.id === hotelId)?.name ?? 'Unknown hotel'

  const hotelContactOptions = (city: 'Makkah' | 'Madinah') =>
    hotelContacts
      .filter((c) => registryHotels.find((h) => h.id === c.hotel_id)?.city === city)
      .map((c) => ({
        value: c.phone,
        label: `${hotelNameById(c.hotel_id)} — ${c.phone}`,
      }))

  const transportContactOptions = (city: 'Makkah' | 'Madinah' | 'Jeddah') =>
    transportContacts
      .filter((c) => c.city === city)
      .map((c) => ({
        value: `${c.company_name} — ${c.phone}`,
        label: `${c.company_name} — ${c.phone}`,
      }))

  return (
    <div className="space-y-3 ">
      {/* Voucher Information */}
      <FormSection
        title="Voucher Information"
        expanded={expandedSections.voucher}
        onToggle={() => toggleSection('voucher')}

      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Voucher No</label>
            <input
              type="text"
              value={data.voucher_number}
              onChange={(e) => updateData({ voucher_number: e.target.value })}
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="HV-001"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Reference No</label>
            <input
              type="text"
              value={data.reference_no}
              onChange={(e) => updateData({ reference_no: e.target.value })}
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="REF-2024-001"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium mb-1">Date</label>
            <input
              type="date"
              value={data.voucher_date}
              onChange={(e) => updateData({ voucher_date: e.target.value })}
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Family Head</label>
            <input
              type="text"
              value={data.family_head}
              onChange={(e) => updateData({ family_head: e.target.value })}
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Full name"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs font-medium mb-1">Package Info</label>
          <input
            type="text"
            value={data.package_info}
            onChange={(e) => updateData({ package_info: e.target.value })}
            className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Room (30) Nights"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <label className="text-xs font-medium">Company Name (Header)</label>
          <Toggle checked={data.company_name_header_show} onChange={(v) => updateData({ company_name_header_show: v })} />
        </div>
        <input
          type="text"
          value={data.company_name_header}
          onChange={(e) => updateData({ company_name_header: e.target.value })}
          className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary mt-1"
          placeholder="Company name"
        />

        <div className="mt-3 flex items-center justify-between">
          <label className="text-xs font-medium">Company Name (Metadata)</label>
          <Toggle checked={data.company_name_meta_show} onChange={(v) => updateData({ company_name_meta_show: v })} />
        </div>
        <input
          type="text"
          value={data.company_name_meta}
          onChange={(e) => updateData({ company_name_meta: e.target.value })}
          className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary mt-1"
          placeholder="Company name"
        />
      </FormSection>

      {/* Pilgrims Details */}
      <FormSection
        title={`Pilgrims Details (${data.pilgrims.length})`}
        expanded={expandedSections.pilgrims}
        onToggle={() => toggleSection('pilgrims')}
      >
        <div className="space-y-3">
          {data.pilgrims.map((pilgrim, idx) => (
            <div key={pilgrim.id} className="p-3 rounded-lg bg-muted/20 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-primary">Pilgrim {idx + 1}</span>
                {data.pilgrims.length > 1 && (
                  <button
                    onClick={() => removePilgrim(pilgrim.id)}
                    className="text-destructive cursor-pointer hover:bg-destructive/10 p-1 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={pilgrim.mutamer_name}
                  onChange={(e) => updatePilgrim(pilgrim.id, { mutamer_name: e.target.value })}
                  placeholder="Full name"
                  className="px-2 py-1 text-sm rounded border border-border bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary col-span-2"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Passport</label>
                    <input
                      type="text"
                      value={pilgrim.passport_no}
                      onChange={(e) => updatePilgrim(pilgrim.id, { passport_no: e.target.value })}
                      placeholder="Number"
                      className="w-full px-2 py-1 text-sm rounded border border-border bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary mb-2"
                    />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Toggle checked={pilgrim.passport_show} onChange={(v) => updatePilgrim(pilgrim.id, { passport_show: v })} />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Show</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Visa</label>
                    <input
                      type="text"
                      value={pilgrim.visa_number}
                      onChange={(e) => updatePilgrim(pilgrim.id, { visa_number: e.target.value })}
                      placeholder="Number"
                      className="w-full px-2 py-1 text-sm rounded border border-border bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary mb-2"
                    />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Toggle checked={pilgrim.visa_show} onChange={(v) => updatePilgrim(pilgrim.id, { visa_show: v })} />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Show</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Pax</label>
                    <input
                      type="number"
                      value={pilgrim.pax}
                      onChange={(e) => updatePilgrim(pilgrim.id, { pax: parseInt(e.target.value) || 0 })}
                      min="1"
                      className="w-full px-2 py-1 text-sm rounded border border-border bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Beds</label>
                    <input
                      type="number"
                      value={pilgrim.beds}
                      onChange={(e) => updatePilgrim(pilgrim.id, { beds: parseInt(e.target.value) || 0 })}
                      min="1"
                      className="w-full px-2 py-1 text-sm rounded border border-border bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Gender</label>
                  <GlassSelect
                    value={pilgrim.gender}
                    onChange={(e) => updatePilgrim(pilgrim.id, { gender: e.target.value as 'M' | 'F' })}
                    className="py-1 px-2"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </GlassSelect>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addPilgrim}
            className="w-full flex cursor-pointer items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Add Pilgrim</span>
          </button>
        </div>
      </FormSection>

      {/* Accommodation Details */}
      <FormSection
        title={`Accommodation Details (${data.hotels.length})`}
        expanded={expandedSections.hotels}
        onToggle={() => toggleSection('hotels')}
      >
        <div className="space-y-3">
          {data.hotels.map((hotel, idx) => (
            <div key={hotel.id} className="p-3 rounded-lg bg-muted/20 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-primary">Hotel {idx + 1}</span>
                {data.hotels.length > 1 && (
                  <button
                    onClick={() => removeHotel(hotel.id)}
                    className="text-destructive hover:bg-destructive/10 p-1 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <GlassSelect
                  value={hotel.city}
                  onChange={(e) => updateHotel(hotel.id, { city: e.target.value as 'Makkah' | 'Madinah' })}
                  className="py-1 px-2"
                >
                  <option value="Makkah">Makkah</option>
                  <option value="Madinah">Madinah</option>
                </GlassSelect>

                <input
                  type="text"
                  value={hotel.confirmation_no}
                  onChange={(e) => updateHotel(hotel.id, { confirmation_no: e.target.value })}
                  placeholder="Confirmation"
                  className="px-2 py-1 text-sm rounded border border-border bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <GlassSelect
                  value={hotel.is_custom ? 'other' : hotel.hotel_name}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === 'other') {
                      updateHotel(hotel.id, { is_custom: true, hotel_name: '', hotel_id: null })
                      return
                    }
                    const list = hotel.city === 'Makkah' ? availableHotels?.makkah : availableHotels?.madinah
                    const selected = list?.find((h) => h.name === v)
                    updateHotel(hotel.id, {
                      is_custom: false,
                      hotel_name: v,
                      hotel_id: selected?.id ?? null,
                    })
                  }}
                  className="col-span-2 py-1 px-2"
                >
                  <option value="">Select or enter hotel</option>
                  {hotel.city === 'Makkah' && availableHotels?.makkah ? (
                    availableHotels.makkah.map((h) => (
                      <option key={h.id} value={h.name}>{hotelOptionLabel(h)}</option>
                    ))
                  ) : null}
                  {hotel.city === 'Madinah' && availableHotels?.madinah ? (
                    availableHotels.madinah.map((h) => (
                      <option key={h.id} value={h.name}>{hotelOptionLabel(h)}</option>
                    ))
                  ) : null}
                  <option value="other">Other (custom)</option>
                </GlassSelect>

                {hotel.is_custom && (
                  <input
                    type="text"
                    value={hotel.hotel_name}
                    onChange={(e) => updateHotel(hotel.id, { hotel_name: e.target.value })}
                    placeholder="Enter custom hotel name"
                    className="col-span-2 px-2 py-1.5 text-sm rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}

                <GlassSelect
                  value={hotel.room_type}
                  onChange={(e) => updateHotel(hotel.id, { room_type: e.target.value as HotelAccommodation['room_type'] })}
                  className="py-1 px-2"
                >
                  <option value="room">Room</option>
                  <option value="sharing">Sharing</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                  <option value="quad">Quad</option>
                </GlassSelect>

                <GlassSelect
                  value={hotel.meal_plan}
                  onChange={(e) => updateHotel(hotel.id, { meal_plan: e.target.value })}
                  className="py-1 px-2"
                >
                  <option value="BB">BB (Bed & Breakfast)</option>
                  <option value="HB">HB (Half Board)</option>
                  <option value="FB">FB (Full Board)</option>
                  <option value="RO">RO (Room Only)</option>
                </GlassSelect>

                <input
                  type="date"
                  value={hotel.checkin_date}
                  onChange={(e) => updateHotel(hotel.id, { checkin_date: e.target.value })}
                  className="px-2 py-1 text-sm rounded border border-border bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <input
                  type="number"
                  value={hotel.nights}
                  onChange={(e) => updateHotel(hotel.id, { nights: parseInt(e.target.value) || 0 })}
                  placeholder="Nights"
                  min="0"
                  className="px-2 py-1 text-sm rounded border border-border bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {hotel.checkin_date && hotel.nights > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  Check-out: {new Date(new Date(hotel.checkin_date).getTime() + hotel.nights * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addHotel}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed border-border hover:border-primary text-muted-foreground cursor-pointer hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Add Hotel</span>
          </button>
        </div>
      </FormSection>

      {/* Contact & Timing */}
      <FormSection
        title="Contact & Timing"
        expanded={expandedSections.contacts}
        onToggle={() => toggleSection('contacts')}
      >
        <div className="space-y-2">
          <ContactSelect
            label="Makkah Hotel Contact"
            value={data.makkah_hotel_contact}
            onChange={(v) => updateData({ makkah_hotel_contact: v })}
            options={hotelContactOptions('Makkah')}
            placeholder="+966 12 xxx xxxx"
          />

          <ContactSelect
            label="Madinah Hotel Contact"
            value={data.madinah_hotel_contact}
            onChange={(v) => updateData({ madinah_hotel_contact: v })}
            options={hotelContactOptions('Madinah')}
            placeholder="+966 14 xxx xxxx"
          />

          <ContactSelect
            label="Makkah Transport Contact"
            value={data.makkah_transport_contact}
            onChange={(v) => updateData({ makkah_transport_contact: v })}
            options={transportContactOptions('Makkah')}
            placeholder="Company — phone"
          />

          <ContactSelect
            label="Madinah Transport Contact"
            value={data.madinah_transport_contact}
            onChange={(v) => updateData({ madinah_transport_contact: v })}
            options={transportContactOptions('Madinah')}
            placeholder="Company — phone"
          />

          <ContactSelect
            label="Jeddah Transport Contact"
            value={data.jeddah_transport_contact}
            onChange={(v) => updateData({ jeddah_transport_contact: v })}
            options={transportContactOptions('Jeddah')}
            placeholder="Company — phone"
          />

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <label className="block text-xs font-medium mb-1">Check-In Time</label>
              <input
                type="time"
                value={data.checkin_time}
                onChange={(e) => updateData({ checkin_time: e.target.value })}
                className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Check-Out Time</label>
              <input
                type="time"
                value={data.checkout_time}
                onChange={(e) => updateData({ checkout_time: e.target.value })}
                className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </FormSection>

      {/* Branding */}
      <FormSection
        title="Branding & Logo"
        expanded={expandedSections.branding}
        onToggle={() => toggleSection('branding')}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-2">Upload Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    const result = event.target?.result as string
                    updateData({ logo_data: result })
                  }
                  reader.readAsDataURL(file)
                }
              }}
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {data.logo_data && (
              <div className="mt-2 p-2 bg-muted/30 rounded">
                <img src={data.logo_data} alt="Logo preview" className="h-12 w-auto" />
                <button
                  type="button"
                  onClick={() => updateData({ logo_data: null })}
                  className="mt-1 text-xs text-danger hover:underline"
                >
                  Remove logo
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or GIF (recommended: 200x200px)</p>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Show Logo on Page 1</label>
            <Toggle checked={data.logo_show_page1} onChange={(v) => updateData({ logo_show_page1: v })} />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Show Logo on Page 2</label>
            <Toggle checked={data.logo_show_page2} onChange={(v) => updateData({ logo_show_page2: v })} />
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
            💡 Logo stays in your browser only until download — not uploaded or stored on the server.
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Logo Width: {data.logo_width}px</label>
            <input
              type="range"
              min="50"
              max="200"
              value={data.logo_width}
              onChange={(e) => updateData({ logo_width: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Logo Height: {data.logo_height ?? 64}px</label>
            <input
              type="range"
              min="30"
              max="200"
              value={data.logo_height ?? 64}
              onChange={(e) => updateData({ logo_height: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Logo X Position: {data.logo_x}px</label>
            <input
              type="range"
              min="10"
              max="100"
              value={data.logo_x}
              onChange={(e) => updateData({ logo_x: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Logo Y Position: {data.logo_y}px</label>
            <input
              type="range"
              min="10"
              max="100"
              value={data.logo_y}
              onChange={(e) => updateData({ logo_y: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </FormSection>
    </div>
  )
}

function FormSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <GlassCard className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center cursor-pointer justify-between p-4 hover:bg-muted/20 transition-colors"
      >
        <h3 className="text-sm font-semibold">{title}</h3>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {expanded && <div className="border-t border-border px-4 py-3">{children}</div>}
    </GlassCard>
  )
}
