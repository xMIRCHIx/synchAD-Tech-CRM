// Database Types for our CRM
// Auto-synced with Supabase schema

export type LeadStatus =
  | 'new'
  | 'enriched'
  | 'review'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'replied'
  | 'won'
  | 'lost'
  | 'skipped'

export type SiteState = 'exists' | 'none' | 'broken' | 'unknown'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageStatus = 'draft' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Campaign {
  id: string
  name: string
  search_query: string
  location: string
  niche: string | null
  status: 'active' | 'paused' | 'completed'
  max_leads: number
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  campaign_id: string | null
  business_name: string
  phone: string
  email: string | null
  website_url: string | null
  address: string | null
  google_rating: number | null
  google_maps_url: string | null
  site_state: SiteState
  status: LeadStatus
  score?: number | null
  pitch_angle?: string | null
  city?: string | null
  owner_name?: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  campaigns?: Campaign
  conversations?: Conversation
  website_audits?: WebsiteAudit
}

export interface WebsiteAudit {
  id: string
  lead_id: string
  http_status: number | null
  scraped_text: string | null
  findings: {
    flaws: string[]
    strengths: string[]
  }
  ai_pitch: string | null
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  lead_id: string
  unread_count: number
  last_message_at: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
  // Joined
  leads?: Lead
  messages?: Message[]
}

export interface Message {
  id: string
  conversation_id: string
  direction: MessageDirection
  body: string
  status: MessageStatus
  is_ai_draft: boolean
  wa_message_id: string | null
  media_url: string | null
  media_type: string | null
  error_message: string | null
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  created_at: string
  updated_at: string
}

export interface WaTemplate {
  id: string
  name: string
  body: string
  variables: string[]
  category: string
  is_active: boolean
  created_at: string
}
