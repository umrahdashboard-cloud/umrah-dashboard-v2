-- Run in Supabase SQL Editor to enable void payment tracking
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS voided BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS void_note TEXT,
  ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_payments_voided ON payments(voided);
