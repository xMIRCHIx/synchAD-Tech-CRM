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
  | 'not_responded'
  | 'rejected'

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

// Agency Operating System Types
export type DealStage = 'closing' | 'in_development' | 'review' | 'delivered' | 'maintenance'
export type PaymentMode = 'upi' | 'bank_transfer' | 'cash' | 'stripe'

export interface DealInstallment {
  id: string
  label: string
  amount: number
  due_date: string
  status: 'paid' | 'pending'
}

export interface ClientDeal {
  id?: string
  lead_id: string
  client_name?: string
  client_phone?: string
  deal_value: number
  advance_paid: number
  balance_due: number
  currency: 'INR' | 'USD'
  payment_mode: PaymentMode
  service_type: string
  project_scope: string
  features?: string[]
  installments?: DealInstallment[]
  target_deadline?: string | null
  stage: DealStage
  created_at?: string
  updated_at?: string
}

export interface ClientAgreement {
  id?: string
  lead_id?: string | null
  agreement_number: string
  title: string
  content: string
  agency_signatory: string
  client_signatory: string
  client_name?: string
  client_phone?: string
  effective_date: string
  deal_value: number
  status?: 'draft' | 'sent' | 'signed' | 'completed'
  created_at?: string
}

export interface ClientInvoice {
  id?: string
  invoice_number: string
  lead_id?: string | null
  client_name: string
  client_phone: string
  client_address?: string
  amount: number
  total_amount?: number
  tax_percent?: number
  discount?: number
  status: 'draft' | 'unpaid' | 'paid' | 'overdue'
  installment_label: string
  issue_date: string
  due_date: string
  items: Array<{
    id?: string
    description: string
    details?: string
    quantity: number
    rate: number
    amount: number
  }>
  notes?: string
  payment_mode?: PaymentMode
  created_at?: string
}

export interface AgencyProfile {
  name: string
  representative: string
  partner1_role?: string
  partner2_name?: string
  partner2_role?: string
  has_dual_signatories?: boolean
  email: string
  phone: string
  address: string
  logo_url: string
  gstin?: string
  upi_id?: string
  bank_name?: string
  account_number?: string
  ifsc_code?: string
}


