// ── Demo Mode in-memory store ──────────────────────────────────────────
// Mirrors the production DB schema so the entire app runs with zero DB
// connection. Swap `store` reads/writes for Supabase/direct-SQL calls in
// production. Persisted on globalThis to survive HMR in dev.
import { createHash } from 'crypto'
import { DEFAULT_CALC } from './calc'
import { buildDefaultVoucherData, DEFAULT_HOTEL_VOUCHER_SETTINGS } from './hotel-voucher-settings'
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
  __demoVersion?: number
}

const DEMO_DATA_VERSION = 2

function seed(): Store {
  const d = (offset: number) => {
    const dt = new Date()
    dt.setDate(dt.getDate() - offset)
    return dt.toISOString().slice(0, 10)
  }
  const m = (monthsAgo: number, day: number) => {
    const dt = new Date()
    dt.setDate(1)
    dt.setMonth(dt.getMonth() - monthsAgo)
    dt.setDate(day)
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
      { id: 'u-mod', display_name: 'Bilal Khan', username: 'moderator', email: 'bilal@fasttravels.pk', role: 'moderator', permission_level: 50, account_status: 'active', password_hash: hashPassword('mod123') },
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
        id: 'b-1', booking_date: m(5, 8), customer_name: 'Muhammad Farooq (Family)', airline_name: 'Saudi Airlines',
        total_pkr: 2450000, cost_pkr: 2130000, profit_pkr: 320000, advance_pkr: 1000000, paid_pkr: 1600000, remaining_pkr: 850000,
        adult_count: 4, child_count: 1, infant_count: 0,
        makkah_hotel_name: 'Anjum Hotel', makkah_room_type: 'quad', makkah_nights: 7,
        madinah_hotel_name: 'Al Eiman Royal', madinah_room_type: 'quad', madinah_nights: 5,
        source_invoice_id: 'inv-calc-1', created_by: 'u-mod', calc_state: farooqCalc,
      },
      {
        id: 'b-2', booking_date: m(4, 14), customer_name: 'Abdul Wahab', airline_name: 'PIA',
        total_pkr: 620000, cost_pkr: 540000, profit_pkr: 80000, advance_pkr: 620000, paid_pkr: 620000, remaining_pkr: 0,
        adult_count: 2, child_count: 0, infant_count: 0,
        makkah_hotel_name: 'Al Kiswah Towers', makkah_room_type: 'double', makkah_nights: 6,
        madinah_hotel_name: 'Durrat Al Eiman', madinah_room_type: 'double', madinah_nights: 4,
        source_invoice_id: 'inv-b2', created_by: 'u-mod', calc_state: '',
      },
      {
        id: 'b-3', booking_date: m(2, 22), customer_name: 'Hajra Bibi Group', airline_name: 'Flynas',
        total_pkr: 3820000, cost_pkr: 3350000, profit_pkr: 470000, advance_pkr: 500000, paid_pkr: 500000, remaining_pkr: 3320000,
        adult_count: 8, child_count: 2, infant_count: 1,
        makkah_hotel_name: 'Swissotel Al Maqam', makkah_room_type: 'sharing', makkah_nights: 10,
        madinah_hotel_name: 'Pullman Zamzam', madinah_room_type: 'sharing', madinah_nights: 5,
        source_invoice_id: 'inv-b3', created_by: 'u-admin', calc_state: '',
      },
      {
        id: 'b-4', booking_date: m(3, 10), customer_name: 'Ali Hassan', airline_name: 'Airblue',
        total_pkr: 980000, cost_pkr: 850000, profit_pkr: 130000, advance_pkr: 500000, paid_pkr: 980000, remaining_pkr: 0,
        adult_count: 3, child_count: 0, infant_count: 0,
        makkah_hotel_name: 'Al Kiswah Towers', makkah_room_type: 'triple', makkah_nights: 8,
        madinah_hotel_name: 'Durrat Al Eiman', madinah_room_type: 'triple', madinah_nights: 5,
        source_invoice_id: 'inv-b4', created_by: 'u-mod', calc_state: '',
      },
      {
        id: 'b-5', booking_date: m(1, 18), customer_name: 'Fatima Zahra', airline_name: 'PIA',
        total_pkr: 1560000, cost_pkr: 1350000, profit_pkr: 210000, advance_pkr: 500000, paid_pkr: 800000, remaining_pkr: 760000,
        adult_count: 4, child_count: 1, infant_count: 0,
        makkah_hotel_name: 'Anjum Hotel', makkah_room_type: 'quad', makkah_nights: 7,
        madinah_hotel_name: 'Al Eiman Royal', madinah_room_type: 'quad', madinah_nights: 4,
        source_invoice_id: 'inv-b5', created_by: 'u-mod', calc_state: '',
      },
      {
        id: 'b-6', booking_date: m(0, 5), customer_name: 'Khan Family', airline_name: 'Saudi Airlines',
        total_pkr: 4200000, cost_pkr: 3680000, profit_pkr: 520000, advance_pkr: 800000, paid_pkr: 1500000, remaining_pkr: 2700000,
        adult_count: 6, child_count: 2, infant_count: 0,
        makkah_hotel_name: 'Swissotel Al Maqam', makkah_room_type: 'quad', makkah_nights: 10,
        madinah_hotel_name: 'Pullman Zamzam', madinah_room_type: 'quad', madinah_nights: 6,
        source_invoice_id: 'inv-b6', created_by: 'u-admin', calc_state: '',
      },
      {
        id: 'b-7', booking_date: m(1, 8), customer_name: 'Rizwan Ahmed', airline_name: 'Flynas',
        total_pkr: 740000, cost_pkr: 640000, profit_pkr: 100000, advance_pkr: 400000, paid_pkr: 400000, remaining_pkr: 340000,
        adult_count: 2, child_count: 0, infant_count: 0,
        makkah_hotel_name: 'Al Kiswah Towers', makkah_room_type: 'double', makkah_nights: 6,
        madinah_hotel_name: 'Durrat Al Eiman', madinah_room_type: 'double', madinah_nights: 4,
        source_invoice_id: 'inv-b7', created_by: 'u-mod', calc_state: '',
      },
      {
        id: 'b-8', booking_date: m(5, 25), customer_name: 'Saima Bibi', airline_name: 'PIA',
        total_pkr: 1120000, cost_pkr: 980000, profit_pkr: 140000, advance_pkr: 560000, paid_pkr: 1120000, remaining_pkr: 0,
        adult_count: 3, child_count: 1, infant_count: 0,
        makkah_hotel_name: 'Anjum Hotel', makkah_room_type: 'triple', makkah_nights: 7,
        madinah_hotel_name: 'Al Eiman Royal', madinah_room_type: 'triple', madinah_nights: 5,
        source_invoice_id: 'inv-b8', created_by: 'u-mod', calc_state: '',
      },
      {
        id: 'b-9', booking_date: m(0, 12), customer_name: 'Tariq Mahmood', airline_name: 'Saudi Airlines',
        total_pkr: 2890000, cost_pkr: 2520000, profit_pkr: 370000, advance_pkr: 500000, paid_pkr: 1000000, remaining_pkr: 1890000,
        adult_count: 5, child_count: 0, infant_count: 0,
        makkah_hotel_name: 'Swissotel Al Maqam', makkah_room_type: 'quad', makkah_nights: 8,
        madinah_hotel_name: 'Pullman Zamzam', madinah_room_type: 'quad', madinah_nights: 5,
        source_invoice_id: 'inv-b9', created_by: 'u-admin', calc_state: '',
      },
      {
        id: 'b-10', booking_date: m(2, 3), customer_name: 'Nadia Hussain', airline_name: 'Airblue',
        total_pkr: 890000, cost_pkr: 760000, profit_pkr: 130000, advance_pkr: 0, paid_pkr: 0, remaining_pkr: 890000,
        adult_count: 2, child_count: 1, infant_count: 0,
        makkah_hotel_name: 'Al Kiswah Towers', makkah_room_type: 'double', makkah_nights: 7,
        madinah_hotel_name: 'Durrat Al Eiman', madinah_room_type: 'double', madinah_nights: 4,
        source_invoice_id: 'inv-b10', created_by: 'u-mod', calc_state: '',
      },
    ],
    payments: [
      { id: 'p-1', booking_id: 'b-1', customer_name: 'Muhammad Farooq (Family)', payment_date: m(5, 8), amount_pkr: 1000000, method: 'Bank', note: 'Advance' },
      { id: 'p-2', booking_id: 'b-1', customer_name: 'Muhammad Farooq (Family)', payment_date: m(3, 15), amount_pkr: 600000, method: 'Bank', note: '2nd installment' },
      { id: 'p-3', booking_id: 'b-2', customer_name: 'Abdul Wahab', payment_date: m(4, 14), amount_pkr: 620000, method: 'Cash', note: 'Full payment' },
      { id: 'p-4', booking_id: 'b-3', customer_name: 'Hajra Bibi Group', payment_date: m(2, 22), amount_pkr: 500000, method: 'JazzCash', note: 'Advance' },
      { id: 'p-5', booking_id: 'b-4', customer_name: 'Ali Hassan', payment_date: m(3, 10), amount_pkr: 500000, method: 'Bank', note: 'Advance' },
      { id: 'p-6', booking_id: 'b-4', customer_name: 'Ali Hassan', payment_date: m(2, 28), amount_pkr: 480000, method: 'EasyPaisa', note: 'Balance' },
      { id: 'p-7', booking_id: 'b-5', customer_name: 'Fatima Zahra', payment_date: m(1, 18), amount_pkr: 500000, method: 'Bank', note: 'Advance' },
      { id: 'p-8', booking_id: 'b-5', customer_name: 'Fatima Zahra', payment_date: m(0, 25), amount_pkr: 300000, method: 'Cash', note: 'Partial payment' },
      { id: 'p-9', booking_id: 'b-6', customer_name: 'Khan Family', payment_date: m(0, 5), amount_pkr: 800000, method: 'Bank', note: 'Advance' },
      { id: 'p-10', booking_id: 'b-6', customer_name: 'Khan Family', payment_date: m(0, 20), amount_pkr: 700000, method: 'Bank', note: '2nd installment' },
      { id: 'p-11', booking_id: 'b-7', customer_name: 'Rizwan Ahmed', payment_date: m(1, 8), amount_pkr: 400000, method: 'JazzCash', note: 'Advance' },
      { id: 'p-12', booking_id: 'b-8', customer_name: 'Saima Bibi', payment_date: m(5, 25), amount_pkr: 560000, method: 'Bank', note: 'Advance' },
      { id: 'p-13', booking_id: 'b-8', customer_name: 'Saima Bibi', payment_date: m(4, 18), amount_pkr: 560000, method: 'Cash', note: 'Final payment' },
      { id: 'p-14', booking_id: 'b-9', customer_name: 'Tariq Mahmood', payment_date: m(0, 12), amount_pkr: 500000, method: 'Bank', note: 'Advance' },
      { id: 'p-15', booking_id: 'b-9', customer_name: 'Tariq Mahmood', payment_date: m(0, 2), amount_pkr: 500000, method: 'Bank', note: '2nd installment' },
      { id: 'p-16', booking_id: 'b-2', customer_name: 'Abdul Wahab', payment_date: m(3, 5), amount_pkr: 15000, method: 'Cash', note: 'Visa fee top-up', voided: true, void_note: 'Duplicate entry' },
    ],
    invoices: [
      {
        id: 'inv-1', invoice_number: 1001, invoice_date: m(4, 20), customer_name: 'Abdul Wahab', currency: 'SAR',
        lines: [
          { id: 'l-1', description: 'Extra night — Durrat Al Eiman (double)', mode: 'night', unit_price: 95, count: 2, currency: 'SAR' },
          { id: 'l-2', description: 'Taif ziarat add-on', mode: 'pax', unit_price: 110, count: 2, currency: 'SAR' },
        ],
        total_pkr: 31365, created_by: 'u-mod',
      },
      {
        id: 'inv-calc-1', invoice_number: 1002, invoice_date: m(5, 8), customer_name: 'Muhammad Farooq (Family)', currency: 'PKR',
        calc_state: farooqCalc,
        lines: [
          { id: 'l-c1', description: 'Flight tickets', mode: 'pax', unit_price: 255000, count: 5, currency: 'PKR' },
          { id: 'l-c2', description: 'Visa processing', mode: 'pax', unit_price: 42000, count: 5, currency: 'PKR' },
        ],
        total_pkr: 2450000, created_by: 'u-mod',
      },
      {
        id: 'inv-b3', invoice_number: 1003, invoice_date: m(2, 22), customer_name: 'Hajra Bibi Group', currency: 'PKR',
        lines: [
          { id: 'l-b3', description: 'Group package — 11 pax', mode: 'pax', unit_price: 347000, count: 11, currency: 'PKR' },
        ],
        total_pkr: 3820000, created_by: 'u-admin',
      },
      {
        id: 'inv-b6', invoice_number: 1004, invoice_date: m(0, 5), customer_name: 'Khan Family', currency: 'PKR',
        lines: [
          { id: 'l-b6', description: 'Premium family package', mode: 'pax', unit_price: 600000, count: 8, currency: 'PKR' },
        ],
        total_pkr: 4200000, created_by: 'u-admin',
      },
      {
        id: 'inv-b9', invoice_number: 1005, invoice_date: m(0, 12), customer_name: 'Tariq Mahmood', currency: 'SAR',
        lines: [
          { id: 'l-b9', description: 'Visa + transport bundle', mode: 'pax', unit_price: 750, count: 5, currency: 'SAR' },
        ],
        total_pkr: 286875, created_by: 'u-admin',
      },
      {
        id: 'inv-misc', invoice_number: 1006, invoice_date: m(1, 25), customer_name: 'Walk-in Client', currency: 'PKR',
        lines: [
          { id: 'l-m1', description: 'Visa processing only', mode: 'pax', unit_price: 48000, count: 3, currency: 'PKR' },
        ],
        total_pkr: 144000, created_by: 'u-mod',
      },
    ],
    invoiceCounter: 1007,
    expenses: [
      { id: 'e-1', expense_date: m(5, 6), expense_type: 'Airline/Ticket', supplier: 'Saudi Airlines GSA', amount_pkr: 1380000, method: 'Bank', note: 'Farooq family tickets', booking_id: 'b-1', invoice_id: null },
      { id: 'e-2', expense_date: m(5, 4), expense_type: 'Hotel Supplier', supplier: 'Anjum Hotel', amount_pkr: 480000, method: 'Bank', note: '7 nights quad x5', booking_id: 'b-1', invoice_id: null },
      { id: 'e-3', expense_date: m(4, 20), expense_type: 'Umrah Supplier', supplier: 'Al Bait Guests', amount_pkr: 210000, method: 'Bank', note: 'Visa batch — March', booking_id: null, invoice_id: null },
      { id: 'e-4', expense_date: m(2, 18), expense_type: 'Transport Supplier', supplier: 'Makkah Transport Co', amount_pkr: 95000, method: 'Cash', note: 'Hiace routes — Hajra group', booking_id: 'b-3', invoice_id: null },
      { id: 'e-5', expense_date: m(4, 12), expense_type: 'Airline/Ticket', supplier: 'PIA GSA Lahore', amount_pkr: 490000, method: 'Bank', note: 'Wahab + Saima tickets', booking_id: 'b-2', invoice_id: null },
      { id: 'e-6', expense_date: m(3, 8), expense_type: 'Hotel Supplier', supplier: 'Pullman Zamzam', amount_pkr: 620000, method: 'Bank', note: 'Ali Hassan Madinah block', booking_id: 'b-4', invoice_id: null },
      { id: 'e-7', expense_date: m(3, 22), expense_type: 'Other Umrah Expense', supplier: 'Office Supplies', amount_pkr: 45000, method: 'Cash', note: 'Printing & stationery', booking_id: null, invoice_id: null },
      { id: 'e-8', expense_date: m(2, 5), expense_type: 'Airline/Ticket', supplier: 'Flynas Agent', amount_pkr: 890000, method: 'Bank', note: 'Hajra group flights', booking_id: 'b-3', invoice_id: null },
      { id: 'e-9', expense_date: m(1, 15), expense_type: 'Hotel Supplier', supplier: 'Al Kiswah Towers', amount_pkr: 285000, method: 'Bank', note: 'Fatima Zahra Makkah', booking_id: 'b-5', invoice_id: null },
      { id: 'e-10', expense_date: m(1, 28), expense_type: 'Transport Supplier', supplier: 'Madinah Shuttle Services', amount_pkr: 78000, method: 'Cash', note: 'Inter-city transfers', booking_id: 'b-5', invoice_id: null },
      { id: 'e-11', expense_date: m(0, 8), expense_type: 'Airline/Ticket', supplier: 'Saudi Airlines GSA', amount_pkr: 1750000, method: 'Bank', note: 'Khan family tickets', booking_id: 'b-6', invoice_id: null },
      { id: 'e-12', expense_date: m(0, 18), expense_type: 'Umrah Supplier', supplier: 'Al Bait Guests', amount_pkr: 320000, method: 'Bank', note: 'Visa batch — current month', booking_id: null, invoice_id: null },
      { id: 'e-13', expense_date: m(0, 22), expense_type: 'Hotel Supplier', supplier: 'Swissotel Al Maqam', amount_pkr: 920000, method: 'Bank', note: 'Khan + Tariq Makkah blocks', booking_id: 'b-6', invoice_id: null },
      { id: 'e-14', expense_date: m(5, 20), expense_type: 'Other Umrah Expense', supplier: 'Marketing Agency', amount_pkr: 85000, method: 'Bank', note: 'Social media campaign', booking_id: null, invoice_id: null },
      { id: 'e-15', expense_date: m(4, 2), expense_type: 'Transport Supplier', supplier: 'Jeddah Airport Transfers', amount_pkr: 52000, method: 'Cash', note: 'Airport pickups batch', booking_id: null, invoice_id: null },
      { id: 'e-16', expense_date: m(1, 3), expense_type: 'Airline/Ticket', supplier: 'Airblue Agent', amount_pkr: 465000, method: 'Bank', note: 'Rizwan + Nadia tickets', booking_id: 'b-7', invoice_id: null },
      { id: 'e-17', expense_date: m(0, 1), expense_type: 'Other Umrah Expense', supplier: 'Office Rent', amount_pkr: 120000, method: 'Bank', note: 'Monthly office rent', booking_id: null, invoice_id: null },
    ],
    vouchers: (() => {
      const hvSettings = { ...DEFAULT_HOTEL_VOUCHER_SETTINGS, colors: { ...DEFAULT_HOTEL_VOUCHER_SETTINGS.colors } }
      const mk = (id: string, date: string, family: string, ref: string) => {
        const vd = buildDefaultVoucherData(hvSettings)
        vd.voucher_number = `HV-${id.slice(-3).toUpperCase()}`
        vd.reference_no = ref
        vd.voucher_date = date
        vd.family_head = family
        vd.package_info = '15 Days Umrah Package'
        vd.pilgrims = [
          { id: '1', mutamer_name: family, passport_no: 'AB1234567', passport_show: true, visa_number: 'V-2026-001', visa_show: true, pax: 1, beds: 1, gender: 'M' as const },
        ]
        vd.hotels = [
          { id: '1', city: 'Makkah' as const, confirmation_no: 'MK-8842', hotel_name: 'Anjum Hotel', hotel_id: 'h-3', is_custom: false, room_type: 'quad' as const, meal_plan: 'BB', checkin_date: date, nights: 7 },
          { id: '2', city: 'Madinah' as const, confirmation_no: 'MD-3310', hotel_name: 'Al Eiman Royal', hotel_id: 'h-5', is_custom: false, room_type: 'quad' as const, meal_plan: 'BB', checkin_date: date, nights: 5 },
        ]
        return { id, voucher_date: date, created_at: `${date}T10:00:00.000Z`, voucher_data: vd }
      }
      return [
        mk('v-1', m(5, 10), 'Muhammad Farooq', 'b-1'),
        mk('v-2', m(2, 25), 'Hajra Bibi Group', 'b-3'),
        mk('v-3', m(0, 6), 'Khan Family', 'b-6'),
      ]
    })(),
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
    pdfBytesUsed: 8_750_000,
    __demoVersion: DEMO_DATA_VERSION,
  }
}

function applyDemoReportSeed(target: Store) {
  const fresh = seed()
  target.bookings = fresh.bookings
  target.payments = fresh.payments
  target.expenses = fresh.expenses
  target.invoices = fresh.invoices
  target.vouchers = fresh.vouchers
  target.invoiceCounter = fresh.invoiceCounter
  target.pdfBytesUsed = fresh.pdfBytesUsed
  target.__demoVersion = DEMO_DATA_VERSION
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
  if (g.__ftStore.__demoVersion !== DEMO_DATA_VERSION) {
    applyDemoReportSeed(g.__ftStore)
  }
}

export const store: Store = g.__ftStore

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
