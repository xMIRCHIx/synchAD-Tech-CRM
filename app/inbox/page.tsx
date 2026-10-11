'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  MessageSquare, MessageCircle, Phone, Search, CheckCheck, Send,
  Sparkles, ExternalLink, Globe, MapPin, Check, Copy,
  PartyPopper, RefreshCw, PanelRight, X, AlertTriangle, ShieldCheck,
  ChevronLeft, ArrowUpRight, Clock, Star, Flame, UserCheck
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

let cachedInboxData: { leads: Lead[]; conversations: Record<string, any> } | null = null

export default function InboxPage() {
  const [leads, setLeads] = useState<Lead[]>(cachedInboxData?.leads || [])
  const [conversations, setConversations] = useState<Record<string, any>>(cachedInboxData?.conversations || {})
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(cachedInboxData?.leads?.[0]?.id || null)
  const [loading, setLoading] = useState(!cachedInboxData)
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'new' | 'sent' | 'replied' | 'won'>('all')
  const [showDossier, setShowDossier] = useState(false)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [tokenStatus, setTokenStatus] = useState<'live' | 'expired' | 'loading' | null>(null)

  // Active chat messages & input
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [copiedPitch, setCopiedPitch] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('hello_world')

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetchInboxData(Boolean(cachedInboxData))
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
      setTokenStatus(data.metaStatus?.status === 'live' ? 'live' : 'expired')
    } catch {
      setTokenStatus('expired')
    }
  }

  async function fetchInboxData(silent = false) {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/inbox')
      const data = await res.json()
      if (data.leads && data.leads.length > 0) {
        cachedInboxData = { leads: data.leads, conversations: data.conversations || {} }
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
  }, [selectedLeadId, leads, conversations])

  // Filtered contacts list
  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase()
    const matchesSearch =
      l.business_name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.campaigns?.niche && l.campaigns.niche.toLowerCase().includes(q))

    if (!matchesSearch) return false

    if (filterTab === 'new') return l.status === 'new' || l.status === 'review' || l.status === 'queued'
    if (filterTab === 'sent') return l.status === 'sent' || l.status === 'delivered' || l.status === 'read'
    if (filterTab === 'replied') return l.status === 'replied'
    if (filterTab === 'won') return l.status === 'won'
    return true
  })

  // Handle Send Message
  async function handleSendMessage(textToSend?: string, tmplName?: string) {
    const templateToUse = tmplName || selectedTemplateId || 'hello_world'
    const text = (textToSend || inputText || activePitchText).trim()
    if (!text || !selectedLead) return

    setIsSending(true)
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      direction: 'outbound',
      body: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered'
    }

    setActiveMessages((prev) => [...prev, newMsg])
    setInputText('')

    try {
      // 1. Post to Inbox API
      await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          body: text,
          direction: 'outbound'
        })
      })

      // 2. Dispatch to WhatsApp API (uses verified hello_world template by default)
      const waRes = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedLead.phone,
          pitchText: text,
          leadId: selectedLead.id,
          templateName: templateToUse,
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
          description: `Verified template (hello_world) delivered to ${selectedLead.business_name} (${selectedLead.phone}).`,
          type: 'success'
        })
        fetchInboxData(true)
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

  // Official Meta WhatsApp Message Templates
  const META_TEMPLATES = [
    {
      id: 'hello_world',
      name: 'hello_world',
      category: 'Utility',
      status: 'active',
      label: '🟢 hello_world (Approved Active)',
      getText: () =>
        `Welcome and congratulations! This message demonstrates your WhatsApp Business setup.`,
    },
    {
      id: 'no_website_pitch',
      name: 'no_website_pitch',
      category: 'Marketing',
      status: 'in_review',
      label: '⏳ no_website_pitch (In Review)',
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
      status: 'in_review',
      label: '⏳ broken_website_pitch (In Review)',
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
      status: 'in_review',
      label: '⏳ website_upgrade_pitch (In Review)',
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
      status: 'in_review',
      label: '⏳ social_to_web_pitch (In Review)',
      getText: (lead: any) => {
        const name = lead?.owner_name || lead?.business_name || 'there'
        const bName = lead?.business_name || 'your business'
        const rating = lead?.google_rating || '5.0'
        const city = lead?.address ? lead.address.split(',')[0].trim() : 'your city'
        return `Hi ${name}, loved seeing your strong ${rating}★ rating and social presence for ${bName}!\n\nI noticed you're currently using a social media link instead of a dedicated business website and client portal. For a trusted brand in ${city}, having an official platform with custom management software and automated booking would significantly increase client inquiries.\n\nAt SynchAD Tech, we build modern websites and workflow systems for businesses like yours.\n\nWould you be open to checking out our work samples, or connecting on a quick 5-minute call / Zoom chat?`
      },
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
                {tokenStatus === 'live' ? <><ShieldCheck size={10} /> Meta Live</> : <><AlertTriangle size={10} /> Token Expired</>}
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

            <button
              onClick={() => fetchInboxData(false)}
              disabled={loading}
              title="Sync Supabase Leads"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-500' : ''} />
            </button>
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

                      <div className="flex items-center gap-1.5 mt-1.5">
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

                    {/* Pre-Drafted Hook Card */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-stone-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                      {activePitchText}
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
                    {tmpl.name === 'hello_world' ? '🟢 hello_world (Approved)' : `⏳ ${tmpl.name}`}
                  </button>
                ))}
              </div>

              {/* Message Composer Bar */}
              <div className="p-3 sm:p-4 bg-white dark:bg-[#202c33] border-t border-slate-200 dark:border-stone-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                  className="flex items-center gap-2 max-w-5xl mx-auto"
                >
                  <input
                    type="text"
                    placeholder="Type your WhatsApp message or pitch (Press Enter to send)..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-[#2a3942] border border-transparent focus:border-[#00a884] focus:bg-white dark:focus:bg-[#111b21] rounded-2xl text-xs font-medium outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-inner"
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
    </div>
  )
}
