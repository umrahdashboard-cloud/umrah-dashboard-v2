export type Role = 'admin' | 'moderator' | 'manager' | 'agent' | 'viewer'

export type PaymentMethod = 'Cash' | 'Bank' | 'JazzCash' | 'EasyPaisa'

export interface User {
  id: string
  display_name: string
  username: string
  email: string | null
  role: Role
  permission_level: number
  account_status: 'active' | 'inactive'
  password_hash: string
  agent_id?: string
}

export interface ActivityLog {
  id: string
  user_id: string
  user_name: string
  action: string
  entity_type: 'booking' | 'payment' | 'invoice' | 'settings'
  entity_id: string
  changes: Record<string, any>
  timestamp: Date
  ip_address?: string
}

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue'

export interface Payment {
  id: string
  booking_id: string
  customer_name?: string
  payment_date: string
  amount_pkr: number
  method: PaymentMethod
  note?: string
  status?: PaymentStatus
  voided?: boolean
  void_note?: string
  voided_at?: string
  created_at?: Date
}

export interface Commission {
  id: string
  agent_id: string
  booking_id: string
  booking_amount_pkr: number
  commission_percentage: number
  commission_amount_pkr: number
  status: 'pending' | 'approved' | 'paid'
  paid_date?: string
  created_at: Date
}

export type Currency = 'PKR' | 'SAR'

export interface Airline {
  id: string
  name: string
  adult_pkr: number
  child_pkr: number
  infant_pkr: number
}

export type City = 'Makkah' | 'Madinah'
export type RoomType = 'sharing' | 'double' | 'triple' | 'quad' | 'room'

export interface Hotel {
  id: string
  city: City
  name: string
  location: string
  distance: string
  contact: string
  /** SAR per whole room / night */
  room_sar: number
  /** SAR per person / night */
  sharing_sar: number
  double_sar: number
  triple_sar: number
  quad_sar: number
}

export interface VisaSettings {
  transport_mode: 'included' | 'separate'
  child_sar: number
  infant_sar: number
  ziarat_makkah_sar: number
  ziarat_madinah_sar: number
  ziarat_badr_sar: number
  ziarat_taif_sar: number
  /** Tiered adult visa rates in SAR */
  pax_1_sar: number
  pax_2_sar: number
  pax_3_sar: number
  pax_4_sar: number
  /** 5–49 pax group rate per adult */
  group_sar: number
}

export interface Vehicle {
  id: string
  name: string
  sort_order: number
}

export interface TransportRoute {
  id: string
  name: string
  sort_order: number
}

export interface RouteVehicleRate {
  route_id: string
  vehicle_id: string
  rate_sar: number
}

export interface Ziarat {
  id: string
  name: string
  slug: string
  rate_sar: number
  sort_order: number
}

export interface BrandingSettings {
  company_name: string
  bank_name: string
  account_number: string
  terms: string
  phone: string
  email: string
  location: string
  logo_width: number
  logo_scale: number
  logo_x: number
  logo_y: number
  primary_bg: string
  primary_text: string
  signee_name: string
}

export interface Booking {
  id: string
  booking_date: string
  customer_name: string
  airline_name: string
  total_pkr: number
  cost_pkr: number
  profit_pkr: number
  advance_pkr: number
  paid_pkr: number
  remaining_pkr: number
  adult_count: number
  child_count: number
  infant_count: number
  makkah_hotel_name: string
  makkah_room_type: string
  makkah_nights: number
  madinah_hotel_name: string
  madinah_room_type: string
  madinah_nights: number
  source_invoice_id: string
  created_by: string
  /** Full serialized calculator state so Edit can hydrate */
  calc_state: string
}
export interface InvoiceLine {
  id: string
  description: string
  mode: 'pax' | 'night'
  unit_price: number
  count: number
  currency: Currency
}

export interface Invoice {
  id: string
  invoice_number: number
  invoice_date: string
  customer_name: string
  currency: Currency
  lines: InvoiceLine[]
  /** Always stored in PKR for analytics regardless of display currency */
  total_pkr: number
  created_by: string
  /** Serialized calculator state when invoice originated from Package Calculator */
  calc_state?: string
}

export type ExpenseType =
  | 'Umrah Supplier'
  | 'Airline/Ticket'
  | 'Hotel Supplier'
  | 'Transport Supplier'
  | 'Other Umrah Expense'

export interface Expense {
  id: string
  expense_date: string
  expense_type: ExpenseType
  supplier: string
  amount_pkr: number
  method: PaymentMethod
  note: string
  booking_id: string | null
  invoice_id: string | null
}

export interface Pilgrim {
  id: string
  mutamer_name: string
  passport_no: string
  passport_show: boolean
  visa_number: string
  visa_show: boolean
  pax: number
  beds: number
  gender: 'M' | 'F'
}

export interface HotelAccommodation {
  id: string
  city: City
  confirmation_no: string
  hotel_name: string
  hotel_id: string | null // null if custom
  is_custom: boolean
  room_type: RoomType
  meal_plan: string
  checkin_date: string
  nights: number
}

export interface VoucherData {
  // Voucher Information
  voucher_number: string
  reference_no: string
  voucher_date: string
  family_head: string
  package_info: string
  company_name_header: string
  company_name_header_show: boolean
  company_name_meta: string
  company_name_meta_show: boolean

  // Pilgrims
  pilgrims: Pilgrim[]

  // Accommodation
  hotels: HotelAccommodation[]

  // Contacts & Timing
  makkah_hotel_contact: string
  madinah_hotel_contact: string
  makkah_transport_contact: string
  madinah_transport_contact: string
  jeddah_transport_contact: string
  checkin_time: string
  checkout_time: string

  // Branding
  logo_data: string | null // Base64 encoded image or null
  logo_show_page1: boolean
  logo_show_page2: boolean
  logo_width: number
  logo_height: number
  logo_x: number
  logo_y: number

  // Guidelines
  guidelines_urdu: string
}

export type ContactCity = 'Makkah' | 'Madinah' | 'Jeddah'

export interface HotelContactEntry {
  id: string
  hotel_id: string
  phone: string
}

export interface TransportContactEntry {
  id: string
  city: ContactCity
  company_name: string
  phone: string
}

export interface HotelVoucherColorScheme {
  navy: string
  gold: string
  text: string
  muted: string
  border: string
  lightBg: string
  noteBg: string
}

export interface HotelVoucherSettings {
  default_logo_data: string | null
  logo_width: number
  logo_height: number
  logo_show_page1: boolean
  logo_show_page2: boolean
  company_name_header: string
  company_name_header_show: boolean
  company_name_meta: string
  company_name_meta_show: boolean
  guidelines_urdu: string
  colors: HotelVoucherColorScheme
  checkin_time: string
  checkout_time: string
}

export interface Voucher {
  id: string
  voucher_date: string
  created_at: string
  voucher_data: VoucherData
}

// ── Calculator state (serialized into bookings.calc_state) ─────────────

export interface CustomHotelData {
  name: string
  location: string
  distance: string
  room_sar: number
  sharing_sar: number
  double_sar: number
  triple_sar: number
  quad_sar: number
}

export interface CalculatorState {
  customer_name: string
  travel_date: string
  duration_days: number
  adults: number
  children: number
  infants: number

  tickets_enabled: boolean
  airline_id: string
  ticket_custom: boolean
  ticket_custom_label: string
  ticket_custom_amount: number
  ticket_custom_currency: Currency

  visa_enabled: boolean
  visa_custom: boolean
  visa_custom_pkr: number

  transport_enabled: boolean
  vehicle_id: string
  route_ids: string[]

  makkah_enabled: boolean
  makkah_hotel_id: string
  makkah_custom_hotel: CustomHotelData | null
  makkah_room_type: RoomType
  makkah_nights: number

  madinah_enabled: boolean
  madinah_hotel_id: string
  madinah_custom_hotel: CustomHotelData | null
  madinah_room_type: RoomType
  madinah_nights: number

  ziarat_enabled: boolean
  ziarat_ids: string[]

  currency: Currency
  margin_mode: 'percent' | 'fixed'
  margin_value: number
  selling_override_enabled: boolean
  selling_override: number
  advance: number
}
