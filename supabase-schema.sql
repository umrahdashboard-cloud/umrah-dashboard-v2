-- Umrah Dashboard - Supabase Schema
-- Run this entire script in your Supabase SQL editor

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'viewer')),
  permission_level INTEGER NOT NULL DEFAULT 1,
  account_status TEXT NOT NULL CHECK (account_status IN ('active', 'inactive')) DEFAULT 'active',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SETTINGS TABLES
-- ============================================================================

-- Airlines
CREATE TABLE IF NOT EXISTS airlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  adult_pkr DECIMAL(12, 2) NOT NULL,
  child_pkr DECIMAL(12, 2) NOT NULL,
  infant_pkr DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hotels
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL CHECK (city IN ('Makkah', 'Madinah')),
  name TEXT NOT NULL,
  location TEXT,
  distance TEXT,
  contact TEXT,
  room_sar DECIMAL(12, 2) NOT NULL,
  sharing_sar DECIMAL(12, 2) NOT NULL,
  double_sar DECIMAL(12, 2) NOT NULL,
  triple_sar DECIMAL(12, 2) NOT NULL,
  quad_sar DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visa Settings
CREATE TABLE IF NOT EXISTS visa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transport_mode TEXT NOT NULL CHECK (transport_mode IN ('included', 'separate')) DEFAULT 'separate',
  child_sar DECIMAL(12, 2) NOT NULL,
  infant_sar DECIMAL(12, 2) NOT NULL,
  ziarat_makkah_sar DECIMAL(12, 2) NOT NULL,
  ziarat_madinah_sar DECIMAL(12, 2) NOT NULL,
  ziarat_badr_sar DECIMAL(12, 2) NOT NULL,
  ziarat_taif_sar DECIMAL(12, 2) NOT NULL,
  pax_1_sar DECIMAL(12, 2) NOT NULL,
  pax_2_sar DECIMAL(12, 2) NOT NULL,
  pax_3_sar DECIMAL(12, 2) NOT NULL,
  pax_4_sar DECIMAL(12, 2) NOT NULL,
  group_sar DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transport Routes
CREATE TABLE IF NOT EXISTS transport_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Route Vehicle Rates
CREATE TABLE IF NOT EXISTS route_vehicle_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  rate_sar DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(route_id, vehicle_id)
);

-- Ziarats
CREATE TABLE IF NOT EXISTS ziarats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  rate_sar DECIMAL(12, 2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Branding Settings
CREATE TABLE IF NOT EXISTS branding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  terms TEXT,
  phone TEXT,
  email TEXT,
  location TEXT,
  logo_width INTEGER DEFAULT 120,
  logo_scale DECIMAL(3, 2) DEFAULT 1,
  logo_x INTEGER DEFAULT 30,
  logo_y INTEGER DEFAULT 30,
  primary_bg TEXT DEFAULT '#0B0E14',
  primary_text TEXT DEFAULT '#FFFFFF',
  signee_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BOOKING & PAYMENT TABLES
-- ============================================================================

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  airline_name TEXT NOT NULL,
  total_pkr DECIMAL(12, 2) NOT NULL,
  cost_pkr DECIMAL(12, 2) NOT NULL,
  profit_pkr DECIMAL(12, 2) NOT NULL,
  advance_pkr DECIMAL(12, 2) NOT NULL DEFAULT 0,
  paid_pkr DECIMAL(12, 2) NOT NULL DEFAULT 0,
  remaining_pkr DECIMAL(12, 2) NOT NULL DEFAULT 0,
  adult_count INTEGER NOT NULL,
  child_count INTEGER NOT NULL DEFAULT 0,
  infant_count INTEGER NOT NULL DEFAULT 0,
  makkah_hotel_name TEXT,
  makkah_room_type TEXT,
  makkah_nights INTEGER DEFAULT 0,
  madinah_hotel_name TEXT,
  madinah_room_type TEXT,
  madinah_nights INTEGER DEFAULT 0,
  source_invoice_id UUID,
  created_by UUID NOT NULL REFERENCES users(id),
  calc_state JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  payment_date DATE NOT NULL,
  amount_pkr DECIMAL(12, 2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('Cash', 'Bank', 'JazzCash', 'EasyPaisa')),
  note TEXT,
  voided BOOLEAN NOT NULL DEFAULT FALSE,
  void_note TEXT,
  voided_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INVOICE TABLES
-- ============================================================================

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number INTEGER NOT NULL UNIQUE,
  invoice_date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('PKR', 'SAR')),
  total_pkr DECIMAL(12, 2) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Lines
CREATE TABLE IF NOT EXISTS invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('pax', 'night')),
  unit_price DECIMAL(12, 2) NOT NULL,
  count INTEGER NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('PKR', 'SAR')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- EXPENSE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL,
  expense_type TEXT NOT NULL CHECK (expense_type IN (
    'Umrah Supplier', 'Airline/Ticket', 'Hotel Supplier', 'Transport Supplier', 'Other Umrah Expense'
  )),
  supplier TEXT NOT NULL,
  amount_pkr DECIMAL(12, 2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('Cash', 'Bank', 'JazzCash', 'EasyPaisa')),
  note TEXT,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VOUCHER TABLES
-- ============================================================================

-- Vouchers
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_date DATE NOT NULL,
  family_head TEXT NOT NULL,
  package_info TEXT,
  total_pax INTEGER,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voucher Pilgrims
CREATE TABLE IF NOT EXISTS voucher_pilgrims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  mutamer_name TEXT NOT NULL,
  passport_no TEXT,
  passport_show BOOLEAN DEFAULT FALSE,
  visa_number TEXT,
  visa_show BOOLEAN DEFAULT FALSE,
  pax INTEGER DEFAULT 1,
  beds INTEGER DEFAULT 1,
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voucher Hotels
CREATE TABLE IF NOT EXISTS voucher_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  city TEXT NOT NULL CHECK (city IN ('Makkah', 'Madinah')),
  confirmation_no TEXT,
  hotel_name TEXT NOT NULL,
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  room_type TEXT NOT NULL CHECK (room_type IN ('sharing', 'double', 'triple', 'quad', 'room')),
  meal_plan TEXT,
  checkin_date DATE NOT NULL,
  nights INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_bookings_created_by ON bookings(created_by);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_customer_name ON bookings(customer_name);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoice_lines_invoice_id ON invoice_lines(invoice_id);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_booking_id ON expenses(booking_id);
CREATE INDEX idx_expenses_invoice_id ON expenses(invoice_id);
CREATE INDEX idx_vouchers_created_by ON vouchers(created_by);
CREATE INDEX idx_vouchers_voucher_date ON vouchers(voucher_date);
CREATE INDEX idx_voucher_pilgrims_voucher_id ON voucher_pilgrims(voucher_id);
CREATE INDEX idx_voucher_hotels_voucher_id ON voucher_hotels(voucher_id);
CREATE INDEX idx_route_vehicle_rates_route_id ON route_vehicle_rates(route_id);
CREATE INDEX idx_route_vehicle_rates_vehicle_id ON route_vehicle_rates(vehicle_id);

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Insert default admin user (password: admin123 - hash this before production!)
-- For now, leaving this commented out - you should create admin via app
-- INSERT INTO users (display_name, username, email, role, permission_level) 
-- VALUES ('Admin', 'admin', 'admin@fasttravels.com', 'admin', 99);

-- Insert default visa settings
INSERT INTO visa_settings (
  transport_mode, child_sar, infant_sar, 
  ziarat_makkah_sar, ziarat_madinah_sar, ziarat_badr_sar, ziarat_taif_sar,
  pax_1_sar, pax_2_sar, pax_3_sar, pax_4_sar, group_sar
) VALUES (
  'separate', 500, 250,
  150, 150, 200, 200,
  1500, 1400, 1300, 1200, 1000
) ON CONFLICT DO NOTHING;

-- Insert default branding settings
INSERT INTO branding_settings (
  company_name, bank_name, phone, email, location
) VALUES (
  'Fast Travels', 'Standard Chartered Bank', '+92-21-3456789', 'info@fasttravels.com', 'Karachi, Pakistan'
) ON CONFLICT DO NOTHING;
