-- ============================================================
-- SynchAD Tech CRM — Agency Operating System Schema Extension
-- Run this in Supabase SQL Editor to enable Deals, Agreements & Invoices
-- ============================================================

CREATE TABLE IF NOT EXISTS client_deals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id         UUID UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  deal_value      NUMERIC(12,2) NOT NULL DEFAULT 0,
  advance_paid    NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due     NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency        TEXT DEFAULT 'INR',
  payment_mode    TEXT DEFAULT 'upi' CHECK (payment_mode IN ('upi', 'bank_transfer', 'cash', 'stripe')),
  service_type    TEXT NOT NULL DEFAULT 'Custom Website + WhatsApp Booking Funnel',
  project_scope   TEXT DEFAULT 'Design, build, mobile optimization and WhatsApp instant booking engine.',
  target_deadline DATE,
  stage           TEXT DEFAULT 'closing' CHECK (stage IN ('closing', 'in_development', 'review', 'delivered', 'maintenance')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_agreements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id           UUID REFERENCES leads(id) ON DELETE CASCADE,
  agreement_number  TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  content           TEXT NOT NULL,
  agency_signatory  TEXT DEFAULT 'SynchAD Tech (Authorized Representative)',
  client_signatory  TEXT NOT NULL,
  effective_date    DATE DEFAULT CURRENT_DATE,
  deal_value        NUMERIC(12,2) DEFAULT 0,
  status            TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'completed')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_invoices (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number      TEXT NOT NULL UNIQUE,
  lead_id             UUID REFERENCES leads(id) ON DELETE CASCADE,
  client_name         TEXT NOT NULL,
  client_phone        TEXT NOT NULL,
  client_address      TEXT,
  amount              NUMERIC(12,2) NOT NULL DEFAULT 0,
  status              TEXT DEFAULT 'unpaid' CHECK (status IN ('draft', 'unpaid', 'paid', 'overdue')),
  installment_label   TEXT NOT NULL DEFAULT '50% Advance Booking',
  issue_date          DATE DEFAULT CURRENT_DATE,
  due_date            DATE,
  items               JSONB DEFAULT '[]'::jsonb,
  notes               TEXT,
  payment_mode        TEXT DEFAULT 'upi',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE client_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role on client_deals" ON client_deals FOR ALL USING (true);
CREATE POLICY "Allow service role on client_agreements" ON client_agreements FOR ALL USING (true);
CREATE POLICY "Allow service role on client_invoices" ON client_invoices FOR ALL USING (true);
