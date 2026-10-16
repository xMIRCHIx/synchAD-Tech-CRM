'use client'

import React, { useState, useMemo } from 'react'
import type { Lead, LeadStatus, SiteState } from '@/lib/types'
import {
  normalizeLeadStatus,
  getLeadStatusLabel,
  getLeadStatusBadgeStyle
} from '@/lib/statusHelper'
import {
  X, Users, Search, MapPin, Phone, Globe, ShieldCheck,
  AlertTriangle, CheckCircle2, Sparkles, Send, ExternalLink, ArrowRight
} from 'lucide-react'

interface LeadsListModalProps {
  isOpen: boolean
  onClose: () => void
  leads: Lead[]
  initialFilter?: 'all' | 'review' | 'won' | 'broken' | 'active'
  title?: string
  subtitle?: string
  onSelectLead: (lead: Lead) => void
}

export default function LeadsListModal({
  isOpen,
  onClose,
  leads,
  initialFilter = 'all',
  title = 'Ingested Leads Explorer',
  subtitle = 'Full database view of scraped businesses, contact details & conversion status.',
  onSelectLead
}: LeadsListModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'review' | 'won' | 'broken' | 'active'>(initialFilter)
  const [search, setSearch] = useState('')

  // Lock body scroll when modal is open so focus remains 100% on popup
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Update tab when initialFilter changes
  React.useEffect(() => {
    if (initialFilter) setActiveTab(initialFilter)
  }, [initialFilter])

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase()
      const matchesSearch =
        l.business_name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.address && l.address.toLowerCase().includes(q)) ||
        (l.campaigns?.name && l.campaigns.name.toLowerCase().includes(q))

      if (!matchesSearch) return false

      if (activeTab === 'review') return normalizeLeadStatus(l.status) === 'review'
      if (activeTab === 'won') return normalizeLeadStatus(l.status) === 'won'
      if (activeTab === 'broken') return l.site_state === 'broken'
      if (activeTab === 'active') return l.site_state === 'exists'
      return true
    })
  }, [leads, search, activeTab])

  if (!isOpen) return null

  const getSiteBadge = (state: SiteState, hasUrl?: boolean) => {
    if (!hasUrl) {
      return { label: 'No Website', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-700', icon: Globe }
    }
    switch (state) {
      case 'exists':
        return { label: 'Active Website', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700', icon: ShieldCheck }
      case 'broken':
        return { label: 'Broken Link ⚠️', bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300 dark:border-rose-700', icon: AlertTriangle }
      case 'none':
        return { label: 'No Website', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-700', icon: Globe }
      default:
        return { label: 'Website Link', bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700', icon: Globe }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 animate-fade-in" role="dialog" aria-modal="true">
      {/* High-Focus Dark Backdrop (Background completely dimmed and isolated) */}
      <div
        className="fixed inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Large Centered Modal Box (Spacious, Unclipped, High Contrast) */}
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white dark:bg-[#161B22] rounded-3xl shadow-2xl border border-slate-200 dark:border-stone-800 flex flex-col overflow-hidden z-10">
        
        {/* Modal Header */}
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-[#1C2128] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25">
              <Users size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {filteredLeads.length} Leads
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shadow-xs shrink-0"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-stone-800 bg-white dark:bg-[#161B22] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Filter Pills with Vibrant Active State */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'all', label: `All (${leads.length})` },
              { key: 'review', label: `Awaiting Pitch (${leads.filter(l => normalizeLeadStatus(l.status) === 'review').length})` },
              { key: 'won', label: `Won Clients (${leads.filter(l => normalizeLeadStatus(l.status) === 'won').length})` },
              { key: 'broken', label: `Broken Sites (${leads.filter(l => l.site_state === 'broken').length})` },
              { key: 'active', label: `Active Sites (${leads.filter(l => l.site_state === 'exists').length})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/25 ring-1 ring-indigo-400'
                    : 'bg-slate-100 dark:bg-stone-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-stone-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search leads, address, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#161B22] border border-slate-200 dark:border-stone-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-stone-500 outline-none focus:bg-white dark:focus:bg-[#1C2128] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Table View with Guaranteed Min Width */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 dark:bg-[#0D1117]">
          {filteredLeads.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Users size={32} className="mx-auto text-slate-400 opacity-60" />
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">No leads found in this view.</p>
              <p className="text-xs">Try selecting a different filter or clearing your search term.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col">
              <div className="hkb-custom-slider pb-1">
                <table className="w-full text-left text-sm border-collapse min-w-[1040px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-[#1C2128] border-b border-slate-200 dark:border-stone-700 text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wider font-extrabold">
                      <th className="py-3.5 px-4 w-[220px]">Business & Rating</th>
                      <th className="py-3.5 px-4 w-[140px]">Origin Campaign</th>
                      <th className="py-3.5 px-4 w-[165px]">Contact Phone</th>
                      <th className="py-3.5 px-4 w-[250px]">Full Location Address</th>
                      <th className="py-3.5 px-4 w-[125px]">Website Status</th>
                      <th className="py-3.5 px-4 w-[80px]">Score</th>
                      <th className="py-3.5 px-4 w-[130px]">CRM Stage</th>
                      <th className="py-3.5 px-4 w-[140px] text-right">Inspect Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-stone-800 text-xs">
                    {filteredLeads.map((lead) => {
                      const hasUrl = Boolean(lead.website_url && lead.website_url.trim() !== '')
                      const badge = getSiteBadge(lead.site_state, hasUrl)
                      const BadgeIcon = badge.icon
                      const score = lead.score ?? 78

                      return (
                        <tr
                          key={lead.id}
                          onClick={() => {
                            onClose()
                            onSelectLead(lead)
                          }}
                          className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/25 transition-colors cursor-pointer group"
                        >
                          {/* Business Name */}
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            <div className="font-extrabold text-sm">{lead.business_name}</div>
                            {lead.google_rating && (
                              <div className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-md mt-1">
                                ★ {lead.google_rating} on Google
                              </div>
                            )}
                          </td>

                          {/* Origin Campaign */}
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 truncate max-w-[130px]">
                              {lead.campaigns?.name || 'Direct Lead'}
                            </span>
                          </td>

                          {/* Phone (Bigger, Bold, Clear) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400">
                                <Phone size={12} />
                              </div>
                              <span className="font-mono text-[13.5px] font-black text-slate-900 dark:text-white tracking-wide">
                                {lead.phone}
                              </span>
                            </div>
                          </td>

                          {/* Location Address (Unclipped line-clamp-2) */}
                          <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 max-w-[280px]">
                            <div className="flex items-start gap-1.5">
                              <MapPin size={13} className="text-indigo-500 shrink-0 mt-0.5" />
                              <span className="leading-snug line-clamp-2 font-medium" title={lead.address || ''}>
                                {lead.address || 'Address not listed on Google profile'}
                              </span>
                            </div>
                          </td>

                          {/* Website Status & Link */}
                          <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                            <div className="space-y-1 py-0.5">
                              <div>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-2xs ${badge.bg}`}>
                                  <BadgeIcon size={11} className="shrink-0" />
                                  <span>{badge.label}</span>
                                </span>
                              </div>
                              {lead.website_url ? (
                                <a
                                  href={lead.website_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline inline-flex items-center gap-1 font-bold text-[11px] group/link max-w-[160px] truncate"
                                  title={lead.website_url}
                                >
                                  <span className="truncate">{lead.website_url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                  <ExternalLink size={10} className="shrink-0 opacity-70 group-hover/link:opacity-100" />
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 dark:text-stone-500 font-semibold block">
                                  No link listed
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Score */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-block font-mono font-black text-xs px-2 py-0.5 rounded-md border ${
                              score >= 70
                                ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }`}>
                              {score}/100
                            </span>
                          </td>

                          {/* CRM Stage */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${getLeadStatusBadgeStyle(lead.status)}`}>
                              {getLeadStatusLabel(lead.status)}
                            </span>
                          </td>

                          {/* Action Button (NEVER TRUNCATED) */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onClose()
                                onSelectLead(lead)
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <span>Open Details</span>
                              <ArrowRight size={13} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {/* Slider notice */}
              <div className="px-4 py-2 border-t border-slate-100 dark:border-stone-800 bg-slate-50/80 dark:bg-[#1C2128] flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>↔ Drag / Slide table horizontally to inspect all columns</span>
                <span>{filteredLeads.length} leads in view</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-stone-800 bg-white dark:bg-[#161B22] flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Showing {filteredLeads.length} of {leads.length} total captured leads
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  )
}
