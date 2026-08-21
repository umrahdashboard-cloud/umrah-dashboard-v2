// ── Demo Mode in-memory store ──────────────────────────────────────────
// Mirrors the production DB schema so the entire app runs with zero DB
// connection. Swap `store` reads/writes for Supabase/direct-SQL calls in
// production. Persisted on globalThis to survive HMR in dev.
import { createHash } from 'crypto'
import { DEFAULT_CALC } from './calc'
import { DEFAULT_HOTEL_VOUCHER_SETTINGS } from './hotel-voucher-settings'
import type {
  Airline, Booking, BrandingSettings, Expense, Hotel, HotelContactEntry, HotelVoucherSettings,
  Invoice, Payment, RouteVehicleRate, TransportContactEntry, TransportRoute, User, Vehicle,
  VisaSettings, Voucher, Ziarat,
} from './types'

export function hashPassword(pw: string): string {
  return createHash('sha256').update(`ft-salt::${pw}`).digest('hex')
}

interface Store {
  users: User[]
  airlines: Airline[]
  hotels: Hotel[]
  visa: VisaSettings
  vehicles: Vehicle[]
  routes: TransportRoute[]
  rateMatrix: RouteVehicleRate[]
  ziarats: Ziarat[]
  exchangeRate: number
  branding: BrandingSettings
  bookings: Booking[]
  payments: Payment[]
  invoices: Invoice[]
  invoiceCounter: number
  expenses: Expense[]
  vouchers: Voucher[]
  hotelVoucherSettings: HotelVoucherSettings
  hotelContacts: HotelContactEntry[]
  transportContacts: TransportContactEntry[]
  pdfBytesUsed: number
}

function seed(): Store {
  const d = (offset: number) => {
    const dt = new Date()
    dt.setDate(dt.getDate() - offset)
    return dt.toISOString().slice(0, 10)
  }

  const farooqCalc = JSON.stringify({
    ...DEFAULT_CALC,
    customer_name: 'Muhammad Farooq (Family)',
    adults: 4,
    children: 1,
    airline_id: 'al-1',
    transport_enabled: true,
    vehicle_id: 'v-3',
    route_ids: ['r-1', 'r-2', 'r-5'],
    makkah_enabled: true,
    makkah_hotel_id: 'h-3',
    makkah_room_type: 'quad',
    makkah_nights: 7,
    madinah_enabled: true,
    madinah_hotel_id: 'h-5',
    madinah_room_type: 'quad',
    madinah_nights: 5,
    ziarat_enabled: true,
    ziarat_ids: ['z-1', 'z-2'],
    advance: 1000000,
  })

  return {
    users: [
      { id: 'u-admin', display_name: 'Ahmed Raza', username: 'admin', email: 'admin@fasttravels.pk', role: 'admin', permission_level: 100, account_status: 'active', password_hash: hashPassword('admin123') },
      { id: 'u-mod', display_name: 'Bilal Khan', username: 'moderator', email: 'bilal@fasttravels.pk', role: 'manager', permission_level: 50, account_status: 'active', password_hash: hashPassword('mod123') },
      { id: 'u-view', display_name: 'Sana Iqbal', username: 'viewer', email: null, role: 'viewer', permission_level: 10, account_status: 'active', password_hash: hashPassword('view123') },
    ],
    airlines: [
      { id: 'al-1', name: 'Saudi Airlines', adult_pkr: 285000, child_pkr: 240000, infant_pkr: 45000 },
      { id: 'al-2', name: 'PIA', adult_pkr: 245000, child_pkr: 210000, infant_pkr: 38000 },
      { id: 'al-3', name: 'Airblue', adult_pkr: 232000, child_pkr: 198000, infant_pkr: 35000 },
      { id: 'al-4', name: 'Flynas', adult_pkr: 255000, child_pkr: 218000, infant_pkr: 40000 },
    ],
    hotels: [
      { id: 'h-1', city: 'Makkah', name: 'Swissotel Al Maqam', location: 'Clock Tower', distance: '100m', contact: '+966 12 571 8000', room_sar: 950, sharing_sar: 95, double_sar: 240, triple_sar: 180, quad_sar: 150 },
      { id: 'h-2', city: 'Makkah', name: 'Al Kiswah Towers', location: 'Kudai', distance: '1.8km', contact: '+966 12 553 0000', room_sar: 320, sharing_sar: 35, double_sar: 90, triple_sar: 70, quad_sar: 55 },
      { id: 'h-3', city: 'Makkah', name: 'Anjum Hotel', location: 'Jabal Omar', distance: '600m', contact: '+966 12 571 1000', room_sar: 560, sharing_sar: 60, double_sar: 150, triple_sar: 115, quad_sar: 92 },
      { id: 'h-4', city: 'Madinah', name: 'Pullman Zamzam', location: 'Central Zone', distance: '150m', contact: '+966 14 820 9999', room_sar: 720, sharing_sar: 78, double_sar: 190, triple_sar: 145, quad_sar: 118 },
      { id: 'h-5', city: 'Madinah', name: 'Al Eiman Royal', location: 'Central Zone', distance: '250m', contact: '+966 14 828 2222', room_sar: 480, sharing_sar: 52, double_sar: 125, triple_sar: 96, quad_sar: 78 },
      { id: 'h-6', city: 'Madinah', name: 'Durrat Al Eiman', location: 'Bab Al Salam', distance: '400m', contact: '+966 14 826 1111', room_sar: 340, sharing_sar: 38, double_sar: 95, triple_sar: 72, quad_sar: 58 },
    ],
    visa: {
      transport_mode: 'separate',
      child_sar: 350, infant_sar: 120,
      ziarat_makkah_sar: 60, ziarat_madinah_sar: 55, ziarat_badr_sar: 90, ziarat_taif_sar: 110,
      pax_1_sar: 620, pax_2_sar: 560, pax_3_sar: 520, pax_4_sar: 490, group_sar: 465,
    },
    vehicles: [
      { id: 'v-1', name: 'Camry / Sedan', sort_order: 1 },
      { id: 'v-2', name: 'H1 / Staria (7 pax)', sort_order: 2 },
      { id: 'v-3', name: 'Hiace (11 pax)', sort_order: 3 },
      { id: 'v-4', name: 'Coaster (18 pax)', sort_order: 4 },
      { id: 'v-5', name: 'Bus (49 pax)', sort_order: 5 },
    ],
    routes: [
      { id: 'r-1', name: 'Jeddah Airport → Makkah', sort_order: 1 },
      { id: 'r-2', name: 'Makkah → Madinah', sort_order: 2 },
      { id: 'r-3', name: 'Madinah → Madinah Airport', sort_order: 3 },
      { id: 'r-4', name: 'Madinah → Makkah', sort_order: 4 },
      { id: 'r-5', name: 'Makkah → Jeddah Airport', sort_order: 5 },
    ],
    rateMatrix: [
      { route_id: 'r-1', vehicle_id: 'v-1', rate_sar: 200 }, { route_id: 'r-1', vehicle_id: 'v-2', rate_sar: 280 }, { route_id: 'r-1', vehicle_id: 'v-3', rate_sar: 350 }, { route_id: 'r-1', vehicle_id: 'v-4', rate_sar: 500 }, { route_id: 'r-1', vehicle_id: 'v-5', rate_sar: 900 },
      { route_id: 'r-2', vehicle_id: 'v-1', rate_sar: 400 }, { route_id: 'r-2', vehicle_id: 'v-2', rate_sar: 520 }, { route_id: 'r-2', vehicle_id: 'v-3', rate_sar: 650 }, { route_id: 'r-2', vehicle_id: 'v-4', rate_sar: 950 }, { route_id: 'r-2', vehicle_id: 'v-5', rate_sar: 1600 },
      { route_id: 'r-3', vehicle_id: 'v-1', rate_sar: 120 }, { route_id: 'r-3', vehicle_id: 'v-2', rate_sar: 170 }, { route_id: 'r-3', vehicle_id: 'v-3', rate_sar: 220 }, { route_id: 'r-3', vehicle_id: 'v-4', rate_sar: 320 }, { route_id: 'r-3', vehicle_id: 'v-5', rate_sar: 600 },
      { route_id: 'r-4', vehicle_id: 'v-1', rate_sar: 400 }, { route_id: 'r-4', vehicle_id: 'v-2', rate_sar: 520 }, { route_id: 'r-4', vehicle_id: 'v-3', rate_sar: 650 }, { route_id: 'r-4', vehicle_id: 'v-4', rate_sar: 950 }, { route_id: 'r-4', vehicle_id: 'v-5', rate_sar: 1600 },
      { route_id: 'r-5', vehicle_id: 'v-1', rate_sar: 220 }, { route_id: 'r-5', vehicle_id: 'v-2', rate_sar: 300 }, { route_id: 'r-5', vehicle_id: 'v-3', rate_sar: 380 }, { route_id: 'r-5', vehicle_id: 'v-4', rate_sar: 540 }, { route_id: 'r-5', vehicle_id: 'v-5', rate_sar: 950 },
    ],
    ziarats: [
      { id: 'z-1', name: 'Ziarat Makkah', slug: 'ziarat-makkah', rate_sar: 60, sort_order: 1 },
      { id: 'z-2', name: 'Ziarat Madinah', slug: 'ziarat-madinah', rate_sar: 55, sort_order: 2 },
      { id: 'z-3', name: 'Ziarat Badr', slug: 'ziarat-badr', rate_sar: 90, sort_order: 3 },
      { id: 'z-4', name: 'Ziarat Taif', slug: 'ziarat-taif', rate_sar: 110, sort_order: 4 },
    ],
    exchangeRate: 76.5,
    branding: {
      company_name: 'Fast Travels',
      bank_name: 'Meezan Bank',
      account_number: 'PK36MEZN0002980105812345',
      terms: 'Advance is non-refundable after visa processing begins. Prices subject to change until full payment. Hotel check-in per Saudi hotel policy (4pm).',
      phone: '+92 300 1234567',
      email: 'bookings@fasttravels.pk',
      location: 'Office 12, Gulberg III, Lahore',
      logo_width: 120, logo_scale: 1, logo_x: 40, logo_y: 40,
      primary_bg: '#0B1220', primary_text: '#E8ECF4',
      signee_name: 'Ahmed Raza',
    },
    bookings: [
      {
        id: 'b-1', booking_date: d(24), customer_name: 'Muhammad Farooq (Family)', airline_name: 'Saudi Airlines',
        total_pkr: 2450000, cost_pkr: 2130000, profit_pkr: 320000, advance_pkr: 1000000, paid_pkr: 1600000, remaining_pkr: 850000,
        adult_count: 4, child_count: 1, infant_count: 0,
        makkah_hotel_name: 'Anjum Hotel', makkah_room_type: 'quad', makkah_nights: 7,
        madinah_hotel_name: 'Al Eiman Royal', madinah_room_type: 'quad', madinah_nights: 5,
        source_invoice_id: 'inv-calc-1', created_by: 'u-mod', calc_state: farooqCalc,
      },
      {
        id: 'b-2', booking_date: d(15), customer_name: 'Abdul Wahab', airline_name: 'PIA',
        total_pkr: 620000, cost_pkr: 540000, profit_pkr: 80000, advance_pkr: 620000, paid_pkr: 620000, remaining_pkr: 0,
        adult_count: 2, child_count: 0, infant_count: 0,
        makkah_hotel_name: 'Al Kiswah Towers', makkah_room_type: 'double', makkah_nights: 6,
        madinah_hotel_name: 'Durrat Al Eiman', madinah_room_type: 'double', madinah_nights: 4,
        source_invoice_id: 'inv-b2', created_by: 'u-mod', calc_state: '',
      },
      {
        id: 'b-3', booking_date: d(6), customer_name: 'Hajra Bibi Group', airline_name: 'Flynas',
        total_pkr: 3820000, cost_pkr: 3350000, profit_pkr: 470000, advance_pkr: 500000, paid_pkr: 500000, remaining_pkr: 3320000,
        adult_count: 8, child_count: 2, infant_count: 1,
        makkah_hotel_name: 'Swissotel Al Maqam', makkah_room_type: 'sharing', makkah_nights: 10,
        madinah_hotel_name: 'Pullman Zamzam', madinah_room_type: 'sharing', madinah_nights: 5,
        source_invoice_id: 'inv-b3', created_by: 'u-admin', calc_state: '',
      },
    ],
    payments: [
      { id: 'p-1', booking_id: 'b-1', customer_name: 'Muhammad Farooq (Family)', payment_date: d(24), amount_pkr: 1000000, method: 'Bank', note: 'Advance' },
      { id: 'p-2', booking_id: 'b-1', customer_name: 'Muhammad Farooq (Family)', payment_date: d(10), amount_pkr: 600000, method: 'Bank', note: '2nd installment' },
      { id: 'p-3', booking_id: 'b-2', customer_name: 'Abdul Wahab', payment_date: d(15), amount_pkr: 620000, method: 'Cash', note: 'Full payment' },
      { id: 'p-4', booking_id: 'b-3', customer_name: 'Hajra Bibi Group', payment_date: d(6), amount_pkr: 500000, method: 'JazzCash', note: 'Advance' },
    ],
    invoices: [
      {
        id: 'inv-1', invoice_number: 1001, invoice_date: d(20), customer_name: 'Abdul Wahab', currency: 'SAR',
        lines: [
          { id: 'l-1', description: 'Extra night — Durrat Al Eiman (double)', mode: 'night', unit_price: 95, count: 2, currency: 'SAR' },
          { id: 'l-2', description: 'Taif ziarat add-on', mode: 'pax', unit_price: 110, count: 2, currency: 'SAR' },
        ],
        total_pkr: 31365, created_by: 'u-mod',
      },
      {
        id: 'inv-calc-1', invoice_number: 1002, invoice_date: d(24), customer_name: 'Muhammad Farooq (Family)', currency: 'PKR',
        calc_state: farooqCalc,
        lines: [
          { id: 'l-c1', description: 'Flight tickets', mode: 'pax', unit_price: 255000, count: 5, currency: 'PKR' },
          { id: 'l-c2', description: 'Visa processing', mode: 'pax', unit_price: 42000, count: 5, currency: 'PKR' },
        ],
        total_pkr: 2450000, created_by: 'u-mod',
      },
    ],
    invoiceCounter: 1003,
    expenses: [
      { id: 'e-1', expense_date: d(22), expense_type: 'Airline/Ticket', supplier: 'Saudi Airlines GSA', amount_pkr: 1380000, method: 'Bank', note: 'Farooq family tickets', booking_id: 'b-1', invoice_id: null },
      { id: 'e-2', expense_date: d(18), expense_type: 'Hotel Supplier', supplier: 'Anjum Hotel', amount_pkr: 480000, method: 'Bank', note: '7 nights quad x5', booking_id: 'b-1', invoice_id: null },
      { id: 'e-3', expense_date: d(12), expense_type: 'Umrah Supplier', supplier: 'Al Bait Guests', amount_pkr: 210000, method: 'Bank', note: 'Visa batch', booking_id: null, invoice_id: null },
      { id: 'e-4', expense_date: d(4), expense_type: 'Transport Supplier', supplier: 'Makkah Transport Co', amount_pkr: 95000, method: 'Cash', note: 'Hiace routes', booking_id: 'b-3', invoice_id: null },
    ],
    vouchers: [],
    hotelVoucherSettings: { ...DEFAULT_HOTEL_VOUCHER_SETTINGS, colors: { ...DEFAULT_HOTEL_VOUCHER_SETTINGS.colors } },
    hotelContacts: [
      { id: 'hc-1', hotel_id: 'h-1', phone: '+966 12 571 8000' },
      { id: 'hc-2', hotel_id: 'h-3', phone: '+966 12 571 1000' },
      { id: 'hc-3', hotel_id: 'h-4', phone: '+966 14 820 9999' },
      { id: 'hc-4', hotel_id: 'h-5', phone: '+966 14 828 2222' },
    ],
    transportContacts: [
      { id: 'tc-1', city: 'Makkah', company_name: 'Makkah Transport Co', phone: '+966 55 123 4567' },
      { id: 'tc-2', city: 'Madinah', company_name: 'Madinah Shuttle Services', phone: '+966 55 234 5678' },
      { id: 'tc-3', city: 'Jeddah', company_name: 'Jeddah Airport Transfers', phone: '+966 55 345 6789' },
    ],
    pdfBytesUsed: 2_450_000,
  }
}

const g = globalThis as unknown as { __ftStore?: Store }
if (!g.__ftStore) {
  g.__ftStore = seed()
} else {
  // Backfill fields added after the in-memory store was first created (dev HMR).
  if (!g.__ftStore.hotelVoucherSettings) {
    g.__ftStore.hotelVoucherSettings = {
      ...DEFAULT_HOTEL_VOUCHER_SETTINGS,
      colors: { ...DEFAULT_HOTEL_VOUCHER_SETTINGS.colors },
    }
  } else if (g.__ftStore.hotelVoucherSettings.logo_height == null) {
    g.__ftStore.hotelVoucherSettings.logo_height = DEFAULT_HOTEL_VOUCHER_SETTINGS.logo_height
  }
  if (!g.__ftStore.hotelContacts) g.__ftStore.hotelContacts = []
  if (!g.__ftStore.transportContacts) g.__ftStore.transportContacts = []
}

export const store: Store = g.__ftStore

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
