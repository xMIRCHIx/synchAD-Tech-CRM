-- ============================================================
-- B2B Lead Gen CRM — Supabase Database Schema
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE 1: campaigns
-- Stores search configurations for Apify
-- ============================================================
CREATE TABLE campaigns (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  search_query  TEXT NOT NULL,
  location      TEXT NOT NULL,
  niche         TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  max_leads     INT DEFAULT 40,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: leads
-- Core lead data - the main CRM table
-- ============================================================
CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id     UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  business_name   TEXT NOT NULL,
  phone           TEXT UNIQUE NOT NULL,
  email           TEXT,
  website_url     TEXT,
  address         TEXT,
  google_rating   NUMERIC(2,1),
  google_maps_url TEXT,
  site_state      TEXT DEFAULT 'unknown' CHECK (site_state IN ('exists', 'none', 'broken', 'unknown')),
  status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
                    'new', 'enriched', 'review', 'queued',
                    'sent', 'delivered', 'read',
                    'replied', 'won', 'lost', 'skipped'
                  )),
  owner_name      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: website_audits
-- Scraped text and AI findings for each lead's website
-- ============================================================
CREATE TABLE website_audits (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id       UUID UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  http_status   INT,
  scraped_text  TEXT,
  findings      JSONB DEFAULT '{"flaws": [], "strengths": []}',
  ai_pitch      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: conversations
-- One conversation thread per lead (for WhatsApp inbox)
-- ============================================================
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id         UUID UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  unread_count    INT DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  is_archived     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: messages
-- Every single message (inbound + outbound + AI drafts)
-- ============================================================
CREATE TABLE messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID REFERENCES conversations(id) ON DELETE CASCADE,
  direction         TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body              TEXT NOT NULL,
  status            TEXT DEFAULT 'draft' CHECK (status IN (
                      'draft', 'queued', 'sent', 'delivered', 'read', 'failed'
                    )),
  is_ai_draft       BOOLEAN DEFAULT FALSE,
  wa_message_id     TEXT UNIQUE,
  media_url         TEXT,
  media_type        TEXT,
  error_message     TEXT,
  sent_at           TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 6: wa_templates
-- WhatsApp approved message templates
-- ============================================================
CREATE TABLE wa_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT UNIQUE NOT NULL,
  body        TEXT NOT NULL,
  variables   JSONB DEFAULT '[]',
  category    TEXT DEFAULT 'MARKETING',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES (for faster queries)
-- ============================================================
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- ============================================================
-- REALTIME (Enable for live chat updates)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;

-- ============================================================
-- AUTO UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_website_audits_updated_at
  BEFORE UPDATE ON website_audits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO CREATE CONVERSATION when a lead is inserted
-- ============================================================
CREATE OR REPLACE FUNCTION create_conversation_for_lead()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO conversations (lead_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_conversation
  AFTER INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION create_conversation_for_lead();

-- ============================================================
-- AUTO UPDATE conversation last_message_at on new message
-- ============================================================
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NOW(),
    unread_count = CASE
      WHEN NEW.direction = 'inbound' THEN unread_count + 1
      ELSE unread_count
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- ============================================================
-- SAMPLE DATA (for testing)
-- ============================================================
INSERT INTO campaigns (name, search_query, location, niche) VALUES
  ('Dental Clinics Mumbai', 'dental clinics', 'Mumbai, India', 'Healthcare'),
  ('Gyms in Delhi', 'gyms and fitness centers', 'Delhi, India', 'Fitness');

-- ============================================================
-- DONE! All 6 tables created successfully.
-- Tables: campaigns, leads, website_audits, conversations, messages, wa_templates
-- ============================================================
