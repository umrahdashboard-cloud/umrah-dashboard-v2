// ── Pure package-cost engine. All amounts computed in PKR internally. ──
import { sarToPkr, toPkr } from './currency'
import type {
  Airline, CalculatorState, CustomHotelData, Hotel, RouteVehicleRate, RoomType,
  VisaSettings, Ziarat,
} from './types'
import { resolveHotel } from './hotel-custom'

export interface MasterData {
  airlines: Airline[]
  hotels: Hotel[]
  visa: VisaSettings
  rateMatrix: RouteVehicleRate[]
  ziarats: Ziarat[]
  exchangeRate: number
}

export interface CostBreakdown {
  tickets_pkr: number
  visa_pkr: number
  transport_pkr: number
  makkah_pkr: number
  madinah_pkr: number
  ziarat_pkr: number
  total_cost_pkr: number
  profit_pkr: number
  total_selling_pkr: number
  advance_pkr: number
  remaining_pkr: number
  total_pax: number
  per_pax_selling_pkr: number
}

function hotelRate(hotel: Hotel, type: RoomType): number {
  switch (type) {
    case 'room': return hotel.room_sar
    case 'sharing': return hotel.sharing_sar
    case 'double': return hotel.double_sar
    case 'triple': return hotel.triple_sar
    case 'quad': return hotel.quad_sar
  }
}

/** Tiered adult visa rate per pax based on adult count */
export function visaTierRate(visa: VisaSettings, adults: number): number {
  if (adults <= 0) return 0
  if (adults === 1) return visa.pax_1_sar
  if (adults === 2) return visa.pax_2_sar
  if (adults === 3) return visa.pax_3_sar
  if (adults === 4) return visa.pax_4_sar
  // ASSUMPTION: 50+ pax falls back to the 5–49 group rate (no larger tier specified)
  return visa.group_sar
}

export function computeCosts(s: CalculatorState, m: MasterData): CostBreakdown {
  const rate = m.exchangeRate
  const paying = Math.max(1, s.adults + s.children) // infants don't occupy beds

  // Tickets
  let tickets_pkr = 0
  if (s.tickets_enabled) {
    if (s.ticket_custom) {
      tickets_pkr = toPkr(s.ticket_custom_amount, s.ticket_custom_currency, rate)
    } else {
      const al = m.airlines.find((a) => a.id === s.airline_id)
      if (al) {
        tickets_pkr = al.adult_pkr * s.adults + al.child_pkr * s.children + al.infant_pkr * s.infants
      }
    }
  }

  // Visa
  let visa_pkr = 0
  if (s.visa_enabled) {
    if (s.visa_custom) {
      visa_pkr = Math.round(s.visa_custom_pkr)
    } else {
      const sar =
        visaTierRate(m.visa, s.adults) * s.adults +
        m.visa.child_sar * s.children +
        m.visa.infant_sar * s.infants
      visa_pkr = sarToPkr(sar, rate)
    }
  }

  // Transport (sum of route rates for chosen vehicle)
  let transport_pkr = 0
  if (s.transport_enabled && s.vehicle_id) {
    const sar = s.route_ids.reduce((sum, rid) => {
      const cell = m.rateMatrix.find((x) => x.route_id === rid && x.vehicle_id === s.vehicle_id)
      return sum + (cell?.rate_sar ?? 0)
    }, 0)
    transport_pkr = sarToPkr(sar, rate)
  }

  // Hotels
  const hotelCost = (
    enabled: boolean,
    hotelId: string,
    custom: CustomHotelData | null | undefined,
    city: 'Makkah' | 'Madinah',
    type: RoomType,
    nights: number,
  ): number => {
    if (!enabled || !hotelId || nights <= 0) return 0
    const h = resolveHotel(hotelId, custom, city, m.hotels)
    if (!h) return 0
    const r = hotelRate(h, type)
    const sar = type === 'room' ? r * nights : r * nights * paying
    return sarToPkr(sar, rate)
  }
  const makkah_pkr = hotelCost(s.makkah_enabled, s.makkah_hotel_id, s.makkah_custom_hotel, 'Makkah', s.makkah_room_type, s.makkah_nights)
  const madinah_pkr = hotelCost(s.madinah_enabled, s.madinah_hotel_id, s.madinah_custom_hotel, 'Madinah', s.madinah_room_type, s.madinah_nights)

  // Ziarats — per paying pax
  let ziarat_pkr = 0
  if (s.ziarat_enabled) {
    const sar = s.ziarat_ids.reduce((sum, zid) => {
      const z = m.ziarats.find((x) => x.id === zid)
      return sum + (z?.rate_sar ?? 0)
    }, 0)
    ziarat_pkr = sarToPkr(sar * paying, rate)
  }

  const total_cost_pkr = tickets_pkr + visa_pkr + transport_pkr + makkah_pkr + madinah_pkr + ziarat_pkr

  // Margin / selling
  let total_selling_pkr: number
  if (s.selling_override_enabled && s.selling_override > 0) {
    total_selling_pkr = toPkr(s.selling_override, s.currency, rate)
  } else if (s.margin_mode === 'percent') {
    total_selling_pkr = Math.round(total_cost_pkr * (1 + s.margin_value / 100))
  } else {
    total_selling_pkr = total_cost_pkr + toPkr(s.margin_value, s.currency, rate)
  }

  const profit_pkr = total_selling_pkr - total_cost_pkr
  const advance_pkr = toPkr(s.advance, s.currency, rate)
  const total_pax = s.adults + s.children + s.infants

  return {
    tickets_pkr, visa_pkr, transport_pkr, makkah_pkr, madinah_pkr, ziarat_pkr,
    total_cost_pkr, profit_pkr, total_selling_pkr, advance_pkr,
    remaining_pkr: total_selling_pkr - advance_pkr,
    total_pax,
    per_pax_selling_pkr: total_pax > 0 ? total_selling_pkr / total_pax : 0,
  }
}

export const DEFAULT_CALC: CalculatorState = {
  customer_name: '', travel_date: '', duration_days: 14,
  adults: 2, children: 0, infants: 0,
  tickets_enabled: true, airline_id: '', ticket_custom: false,
  ticket_custom_label: '', ticket_custom_amount: 0, ticket_custom_currency: 'PKR',
  visa_enabled: true, visa_custom: false, visa_custom_pkr: 0,
  transport_enabled: false, vehicle_id: '', route_ids: [],
  makkah_enabled: false, makkah_hotel_id: '', makkah_custom_hotel: null, makkah_room_type: 'quad', makkah_nights: 7,
  madinah_enabled: false, madinah_hotel_id: '', madinah_custom_hotel: null, madinah_room_type: 'quad', madinah_nights: 5,
  ziarat_enabled: false, ziarat_ids: [],
  currency: 'PKR', margin_mode: 'percent', margin_value: 12,
  selling_override_enabled: false, selling_override: 0,
  advance: 0,
}
