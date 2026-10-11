'use client'

import React, { useState, useEffect } from 'react'
import type { Lead, LeadStatus, SiteState } from '@/lib/types'
import {
  X, Phone, Mail, MapPin, Globe, ExternalLink,
  Send, CheckCircle2, AlertTriangle, ShieldCheck,
  Sparkles, Copy, Check, FileText, Trash2, PartyPopper, RefreshCw, MessageSquare,
  UserCheck, User, Compass, HelpCircle, ArrowUpRight, Edit2, Save
} from 'lucide-react'

interface LeadDetailPanelProps {
  lead: Lead | null
  onClose: () => void
  onSendWhatsApp: (lead: Lead) => void
  onUpdateStatus: (id: string, newStatus: LeadStatus) => void
  onDeleteLead?: (id: string) => void
  onLeadEnriched?: (updatedLead: Lead) => void
}

export default function LeadDetailPanel({
  lead,
  onClose,
  onSendWhatsApp,
  onUpdateStatus,
  onDeleteLead,
  onLeadEnriched,
}: LeadDetailPanelProps) {
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [copiedPitch, setCopiedPitch] = useState(false)
  const [activeTab, setActiveTab] = useState<'strategy' | 'audit' | 'overview'>('strategy')
  const [isSending, setIsSending] = useState(false)
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditStep, setAuditStep] = useState('')
  const [customPitch, setCustomPitch] = useState<string | null>(null)
  const [isEditingPitch, setIsEditingPitch] = useState(false)

  // Owner Name State
  const [ownerName, setOwnerName] = useState('')
  const [isEditingOwner, setIsEditingOwner] = useState(false)
  const [isSavingOwner, setIsSavingOwner] = useState(false)

  useEffect(() => {
    if (lead) {
      setOwnerName(lead.owner_name || '')
      setCustomPitch(null)
      setIsEditingPitch(false)
      setIsEditingOwner(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [lead])

  if (!lead) return null

  const audit = lead.website_audits
  const findings = audit?.findings || { flaws: [], strengths: [] }
  const flaws = Array.isArray(findings.flaws) ? findings.flaws : []
  const strengths = Array.isArray(findings.strengths) ? findings.strengths : []

  // Dynamic Strategy Reasoning depending on website existence (High Contrast Palettes)
  const getStrategicWhyPitch = () => {
    const biz = lead.business_name
    const rawCat = lead.campaigns?.niche
    const cat = rawCat && rawCat !== 'Local Business' ? rawCat : null
    const searchTarget = cat ? `"${cat}"` : `businesses like "${biz}" or services nearby`
    const nicheTarget = cat ? `for ${cat}` : 'for modern businesses'

    if (lead.site_state === 'none') {
      return {
        situation: 'NO WEBSITE DETECTED',
        angle: 'Direct Customer Leak to Online Rivals',
        badgeColor: 'bg-amber-100 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-600',
        tagBg: 'bg-amber-500 text-white font-black shadow-xs',
        textColor: 'text-amber-950 dark:text-amber-100',
        whyPitch: `This business has an active Google Maps profile with positive customer reviews, but ZERO website or landing page. When local customers search for ${searchTarget}, they click competitor profiles who provide instant 1-tap WhatsApp booking and pricing menus.`,
        recommendedSolution: `Pitch a 1-page high-converting WhatsApp Booking Microsite + Google Maps profile boost. Easy $300-$500 setup with zero maintenance friction.`,
        defaultHook: `Hey ${ownerName ? ownerName : biz}! Noticed you have great reviews on Google Maps, but don't have a website or booking page linked. Most local clients searching on their phones end up booking competitors with 1-tap WhatsApp booking. We built a fast 1-page WhatsApp booking site ${nicheTarget} that fixes this. Can I share a 30-sec preview?`
      }
    } else if (lead.site_state === 'broken') {
      return {
        situation: 'BROKEN OR UNREACHABLE WEBSITE',
        angle: 'Urgent Brand Damage & Lost Ad/Search Spend',
        badgeColor: 'bg-rose-100 dark:bg-rose-950/70 border-2 border-rose-300 dark:border-rose-600',
        tagBg: 'bg-rose-500 text-white font-black shadow-xs',
        textColor: 'text-rose-950 dark:text-rose-100',
        whyPitch: `Their registered website link is throwing errors (HTTP 4xx/5xx or SSL issue) or fails to load on mobile smartphones. Every customer clicking their profile from Google Maps lands on an error screen, instantly destroying credibility.`,
        recommendedSolution: `Emergency Website Fix + Instant WhatsApp Booking integration. This is an urgent, high-converting pitch because they are actively leaking paying clients right now.`,
        defaultHook: `Hey ${ownerName ? ownerName : biz}! Noticed your business on Google Maps, but when clicking your website link ${lead.website_url}, it seems down / unreachable on mobile. Local clients trying to reach you are getting bounced. We can fix this immediately with a fast mobile booking page. Mind if I send a quick preview?`
      }
    } else {
      return {
        situation: 'ACTIVE WEBSITE — NO WHATSAPP FUNNEL',
        angle: 'Mobile Traffic Drop-off & Slow Booking Friction',
        badgeColor: 'bg-emerald-100 dark:bg-emerald-950/70 border-2 border-emerald-300 dark:border-emerald-600',
        tagBg: 'bg-emerald-600 text-white font-black shadow-xs',
        textColor: 'text-emerald-950 dark:text-emerald-100',
        whyPitch: `They have an active website, but it lacks direct 1-tap WhatsApp chat/appointment integration. Over 70% of local smartphone visitors refuse to fill out slow static contact forms and bounce without converting into an enquiry.`,
        recommendedSolution: `Add an automated 1-Click WhatsApp Booking Funnel & Speed optimization to double their enquiry conversion rate without increasing ad spend.`,
        defaultHook: `Hey ${ownerName ? ownerName : biz}! Impressed by your Google Maps presence! Checked out ${lead.website_url}—clean site, but noticed it lacks a 1-tap WhatsApp booking flow for mobile visitors. Most smartphone clients bounce if they can't message instantly. We built an automated WhatsApp booking engine ${nicheTarget} that 2x's enquiries. Open to a 30-sec demo?`
      }
    }
  }

  const strategy = getStrategicWhyPitch()
  const currentPitch = customPitch ?? (audit?.ai_pitch || strategy.defaultHook)

  // Direct Google Maps Link
  const googleMapsUrl =
    lead.google_maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      lead.business_name + ' ' + (lead.address || '')
    )}`

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(lead.phone)
    setCopiedPhone(true)
    setTimeout(() => setCopiedPhone(false), 2000)
  }

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(currentPitch)
    setCopiedPitch(true)
    setTimeout(() => setCopiedPitch(false), 2000)
  }

  const handleSendClick = () => {
    setIsSending(true)
    setTimeout(() => {
      setIsSending(false)
      onSendWhatsApp({
        ...lead,
        owner_name: ownerName,
        pitch_angle: currentPitch
      })
    }, 400)
  }

  // Open native WhatsApp Web / App
  const handleOpenWhatsAppWeb = () => {
    const cleanPhone = lead.phone.replace(/[^\d]/g, '')
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(currentPitch)}`
    window.open(url, '_blank')
    onUpdateStatus(lead.id, 'sent')
  }

  // Save Owner / Director Name
  const handleSaveOwner = async () => {
    setIsSavingOwner(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lead.id, notes: lead.notes })
      })
      setIsEditingOwner(false)
      if (onLeadEnriched) {
        onLeadEnriched({ ...lead, owner_name: ownerName })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSavingOwner(false)
    }
  }

  // Run Firecrawl + Gemini AI Audit live
  const handleRunAudit = async () => {
    setIsAuditing(true)
    setAuditStep('Scanning website with Firecrawl...')

    try {
      setTimeout(() => {
        setAuditStep('Analyzing with Gemini 3.8 Flash & writing pitch...')
      }, 1500)

      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          websiteUrl: lead.website_url,
          businessName: lead.business_name,
          category: lead.campaigns?.niche
        })
      })

      const data = await res.json()
      if (res.ok && data.audit) {
        const updatedLead: Lead = {
          ...lead,
          site_state: data.siteState || lead.site_state,
          score: data.audit.opportunity_score,
          website_audits: data.audit,
        }
        if (onLeadEnriched) onLeadEnriched(updatedLead)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsAuditing(false)
      setAuditStep('')
    }
  }

  const getWebsiteBadge = (state: SiteState, hasUrl?: boolean) => {
    if (!hasUrl) {
      return { label: 'No Website', bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700', icon: Globe }
    }
    switch (state) {
      case 'exists':
        return { label: 'Active Website', bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700', icon: ShieldCheck }
      case 'broken':
        return { label: 'Broken Link ⚠️', bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700', icon: AlertTriangle }
      case 'none':
        return { label: 'No Website', bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700', icon: Globe }
      default:
        return { label: 'Website Link', bg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700', icon: Globe }
    }
  }

  const hasWebsiteUrl = Boolean(lead.website_url && lead.website_url.trim() !== '')
  const webBadge = getWebsiteBadge(lead.site_state, hasWebsiteUrl)
  const WebIcon = webBadge.icon
  const score = lead.score ?? 78

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fade-in" role="dialog" aria-modal="true">
      {/* High-Focus Dark Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Rock-Solid Fixed Height Modal Box (Single Internal Scrollbar, NEVER Cut Off) */}
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[850px] bg-white dark:bg-[#161B22] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-stone-800 flex flex-col overflow-hidden z-10">
        
        {/* Sleek, Compact Modal Header (Fixed at top, never clipped) */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-stone-800 bg-slate-50/95 dark:bg-[#1C2128] flex items-center justify-between gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            {/* Top Micro-Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${webBadge.bg}`}>
                <WebIcon size={12} />
                {webBadge.label}
              </span>

              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                score >= 80
                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700'
                  : 'bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 border-slate-300'
              }`}>
                Score: {score}/100
              </span>

              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase bg-slate-200 dark:bg-stone-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-stone-700 font-bold">
                {lead.status}
              </span>

              {lead.campaigns?.name && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800 font-bold truncate max-w-[180px]">
                  {lead.campaigns.name}
                </span>
              )}
            </div>

            {/* Business Title, Rating & Quick Phone */}
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[320px] sm:max-w-md">
                {lead.business_name}
              </h2>
              {lead.google_rating && (
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                  ★ {lead.google_rating}
                </span>
              )}
              {/* Phone Quick Pill */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-mono font-bold shrink-0">
                <Phone size={11} className="text-emerald-600" />
                <span>{lead.phone}</span>
                <button
                  onClick={handleCopyPhone}
                  className="ml-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                >
                  {copiedPhone ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Prominent High-Contrast Close Button */}
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-800 border border-slate-300 dark:border-stone-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all cursor-pointer shadow-sm shrink-0"
            aria-label="Close dialog"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Outreach Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-stone-800 flex flex-wrap items-center gap-2 sm:gap-2.5 bg-white dark:bg-[#161B22] shrink-0">
          <button
            onClick={handleSendClick}
            disabled={isSending || lead.status === 'won'}
            className="btn btn-primary py-2.5 px-4 sm:px-5 text-xs font-bold gap-2 rounded-xl shadow-md shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={15} />
            )}
            Send AI WhatsApp Pitch
          </button>

          <button
            onClick={handleOpenWhatsAppWeb}
            title="Open in WhatsApp Web"
            className="btn bg-[#25D366] hover:bg-[#1ea952] text-white py-2.5 px-3.5 sm:px-4 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <MessageSquare size={15} />
            Open in WA Web
          </button>

          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="btn btn-secondary py-2.5 px-3.5 sm:px-4 text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer text-indigo-700 dark:text-indigo-300"
          >
            <Sparkles size={15} className={isAuditing ? 'animate-spin text-purple-600' : 'text-indigo-600'} />
            {isAuditing ? 'Auditing Web Flaws...' : (audit ? 'Re-Audit AI' : 'Run Live AI Audit')}
          </button>

          {lead.status !== 'won' && (
            <button
              onClick={() => onUpdateStatus(lead.id, 'won')}
              className="btn btn-secondary px-3.5 sm:px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 rounded-xl cursor-pointer"
            >
              <PartyPopper size={15} className="mr-1 text-emerald-600" />
              Mark as Won Client
            </button>
          )}

          {onDeleteLead && (
            <button
              onClick={() => {
                if (confirm('Delete this lead from pipeline?')) onDeleteLead(lead.id)
              }}
              className="btn btn-secondary px-3 py-2.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl ml-auto cursor-pointer"
              title="Delete lead"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {/* Audit Status Bar if running */}
        {isAuditing && (
          <div className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 border-b border-indigo-200 text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 animate-fade-in shrink-0">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>{auditStep}</span>
          </div>
        )}

        {/* Navigation Tabs (Clear, Bold, Crisp, Responsive) */}
        <div className="flex px-4 sm:px-6 pt-2 sm:pt-3 border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-[#1C2128] gap-1 sm:gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('strategy')}
            className={`pb-3 px-3 sm:px-4 text-xs font-black rounded-t-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'strategy'
                ? 'text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white dark:bg-[#161B22]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <HelpCircle size={14} />
              1. Why Pitch This Business? (Strategy)
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 sm:px-4 text-xs font-black rounded-t-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'audit'
                ? 'text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white dark:bg-[#161B22]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <Sparkles size={14} />
              2. Website Flaws & Bottlenecks
            </span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 sm:px-4 text-xs font-black rounded-t-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white dark:bg-[#161B22]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <FileText size={14} />
              3. Owner Name & Full Dossier
            </span>
          </button>
        </div>

        {/* Tab Content Area (Scrollable, High Contrast, ONE single scrollbar) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 bg-white dark:bg-[#161B22] space-y-4 sm:space-y-5">
          {/* Quick Info Bar: Full Address & Direct Links */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-2.5 flex-1 min-w-[240px]">
              <MapPin size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
                  Location Address
                </span>
                {lead.address || 'Address not listed on Google profile'}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs"
              >
                <Compass size={13} /> Maps <ExternalLink size={11} />
              </a>

              {lead.website_url ? (
                <a
                  href={lead.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs"
                >
                  <Globe size={13} /> Website <ExternalLink size={11} />
                </a>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-stone-700 text-xs font-semibold">
                  No Website
                </span>
              )}
            </div>
          </div>

          {/* TAB 1: WHY PITCH THIS BUSINESS (Deep Strategy Breakdown) */}
          {activeTab === 'strategy' && (
            <div className="space-y-5 animate-fade-in">
              {/* Situation Banner (Tinted Pastel with Deep Charcoal Text) */}
              <div className={`p-6 rounded-3xl ${strategy.badgeColor} space-y-3 shadow-xs`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`text-xs uppercase tracking-widest px-3 py-1 rounded-full ${strategy.tagBg}`}>
                    {strategy.situation}
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Outreach Angle: <strong>{strategy.angle}</strong>
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white pt-1">
                  Why Should You Pitch Them Right Now?
                </h3>
                {/* High Contrast Body Paragraph */}
                <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                  {strategy.whyPitch}
                </p>
              </div>

              {/* Recommended Solution Strategy Box */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-stone-900 border-2 border-slate-200 dark:border-stone-700 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
                  Recommended Offer & Strategy
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {strategy.recommendedSolution}
                </p>
              </div>

              {/* Strategic WhatsApp Hook Box */}
              <div className="p-6 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                    <Sparkles size={16} />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                      Ready-to-Send WhatsApp Outreach Message
                    </h3>
                  </div>
                  <button
                    onClick={handleCopyPitch}
                    className="p-1.5 rounded-xl bg-white dark:bg-stone-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    {copiedPitch ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedPitch ? 'Copied' : 'Copy Hook'}</span>
                  </button>
                </div>

                {isEditingPitch ? (
                  <div className="space-y-2">
                    <textarea
                      value={currentPitch}
                      onChange={(e) => setCustomPitch(e.target.value)}
                      rows={5}
                      className="w-full text-xs sm:text-sm p-4 rounded-2xl bg-white dark:bg-stone-900 border-2 border-indigo-300 dark:border-indigo-600 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingPitch(false)}
                        className="btn btn-sm btn-primary rounded-xl text-xs font-bold"
                      >
                        Save Hook Text
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-slate-950 dark:text-white bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 leading-relaxed relative group font-medium shadow-xs">
                    <p className="whitespace-pre-wrap">{currentPitch}</p>
                    <button
                      onClick={() => setIsEditingPitch(true)}
                      className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-stone-800 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AI AUDIT & FLAWS */}
          {activeTab === 'audit' && (
            <div className="space-y-6 animate-fade-in">
              {audit ? (
                <>
                  {/* Flaws Identified */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-black text-rose-700 dark:text-rose-400">
                      <AlertTriangle size={16} />
                      <span>Identified Website Flaws & Conversion Leaks ({flaws.length})</span>
                    </div>

                    {flaws.length === 0 ? (
                      <p className="text-xs text-slate-500">No major technical flaws flagged by crawler.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {flaws.map((flaw: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-800 text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-100 leading-relaxed flex items-start gap-3"
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                            <span>{flaw}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Strengths */}
                  <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-stone-800">
                    <div className="flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 size={16} />
                      <span>Existing Website Strengths ({strengths.length})</span>
                    </div>

                    {strengths.length === 0 ? (
                      <p className="text-xs text-slate-500">Standard business website structure.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {strengths.map((str: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-100 leading-relaxed flex items-start gap-3"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                            <span>{str}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 space-y-4 max-w-md mx-auto">
                  <Sparkles size={36} className="mx-auto text-indigo-600" />
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Live Firecrawl & Gemini Audit
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Scan their website code, mobile responsiveness, and appointment friction with Firecrawl, then generate a personalized WhatsApp conversion pitch via Gemini 3.8 Flash.
                  </p>
                  <button
                    onClick={handleRunAudit}
                    disabled={isAuditing}
                    className="btn btn-primary rounded-xl text-xs font-bold px-6 py-3"
                  >
                    Run Live AI Audit Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OWNER & DOSSIER */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Owner / Decision Maker Box */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-stone-900 border-2 border-slate-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-indigo-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Decision Maker / Owner Name
                    </h3>
                  </div>
                  {!isEditingOwner && (
                    <button
                      onClick={() => setIsEditingOwner(true)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  )}
                </div>

                {isEditingOwner ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Dr. Aryan Sharma (Clinic Director)"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="form-input text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={handleSaveOwner}
                      disabled={isSavingOwner}
                      className="btn btn-sm btn-primary rounded-xl shrink-0 text-xs font-bold"
                    >
                      <Save size={13} /> Save Name
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {ownerName || 'Owner name not logged yet (Click edit to add)'}
                  </p>
                )}
              </div>

              {/* Direct Coordinates */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-stone-900 border-2 border-slate-200 dark:border-stone-700 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Direct Contact Coordinates
                </h3>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700">
                    <div className="flex items-center gap-2">
                      <Phone size={15} className="text-emerald-600 shrink-0" />
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{lead.phone}</span>
                    </div>
                    <button
                      onClick={handleCopyPhone}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {copiedPhone ? 'Copied!' : 'Copy Phone'}
                    </button>
                  </div>

                  {lead.website_url && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700">
                      <div className="flex items-center gap-2 truncate">
                        <Globe size={15} className="text-indigo-600 shrink-0" />
                        <span className="truncate font-bold text-indigo-600 dark:text-indigo-400">{lead.website_url}</span>
                      </div>
                      <a
                        href={lead.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-indigo-600 hover:underline shrink-0 ml-2"
                      >
                        Visit Link
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
