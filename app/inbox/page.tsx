'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  MessageSquare, MessageCircle, Phone, Search, CheckCheck, Send,
  Sparkles, ExternalLink, Globe, MapPin, Check, Copy,
  PartyPopper, RefreshCw, PanelRight, X, AlertTriangle, ShieldCheck,
  ChevronLeft, ArrowUpRight, Clock, Star, Flame, UserCheck, Trash2, Eraser, UserPlus
} from 'lucide-react'
import Toast, { ToastMessage } from '@/components/Toast'
import type { Lead, LeadStatus, SiteState } from '@/lib/types'

interface ChatMessage {
  id: string
  direction: 'inbound' | 'outbound'
  body: string
  timestamp: string
  status?: 'sent' | 'delivered' | 'read'
}

export default function InboxPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [conversations, setConversations] = useState<Record<string, any>>({})
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'custom' | 'new' | 'sent' | 'replied' | 'won'>('all')
  const [showDossier, setShowDossier] = useState(false)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [tokenStatus, setTokenStatus] = useState<'live' | 'expired' | 'blocked' | 'loading' | null>(null)
  const [tokenErrorMessage, setTokenErrorMessage] = useState<string>('')

  // Direct chat modal state
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)
  const [newChatPhone, setNewChatPhone] = useState('')
  const [newChatName, setNewChatName] = useState('')
  const [newChatMessage, setNewChatMessage] = useState('')
  const [isCreatingChat, setIsCreatingChat] = useState(false)

  // Active chat messages & input
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [copiedPitch, setCopiedPitch] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('hello_world')
  const [deleteMenuOpen, setDeleteMenuOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; action: 'clear_chat' | 'delete_lead' | null }>({
    open: false,
    action: null
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const sendingRef = useRef(false)

  useEffect(() => {
    fetchInboxData(false)
    checkTokenStatus()

    // Real-time polling every 4 seconds to catch inbound WhatsApp replies instantly
    const interval = setInterval(() => {
      fetchInboxData(true)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  async function checkTokenStatus() {
    setTokenStatus('loading')
    try {
      const res = await fetch('/api/whatsapp/profile', { cache: 'no-store' })
      const data = await res.json()
      if (data.metaStatus?.status === 'live') {
        setTokenStatus('live')
      } else if (data.metaStatus?.status === 'api_blocked') {
        setTokenStatus('blocked')
        setTokenErrorMessage(data.metaStatus?.message || 'Meta API Access Blocked (Code 200).')
      } else {
        setTokenStatus('expired')
        setTokenErrorMessage(data.metaStatus?.message || 'Meta Access Token Expired.')
      }
    } catch {
      setTokenStatus('expired')
    }
  }

  async function fetchInboxData(silent = false) {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/inbox', { cache: 'no-store' })
      const data = await res.json()
      if (data.leads && data.leads.length > 0) {
        setLeads(data.leads)
        setConversations(data.conversations || {})
        setSelectedLeadId((prev) => prev || data.leads[0].id)
      }
    } catch (err: any) {
      console.error('Failed to load inbox data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Active Lead
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0] || null

  // Auto-scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeMessages])

  // Generate or load messages whenever selectedLead changes
  useEffect(() => {
    if (!selectedLead) return

    const conv = conversations[selectedLead.id]
    if (conv?.messages && conv.messages.length > 0) {
      const formatted: ChatMessage[] = conv.messages.map((m: any) => ({
        id: m.id,
        direction: m.direction,
        body: m.body,
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: m.status || 'read'
      }))
      setActiveMessages(formatted)
    } else {
      // Clean real state: No fake/mock messages. Empty conversation until real pitch is sent.
      setActiveMessages([])
    }

    if (selectedLead?.site_state === 'broken') {
      setSelectedTemplateId('broken_website_pitch')
    } else if (selectedLead?.site_state === 'none') {
      const url = (selectedLead.website_url || '').toLowerCase()
      if (url.includes('instagram') || url.includes('facebook') || url.includes('linktr.ee') || url.includes('wa.me')) {
        setSelectedTemplateId('social_to_web_pitch')
      } else {
        setSelectedTemplateId('no_website_pitch')
      }
    } else if (selectedLead?.site_state === 'exists') {
      setSelectedTemplateId('website_upgrade_pitch')
    }
  }, [selectedLeadId, leads, conversations])

  // Filtered contacts list
  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase()
    const matchesSearch =
      l.business_name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.campaigns?.niche && l.campaigns.niche.toLowerCase().includes(q))

    if (!matchesSearch) return false

    if (filterTab === 'custom') {
      const isDirect = !l.campaign_id
      const isCustomNote = l.notes && (
        l.notes.toLowerCase().includes('custom') ||
        l.notes.toLowerCase().includes('direct') ||
        l.notes.toLowerCase().includes('manual') ||
        l.notes.toLowerCase().includes('inbound')
      )
      return isDirect || Boolean(isCustomNote)
    }

    if (filterTab === 'new') return l.status === 'new' || l.status === 'review' || l.status === 'queued'
    if (filterTab === 'sent') return l.status === 'sent' || l.status === 'delivered' || l.status === 'read'
    if (filterTab === 'replied') return l.status === 'replied'
    if (filterTab === 'won') return l.status === 'won'
    return true
  })

  // Handle Send Message (Single Atomic Dispatch to Meta + Supabase)
  async function handleSendMessage(textToSend?: string, tmplName?: string) {
    if (sendingRef.current || isSending) return
    const text = (textToSend || inputText || activePitchText).trim()
    if (!text || !selectedLead) return

    sendingRef.current = true
    setIsSending(true)

    const templateToUse = tmplName || selectedTemplateId || 'no_website_pitch'
    const tempId = `temp-${Date.now()}`
    const newMsg: ChatMessage = {
      id: tempId,
      direction: 'outbound',
      body: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered'
    }

    setActiveMessages((prev) => [...prev, newMsg])
    setInputText('')

    try {
      // Dispatch exclusively to WhatsApp API (sends to Meta and records single message to Supabase)
      const waRes = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedLead.phone,
          pitchText: text,
          leadId: selectedLead.id,
          templateName: templateToUse,
          templateParams:
            templateToUse === 'website_upgrade_pitch'
              ? [
                  selectedLead.owner_name || selectedLead.business_name || 'there',
                  selectedLead.business_name || 'your business',
                  selectedLead.google_rating ? String(selectedLead.google_rating) : '5.0',
                  selectedLead.website_audits?.findings?.flaws?.[0] || 'missing a 1-tap WhatsApp booking button'
                ]
              : templateToUse === 'social_to_web_pitch'
              ? [
                  selectedLead.owner_name || selectedLead.business_name || 'there',
                  selectedLead.google_rating ? String(selectedLead.google_rating) : '5.0',
                  selectedLead.business_name || 'your business',
                  selectedLead.address ? selectedLead.address.split(',')[0].trim() : 'your city'
                ]
              : [
                  selectedLead.owner_name || selectedLead.business_name || 'there',
                  selectedLead.business_name || 'your business',
                  selectedLead.google_rating ? String(selectedLead.google_rating) : '5.0',
                  selectedLead.address ? selectedLead.address.split(',')[0].trim() : 'your city'
                ],
          useTextOnly: Boolean(conversations[selectedLead.id]?.messages?.length)
        })
      })

      const waData = await waRes.json()

      if (!waRes.ok || !waData.success) {
        setToast({
          id: Date.now().toString(),
          title: 'Meta WhatsApp Delivery Notice',
          description: waData.error || 'Failed to dispatch via Meta WhatsApp API.',
          type: 'error'
        })
      } else {
        // Update local lead status to 'sent'
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLead.id && l.status !== 'won' ? { ...l, status: 'sent' } : l))
        )

        setToast({
          id: Date.now().toString(),
          title: 'Delivered via WhatsApp API',
          description: `Verified template (${templateToUse}) delivered to ${selectedLead.business_name} (${selectedLead.phone}).`,
          type: 'success'
        })
        await fetchInboxData(true)
      }
    } catch (err: any) {
      console.error(err)
      setToast({
        id: Date.now().toString(),
        title: 'Error Sending',
        description: err.message,
        type: 'error'
      })
    } finally {
      sendingRef.current = false
      setIsSending(false)
    }
  }

  // Update lead status
  async function handleUpdateStatus(newStatus: LeadStatus) {
    if (!selectedLead) return
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedLead.id, status: newStatus })
      })
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLead.id ? { ...l, status: newStatus } : l))
        )
        setToast({
          id: Date.now().toString(),
          title: 'Status Updated',
          description: `Lead moved to "${newStatus.toUpperCase()}".`,
          type: 'success'
        })
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  // Open external WhatsApp App (wa.me)
  const handleOpenExternalWhatsApp = () => {
    if (!selectedLead) return
    const cleanPhone = selectedLead.phone.replace(/[^\d]/g, '')
    const pitch =
      inputText ||
      selectedLead.website_audits?.ai_pitch ||
      selectedLead.pitch_angle ||
      `Hi ${selectedLead.business_name}!`
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(pitch)}`
    window.open(url, '_blank')
  }

  // Copy phone number
  const handleCopyPhone = () => {
    if (!selectedLead) return
    navigator.clipboard.writeText(selectedLead.phone)
    setCopiedPhone(true)
    setTimeout(() => setCopiedPhone(false), 2000)
  }

  // Delete Lead or Clear Chat History
  async function handleConfirmDelete() {
    if (!selectedLead || !confirmModal.action) return
    setIsDeleting(true)
    const action = confirmModal.action
    const currentLeadId = selectedLead.id
    const leadName = selectedLead.business_name

    try {
      const res = await fetch(`/api/inbox?leadId=${currentLeadId}&action=${action}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.success) {
        if (action === 'delete_lead') {
          const updated = leads.filter((l) => l.id !== currentLeadId)
          setLeads(updated)
          setSelectedLeadId(updated.length > 0 ? updated[0].id : null)
          setToast({
            id: String(Date.now()),
            title: 'Lead Removed',
            description: `${leadName} and all conversations were deleted.`,
            type: 'info'
          })
        } else {
          setActiveMessages([])
          setConversations((prev) => ({
            ...prev,
            [currentLeadId]: {
              ...prev[currentLeadId],
              messages: []
            }
          }))
          setToast({
            id: String(Date.now()),
            title: 'Chat History Cleared',
            description: `All message history cleared for ${leadName}.`,
            type: 'info'
          })
        }
      } else {
        throw new Error(data.error || 'Failed to perform delete')
      }
    } catch (err: any) {
      setToast({
        id: String(Date.now()),
        title: 'Delete Failed',
        description: err.message,
        type: 'error'
      })
    } finally {
      setIsDeleting(false)
      setConfirmModal({ open: false, action: null })
      setDeleteMenuOpen(false)
    }
  }

  // Start chat with any custom / direct phone number
  async function handleStartNewChat(e: React.FormEvent) {
    e.preventDefault()
    let rawPhone = newChatPhone.trim().replace(/[^\d+]/g, '')
    if (!rawPhone) return

    // If Indian 10-digit number without +, normalize to +91
    if (/^\d{10}$/.test(rawPhone)) {
      rawPhone = `+91${rawPhone}`
    } else if (/^91\d{10}$/.test(rawPhone)) {
      rawPhone = `+${rawPhone}`
    } else if (!rawPhone.startsWith('+')) {
      rawPhone = `+${rawPhone}`
    }

    setIsCreatingChat(true)
    try {
      // 1. Check if lead already exists in current list
      const cleanDigits = rawPhone.replace(/[^\d]/g, '')
      const existing = leads.find((l) => {
        const pDigits = l.phone.replace(/[^\d]/g, '')
        return pDigits === cleanDigits || pDigits.slice(-10) === cleanDigits.slice(-10)
      })

      let targetLead: Lead

      if (existing) {
        targetLead = existing
        setSelectedLeadId(existing.id)
      } else {
        // Create new direct lead in Supabase via /api/leads
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business_name: newChatName.trim() || `Direct Contact (${rawPhone})`,
            phone: rawPhone,
            status: 'new',
            site_state: 'unknown',
            notes: 'Custom direct WhatsApp contact',
            is_custom: true
          })
        })
        const data = await res.json()
        if (data.leads && data.leads.length > 0) {
          targetLead = data.leads[0]
          setLeads((prev) => [targetLead, ...prev])
          setSelectedLeadId(targetLead.id)
        } else {
          throw new Error(data.error || 'Failed to create contact')
        }
      }

      // 2. If initial message was provided, send it immediately via WhatsApp Cloud API
      if (newChatMessage.trim()) {
        const msgText = newChatMessage.trim()
        await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: rawPhone,
            pitchText: msgText,
            leadId: targetLead.id,
            useTextOnly: true,
            templateName: 'hello_world'
          })
        })

        const newMsg: ChatMessage = {
          id: `temp-${Date.now()}`,
          direction: 'outbound',
          body: msgText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'delivered'
        }
        setActiveMessages((prev) => [...prev, newMsg])
      }

      setToast({
        id: String(Date.now()),
        title: 'Chat Opened',
        description: `Connected to ${targetLead.business_name} (${rawPhone})`,
        type: 'success'
      })

      setNewChatPhone('')
      setNewChatName('')
      setNewChatMessage('')
      setIsNewChatModalOpen(false)
      setMobileChatOpen(true)
    } catch (err: any) {
      setToast({
        id: String(Date.now()),
        title: 'Error',
        description: err.message,
        type: 'error'
      })
    } finally {
      setIsCreatingChat(false)
    }
  }

  // Official Meta WhatsApp Message Templates (All 4 Approved & Live)
  const META_TEMPLATES = [
    {
      id: 'no_website_pitch',
      name: 'no_website_pitch',
      category: 'Marketing',
      status: 'active',
      label: '🟢 no_website_pitch (Approved Active)',
      headline: '🌐 Official Website & Client Portal Audit',
      footer: 'SynchAD Tech Services • Business Growth Systems',
      buttons: ['View Work Samples', 'Connect on Call'],
      getText: (lead: any) => {
        const name = lead?.owner_name || lead?.business_name || 'there'
        const bName = lead?.business_name || 'your business'
        const rating = lead?.google_rating || '5.0'
        const city = lead?.address ? lead.address.split(',')[0].trim() : 'your city'
        return `Hi ${name}, I came across ${bName} on Google Maps today.\n\nHuge congratulations on your impressive ${rating}★ rating — your customer reviews in ${city} are genuinely top-tier!\n\nHowever, I noticed you don't have an official website or digital booking portal listed yet. A reputable business like yours easily loses direct client inquiries to competitors.\n\nAt SynchAD Tech, we build high-converting modern websites and custom business management software tailored for businesses like yours.\n\nWould you be open to checking out a few of our work samples, or connecting for a quick 5-minute call / Zoom chat?`
      },
    },
    {
      id: 'broken_website_pitch',
      name: 'broken_website_pitch',
      category: 'Marketing',
      status: 'active',
      label: '🟢 broken_website_pitch (Approved Active)',
      headline: '⚠️ Urgent: Website Link Error Detected',
      footer: 'SynchAD Tech Services • Rapid Web Support',
      buttons: ['Fix Broken Website', 'Schedule 5-Min Zoom'],
      getText: (lead: any) => {
        const name = lead?.owner_name || lead?.business_name || 'there'
        const bName = lead?.business_name || 'your business'
        const rating = lead?.google_rating || '5.0'
        const city = lead?.address ? lead.address.split(',')[0].trim() : 'your city'
        return `Hi ${name}, I was checking out ${bName} on Google Maps today.\n\nYour ${rating}★ rating and customer reputation in ${city} are fantastic!\n\nThat's why I wanted to alert you urgently — your website link is currently broken and showing an error page. Anyone clicking your profile from Google right now is bouncing off without inquiring.\n\nAt SynchAD Tech, we build modern web systems and custom business management software, and we can quickly restore and upgrade this for you.\n\nWould it be okay if I share our work samples, or hop on a quick 5-minute call / Zoom to help you fix this?`
      },
    },
    {
      id: 'website_upgrade_pitch',
      name: 'website_upgrade_pitch',
      category: 'Marketing',
      status: 'active',
      label: '🟢 website_upgrade_pitch (Approved Active)',
      headline: '🚀 Mobile Conversion & Funnel Audit',
      footer: 'SynchAD Tech Services • Business Systems & Portals',
      buttons: ['Review Audit Findings', 'Connect with Dev Team'],
      getText: (lead: any) => {
        const name = lead?.owner_name || lead?.business_name || 'there'
        const bName = lead?.business_name || 'your business'
        const rating = lead?.google_rating || '5.0'
        const flaw = lead?.website_audits?.findings?.flaws?.[0] || 'missing a quick 1-tap WhatsApp booking button'
        return `Hi ${name}, huge fan of the work ${bName} is doing with a solid ${rating}★ rating on Google!\n\nWhile checking your digital presence, I noticed ${flaw} on your website that might be slowing down your mobile conversion rate.\n\nBeyond modern web platforms, at SynchAD Tech we also build custom business management software, CRM portals, and automated client booking systems.\n\nWould you be open to checking out our work samples, or having a quick 5-minute call / Zoom to discuss?`
      },
    },
    {
      id: 'social_to_web_pitch',
      name: 'social_to_web_pitch',
      category: 'Marketing',
      status: 'active',
      label: '🟢 social_to_web_pitch (Approved Active)',
      headline: '📲 Social-to-Website Conversion Architecture',
      footer: 'SynchAD Tech Services • Automated Client Booking',
      buttons: ['See Web Samples', 'Request Demo Portal'],
      getText: (lead: any) => {
        const name = lead?.owner_name || lead?.business_name || 'there'
        const bName = lead?.business_name || 'your business'
        const rating = lead?.google_rating || '5.0'
        const city = lead?.address ? lead.address.split(',')[0].trim() : 'your city'
        return `Hi ${name}, loved seeing your strong ${rating}★ rating and social presence for ${bName}!\n\nI noticed you're currently using a social media link instead of a dedicated business website and client portal. For a trusted brand in ${city}, having an official platform with custom management software and automated booking would significantly increase client inquiries.\n\nAt SynchAD Tech, we build modern websites and workflow systems for businesses like yours.\n\nWould you be open to checking out our work samples, or connecting on a quick 5-minute call / Zoom chat?`
      },
    },
    {
      id: 'hello_world',
      name: 'hello_world',
      category: 'Utility',
      status: 'active',
      label: '🟢 hello_world (Approved Active)',
      headline: '👋 Verified WhatsApp Connection',
      footer: 'SynchAD Tech Automated Verification',
      buttons: ['Confirm Receipt'],
      getText: () =>
        `Welcome and congratulations! This message demonstrates your WhatsApp Business setup.`,
    },
  ]

  const activeTemplate =
    META_TEMPLATES.find((t) => t.id === selectedTemplateId) || META_TEMPLATES[0]
  const activePitchText = activeTemplate.getText(selectedLead)

  const flaws = selectedLead?.website_audits?.findings?.flaws || []
  const score = selectedLead?.score ?? 78

  const getWebsiteBadge = (state?: SiteState) => {
    switch (state) {
      case 'broken':
        return { label: 'Broken Link ⚠️', cls: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' }
      case 'none':
        return { label: 'No Website', cls: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' }
      case 'exists':
        return { label: 'Active Website', cls: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' }
      default:
        return { label: 'No Website', cls: 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-stone-700' }
    }
  }

  const webBadge = getWebsiteBadge(selectedLead?.site_state)

  return (
    <div className="h-[calc(100vh-4.25rem)] flex flex-col bg-slate-50 dark:bg-[#0c1317] p-2.5 sm:p-4 overflow-hidden animate-fade-in font-sans">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* API Blocked Warning Banner (Security Checkpoint / Account Action Required) */}
      {tokenStatus === 'blocked' && (
        <div className="mb-2 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-900 dark:text-rose-200 flex flex-wrap items-center justify-between gap-2 shrink-0 animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={16} className="text-rose-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold">⚠️ Meta API Access Blocked (OAuth Code 200) — Action Required on Meta!</p>
              <p className="text-[11px] opacity-90">
                Meta has temporarily restricted API calls for a security checkpoint, 2FA verification, or Developer Terms review. Open Meta Developers or generate a new System User token in Business Settings.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://developers.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-black px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>🔓 Open Meta Developers</span>
              <ArrowUpRight size={11} />
            </a>
            <Link
              href="/whatsapp-profile"
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white/20 dark:bg-stone-800 hover:bg-white/30 text-slate-800 dark:text-slate-200 transition-colors"
            >
              Update Token
            </Link>
          </div>
        </div>
      )}

      {/* Token Expired Warning Banner */}
      {tokenStatus === 'expired' && (
        <div className="mb-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2 shrink-0 animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold">⚠️ Meta WhatsApp Token Expired — Messages are NOT being delivered!</p>
              <p className="text-[11px] opacity-90">Your access token has expired. Messages are saving to CRM but <strong>not reaching WhatsApp</strong>. Update your token immediately.</p>
            </div>
          </div>
          <Link
            href="/whatsapp-profile"
            className="text-[11px] font-black px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-sm"
          >
            <span>🔑 Update Token Now</span>
            <ArrowUpRight size={11} />
          </Link>
        </div>
      )}

      {/* Official WhatsApp Business Identity Bar */}
      <div className={`mb-2.5 px-3.5 py-2 rounded-xl text-white flex flex-wrap items-center justify-between gap-2 shadow-sm shrink-0 ${
        tokenStatus === 'live'
          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
          : 'bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white text-emerald-700 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
            Syn
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-xs">Synchad</span>
              <span className="text-[10px] font-mono opacity-90">(+91 70675 49982)</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5 ${
                tokenStatus === 'live' ? 'bg-white/20 text-white' : 'bg-amber-500/30 text-amber-200'
              }`}>
                {tokenStatus === 'live' ? (
                  <><ShieldCheck size={10} /> Meta Live</>
                ) : tokenStatus === 'blocked' ? (
                  <><AlertTriangle size={10} /> API Blocked (Code 200)</>
                ) : (
                  <><AlertTriangle size={10} /> Token Expired</>
                )}
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/whatsapp-profile"
          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors flex items-center gap-1 shrink-0"
        >
          <span>{tokenStatus === 'live' ? 'Manage WhatsApp Profile & Logo' : '🔑 Fix Token'}</span>
          <ArrowUpRight size={12} />
        </Link>
      </div>

      {/* Main Inbox Workspace Container */}
      <div className="flex-1 flex overflow-hidden rounded-2xl border border-slate-200 dark:border-stone-800 bg-white dark:bg-[#111b21] shadow-xl">
        
        {/* ========================================================= */}
        {/* COLUMN 1: CONTACTS & CHAT LIST (WhatsApp Sidebar) */}
        {/* ========================================================= */}
        <div className={`w-full md:w-80 lg:w-[350px] shrink-0 border-r border-slate-200 dark:border-stone-800 flex flex-col bg-white dark:bg-[#111b21] ${
          mobileChatOpen ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Top Sidebar Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-stone-800 bg-slate-100/70 dark:bg-[#202c33]/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#25D366]/15 dark:bg-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                <MessageSquare size={17} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                  WhatsApp Outreach
                </h2>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {leads.length} Ingested Leads
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                title="Message any new or random phone number"
                className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors shrink-0"
              >
                <UserPlus size={13} />
                <span className="hidden sm:inline">+ New Chat</span>
                <span className="sm:hidden">+</span>
              </button>

              <button
                onClick={() => fetchInboxData(false)}
                disabled={loading}
                title="Sync Supabase Leads"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-500' : ''} />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-slate-200 dark:border-stone-800 bg-white dark:bg-[#111b21] space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search leads, phone, or niche..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-[#202c33] border border-transparent dark:border-stone-700/50 rounded-xl focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111b21] outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all font-medium"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {[
                { key: 'all', label: 'All' },
                { key: 'custom', label: 'Custom Leads' },
                { key: 'new', label: 'Review' },
                { key: 'sent', label: 'Sent' },
                { key: 'replied', label: 'Replied' },
                { key: 'won', label: 'Won 🏆' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key as any)}
                  className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    filterTab === tab.key
                      ? 'bg-[#005c4b] dark:bg-[#00a884] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#202c33] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact List Feed */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-stone-800/60 bg-white dark:bg-[#111b21]">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-emerald-500" />
                Loading WhatsApp contacts...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No matching leads found.
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = lead.id === selectedLead?.id
                const conv = conversations[lead.id]
                const lastMsg = conv?.messages?.length ? conv.messages[conv.messages.length - 1] : null
                const previewSnippet =
                  lastMsg
                    ? (lastMsg.direction === 'outbound' ? 'You: ' : '') + lastMsg.body.slice(0, 48)
                    : lead.website_audits?.ai_pitch?.slice(0, 52) ||
                      lead.pitch_angle ||
                      'Ready to send AI WhatsApp pitch...'

                return (
                  <div
                    key={lead.id}
                    onClick={() => {
                      setSelectedLeadId(lead.id)
                      setMobileChatOpen(true)
                    }}
                    className={`p-3 cursor-pointer transition-all flex items-start gap-3 border-l-4 ${
                      isSelected
                        ? 'bg-slate-100/90 dark:bg-[#2a3942] border-[#00a884]'
                        : lead.status === 'replied'
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-[#202c33]/70'
                    }`}
                  >
                    {/* Business Initial Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xs shadow-xs">
                        {lead.business_name.slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-[#111b21] ${
                          lead.status === 'won'
                            ? 'bg-emerald-500'
                            : lead.status === 'replied'
                            ? 'bg-emerald-500 animate-pulse'
                            : lead.status === 'sent'
                            ? 'bg-indigo-500'
                            : 'bg-amber-400'
                        }`}
                      />
                    </div>

                    {/* Contact Info & Snippet */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {lead.business_name}
                        </h4>
                        <span className={`text-[10px] font-bold shrink-0 ml-1 ${
                          lead.status === 'replied'
                            ? 'text-emerald-600 dark:text-emerald-400 font-black'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {lead.status === 'replied'
                            ? '💬 Replied'
                            : lead.status === 'won'
                            ? 'Won 🏆'
                            : lead.status === 'sent'
                            ? 'Sent'
                            : 'New'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-snug">
                        {previewSnippet}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {(!lead.campaign_id || (lead.notes && (lead.notes.toLowerCase().includes('custom') || lead.notes.toLowerCase().includes('direct') || lead.notes.toLowerCase().includes('manual') || lead.notes.toLowerCase().includes('inbound')))) && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Custom
                          </span>
                        )}
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase bg-slate-200 dark:bg-stone-800 text-slate-700 dark:text-slate-300">
                          {lead.status}
                        </span>
                        {lead.google_rating && (
                          <span className="text-[10px] text-amber-500 font-extrabold flex items-center gap-0.5">
                            ★ {lead.google_rating}
                          </span>
                        )}
                        <span className="text-[10px] font-mono font-extrabold text-purple-600 dark:text-purple-400 ml-auto">
                          Score {lead.score ?? 78}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 2: ACTIVE WHATSAPP CHAT AREA (Spacious & Clean) */}
        {/* ========================================================= */}
        <div className={`flex-1 flex flex-col bg-[#efeae2]/50 dark:bg-[#0b141a] min-w-0 relative ${
          !mobileChatOpen ? 'hidden md:flex' : 'flex'
        }`}>
          {selectedLead ? (
            <>
              {/* WhatsApp Chat Top Header Bar */}
              <div className="p-3 sm:p-3.5 border-b border-slate-200 dark:border-stone-800 bg-white dark:bg-[#202c33] flex items-center justify-between gap-3 shadow-xs shrink-0">
                
                {/* Left: Contact Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileChatOpen(false)}
                    className="md:hidden p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                    {selectedLead.business_name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                        {selectedLead.business_name}
                      </h3>
                      {selectedLead.google_rating && (
                        <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          {selectedLead.google_rating}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      {/* Phone with copy */}
                      <button
                        onClick={handleCopyPhone}
                        title="Click to copy phone"
                        className="font-mono text-xs font-black text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>{selectedLead.phone}</span>
                        {copiedPhone ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} className="text-slate-400" />}
                      </button>

                      <span className="text-slate-300 dark:text-stone-700">•</span>

                      {/* Website status tag */}
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border ${webBadge.cls}`}>
                        {webBadge.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions & Tools */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Status Dropdown */}
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as any)}
                    className="text-[11px] font-black uppercase px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#111b21] border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="new">Review</option>
                    <option value="queued">Queued</option>
                    <option value="sent">Sent</option>
                    <option value="replied">Replied</option>
                    <option value="won">Won 🏆</option>
                  </select>

                  {/* Mark as Won Button */}
                  {selectedLead.status !== 'won' && (
                    <button
                      onClick={() => handleUpdateStatus('won')}
                      className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
                    >
                      <PartyPopper size={13} />
                      <span>Convert Won</span>
                    </button>
                  )}

                  {/* Open in WhatsApp App / Web (wa.me helper link) */}
                  <button
                    onClick={handleOpenExternalWhatsApp}
                    title="Open chat in official WhatsApp app or web (wa.me)"
                    className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-[#111b21] border border-transparent hover:border-slate-200 dark:hover:border-stone-700 transition-colors cursor-pointer"
                  >
                    <ArrowUpRight size={16} />
                  </button>

                  {/* Delete / Clear Chat Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setDeleteMenuOpen(!deleteMenuOpen)}
                      title="Delete chat or contact options"
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>

                    {deleteMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setDeleteMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-[#202c33] border border-slate-200 dark:border-stone-700 rounded-2xl shadow-xl z-50 p-1.5 animate-scale-in text-xs">
                          <button
                            onClick={() => {
                              setDeleteMenuOpen(false)
                              setConfirmModal({ open: true, action: 'clear_chat' })
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-stone-700/60 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Eraser size={14} className="text-amber-500 shrink-0" />
                            <div>
                              <p className="font-bold">Clear Chat History</p>
                              <p className="text-[10px] text-slate-400">Delete messages, keep lead</p>
                            </div>
                          </button>

                          <div className="my-1 border-t border-slate-100 dark:border-stone-700/50" />

                          <button
                            onClick={() => {
                              setDeleteMenuOpen(false)
                              setConfirmModal({ open: true, action: 'delete_lead' })
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} className="text-rose-500 shrink-0" />
                            <div>
                              <p className="font-bold">Delete Lead & Chat</p>
                              <p className="text-[10px] text-rose-400/80">Completely remove from CRM</p>
                            </div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Toggle Right Dossier (Flaws & Intelligence) */}
                  <button
                    onClick={() => setShowDossier(!showDossier)}
                    title={showDossier ? 'Hide Lead Dossier' : 'Show Lead Dossier & Flaws'}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      showDossier
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-[#111b21] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-stone-700 hover:border-indigo-500'
                    }`}
                  >
                    <PanelRight size={14} />
                    <span className="hidden lg:inline">{showDossier ? 'Close Info' : 'Lead Info'}</span>
                  </button>
                </div>
              </div>

              {/* Chat Message Scrollable Canvas */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                
                {/* Top Encryption Pill */}
                <div className="text-center my-1">
                  <span className="inline-block px-3 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-[#182229] text-amber-800 dark:text-amber-200/90 border border-amber-200/70 dark:border-amber-900/40 shadow-2xs">
                    🔒 Direct WhatsApp Business Messaging channel with {selectedLead.business_name}
                  </span>
                </div>

                {/* Case A: If No Messages Yet -> Show Official Meta Approved Template Card */}
                {activeMessages.length === 0 ? (
                  <div className="max-w-2xl mx-auto my-6 bg-white dark:bg-[#182229] border border-slate-200 dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-md animate-fade-in space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                          <MessageCircle size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              Official Meta WhatsApp Template
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              activeTemplate.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}>
                              {activeTemplate.status === 'active' ? '● Approved & Active' : '⏳ In Review'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            Template: <code className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{activeTemplate.name}</code> ({activeTemplate.category})
                          </p>
                        </div>
                      </div>

                      {/* Template Selector Dropdown */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Template:</span>
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => {
                            const newId = e.target.value
                            setSelectedTemplateId(newId)
                            const tmpl = META_TEMPLATES.find((t) => t.id === newId)
                            if (tmpl) setInputText(tmpl.getText(selectedLead))
                          }}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#111b21] border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white outline-none cursor-pointer"
                        >
                          {META_TEMPLATES.map((tmpl) => (
                            <option key={tmpl.id} value={tmpl.id}>
                              {tmpl.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Pre-Drafted Hook Card with Realistic WhatsApp Template Styling */}
                    <div className="rounded-2xl bg-white dark:bg-[#111b21] border border-slate-200 dark:border-stone-800 shadow-sm overflow-hidden">
                      {/* Headline Header */}
                      <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-transparent border-b border-emerald-500/15 flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wide flex items-center gap-1.5">
                          <Sparkles size={12} />
                          {activeTemplate.headline}
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                          Meta Approved
                        </span>
                      </div>

                      {/* Body */}
                      <div className="p-4 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                        {activePitchText}
                      </div>

                      {/* Footer */}
                      <div className="px-4 pb-2.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium italic border-t border-slate-100 dark:border-stone-800/60 pt-2">
                        {activeTemplate.footer}
                      </div>

                      {/* Interactive Buttons Preview */}
                      <div className="px-3 py-2 bg-slate-50 dark:bg-[#202c33]/50 border-t border-slate-200 dark:border-stone-800 flex flex-wrap gap-2">
                        {activeTemplate.buttons.map((btn: string, idx: number) => (
                          <div
                            key={idx}
                            className="px-3 py-1 rounded-lg text-[10px] font-extrabold bg-white dark:bg-[#111b21] border border-slate-200 dark:border-stone-700 text-slate-700 dark:text-slate-200 shadow-2xs flex items-center gap-1.5"
                          >
                            <MessageSquare size={10} className="text-[#00a884]" />
                            <span>{btn}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Send Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => handleSendMessage(activePitchText, activeTemplate.name)}
                        disabled={isSending}
                        className="px-4 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
                      >
                        <Send size={13} />
                        <span>1-Click Send via WhatsApp ({activeTemplate.name})</span>
                      </button>

                      <button
                        onClick={() => setInputText(activePitchText)}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-black text-xs border border-slate-200 dark:border-stone-700 cursor-pointer transition-colors"
                      >
                        ✏️ Edit in Composer
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activePitchText)
                          setCopiedPitch(true)
                          setTimeout(() => setCopiedPitch(false), 2000)
                        }}
                        className="px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer ml-auto"
                      >
                        {copiedPitch ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        <span>{copiedPitch ? 'Copied' : 'Copy Template'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // Case B: Existing WhatsApp Message Stream
                  activeMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl shadow-sm text-xs leading-relaxed ${
                          msg.direction === 'outbound'
                            ? 'bg-[#005c4b] text-white rounded-tr-xs'
                            : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-stone-700/60 rounded-tl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap font-medium">{msg.body}</p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] font-bold ${
                            msg.direction === 'outbound' ? 'text-emerald-200' : 'text-slate-400'
                          }`}
                        >
                          <span>{msg.timestamp}</span>
                          {msg.direction === 'outbound' && (
                            <CheckCheck
                              size={14}
                              className={msg.status === 'read' ? 'text-[#53bdeb]' : 'text-emerald-200'}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Meta Template Quick Toolbar */}
              <div className="px-4 py-2 bg-white dark:bg-[#202c33] border-t border-slate-200 dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mr-1 shrink-0">
                  Meta Templates:
                </span>
                {META_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id)
                      setInputText(tmpl.getText(selectedLead))
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer border ${
                      selectedTemplateId === tmpl.id
                        ? 'bg-[#00a884] text-white border-[#00a884] shadow-2xs'
                        : 'bg-slate-100 dark:bg-[#111b21] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-stone-700/80'
                    }`}
                  >
                    🟢 {tmpl.name}
                  </button>
                ))}
              </div>

              {/* Message Composer Bar */}
              <div className="p-3 sm:p-4 bg-white dark:bg-[#202c33] border-t border-slate-200 dark:border-stone-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!isSending) handleSendMessage()
                  }}
                  className="flex items-center gap-2 max-w-5xl mx-auto"
                >
                  <input
                    type="text"
                    placeholder="Type your WhatsApp message or pitch (Press Enter to send)..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isSending}
                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-[#2a3942] border border-transparent focus:border-[#00a884] focus:bg-white dark:focus:bg-[#111b21] rounded-2xl text-xs font-medium outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-inner disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !inputText.trim()}
                    className="w-11 h-11 rounded-2xl bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 disabled:opacity-40 disabled:scale-100 cursor-pointer"
                    title="Send WhatsApp message"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 space-y-3">
              <MessageSquare size={36} className="text-slate-300 dark:text-stone-700" />
              <p className="text-sm font-bold">Select a lead from the list to start WhatsApp outreach</p>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* COLUMN 3: COLLAPSIBLE LEAD DOSSIER (Opened only on demand) */}
        {/* ========================================================= */}
        {showDossier && selectedLead && (
          <div className="w-80 lg:w-88 border-l border-slate-200 dark:border-stone-800 flex flex-col bg-white dark:bg-[#111b21] overflow-y-auto animate-fade-in p-4 space-y-5 text-xs shrink-0">
            {/* Dossier Header */}
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-stone-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Lead Intelligence Dossier
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white mt-0.5 truncate">
                  {selectedLead.business_name}
                </h3>
              </div>
              <button
                onClick={() => setShowDossier(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Address */}
            <div className="p-3 bg-slate-50 dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-800 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Full Location Address</span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug flex items-start gap-1.5">
                <MapPin size={13} className="text-indigo-600 shrink-0 mt-0.5" />
                <span>{selectedLead.address || 'Address not listed'}</span>
              </p>
            </div>

            {/* Opportunity Score & Status */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 block">Opportunity</span>
                <span className="text-lg font-black text-purple-700 dark:text-purple-300">{score}/100</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-800">
                <span className="text-[10px] font-black uppercase text-slate-500 block">CRM Stage</span>
                <span className="text-xs font-black uppercase text-slate-900 dark:text-white mt-1 block">
                  {selectedLead.status}
                </span>
              </div>
            </div>

            {/* Website Status & Link */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Website Audit Coordinates
              </span>
              <div className="p-3 bg-slate-50 dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${webBadge.cls}`}>
                    {webBadge.label}
                  </span>
                  {selectedLead.website_url && (
                    <a
                      href={selectedLead.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 text-[11px] font-bold flex items-center gap-1 hover:underline"
                    >
                      <span>Visit Link</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                {selectedLead.website_url && (
                  <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {selectedLead.website_url}
                  </p>
                )}
              </div>
            </div>

            {/* AI Detected Bottlenecks / Flaws */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider flex items-center gap-1">
                <AlertTriangle size={12} /> Flaws & Bottlenecks Detected
              </span>
              <ul className="space-y-1.5">
                {(flaws.length > 0 ? flaws : [
                  'Lacks 1-tap WhatsApp booking button on mobile',
                  'Booking requires filling lengthy form or calling',
                  'Mobile website conversion funnel missing'
                ]).map((flaw: string, idx: number) => (
                  <li key={idx} className="p-2.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span className="text-[11px] leading-tight font-semibold text-rose-900 dark:text-rose-200">{flaw}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Origin Campaign */}
            <div className="p-3 bg-slate-50 dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-800 space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase block">Origin Campaign</span>
              <p className="font-black text-slate-900 dark:text-white">
                {selectedLead.campaigns?.name || 'Inbound Leads'}
              </p>
              <p className="text-[10px] font-semibold text-slate-500">
                {selectedLead.campaigns?.niche || 'Local Business'} • Scraped via Apify
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Clear Chat or Delete Lead */}
      {confirmModal.open && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#202c33] border border-slate-200 dark:border-stone-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-in">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
              confirmModal.action === 'delete_lead'
                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
            }`}>
              {confirmModal.action === 'delete_lead' ? <Trash2 size={24} /> : <Eraser size={24} />}
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {confirmModal.action === 'delete_lead' ? 'Delete Contact & Messages?' : 'Clear Chat History?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {confirmModal.action === 'delete_lead'
                  ? `Are you sure you want to completely remove "${selectedLead.business_name}" (${selectedLead.phone}) and all its messages from CRM?`
                  : `Are you sure you want to delete all messages for "${selectedLead.business_name}"? The contact will remain in your lead list.`}
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setConfirmModal({ open: false, action: null })}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-stone-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl text-white shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  confirmModal.action === 'delete_lead'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isDeleting ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  confirmModal.action === 'delete_lead' ? 'Yes, Delete' : 'Yes, Clear'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Direct / Random Phone WhatsApp Chat */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#202c33] border border-slate-200 dark:border-stone-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-stone-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#00a884] flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Start New WhatsApp Chat
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Message any number directly • Filtered under Custom Leads
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleStartNewChat} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Phone size={12} className="text-emerald-500" />
                  <span>Phone Number</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210 or 10 digits"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-stone-700 rounded-xl focus:border-emerald-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 font-medium transition-all"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Indian numbers automatically format to +91.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Name / Business Title <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aryan Gupta or Local Store"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-stone-700 rounded-xl focus:border-emerald-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 font-medium transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  First Message <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Type a message to send right now, or leave empty to just open the chat..."
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-stone-700 rounded-xl focus:border-emerald-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 font-medium transition-all resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(false)}
                  disabled={isCreatingChat}
                  className="flex-1 py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-stone-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingChat || !newChatPhone.trim()}
                  className="flex-1 py-2.5 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingChat ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={13} />
                      <span>{newChatMessage.trim() ? 'Send & Start Chat' : 'Open Chat'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
