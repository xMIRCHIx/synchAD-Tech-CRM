'use client'

import React, { useEffect, useState, useMemo } from 'react'
import type { Lead, LeadStatus, SiteState, Campaign } from '@/lib/types'
import LeadDetailPanel from '@/components/LeadDetailPanel'
import LeadsListModal from '@/components/LeadsListModal'
import CreateCustomLeadModal from '@/components/CreateCustomLeadModal'
import ImportLeadsModal from '@/components/ImportLeadsModal'
import ExportLeadsModal from '@/components/ExportLeadsModal'
import Toast, { ToastMessage } from '@/components/Toast'
import { useData } from '@/context/DataContext'
import {
  Search, RefreshCw, Filter, ShieldCheck, AlertTriangle,
  Globe, Flame, Send, CheckCircle2, Phone, Database, User, Trash2,
  ExternalLink, Compass, ArrowUpDown, Target, MapPin, Sparkles, TrendingUp, Eye, ArrowRight,
  UserPlus, UploadCloud, Download
} from 'lucide-react'

const PIPELINE_STATUSES: { key: LeadStatus | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'All Leads', color: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300' },
  { key: 'review', label: 'Review', color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300' },
  { key: 'queued', label: 'Queued', color: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border border-indigo-300' },
  { key: 'sent', label: 'Sent', color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-300' },
  { key: 'replied', label: 'Replied', color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300' },
  { key: 'won', label: 'Won', color: 'bg-teal-100 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 border border-teal-300' },
  { key: 'not_responded', label: 'Not Responded', color: 'bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 border border-orange-300' },
  { key: 'rejected', label: 'Rejected', color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-300' },
]

export default function LeadsDashboard() {
  const {
    leads,
    campaigns,
    initialLoading,
    isRefreshing,
    refreshAll,
    updateLeadStatus,
    deleteLead,
    setLeads,
  } = useData()

  const loading = initialLoading && leads.length === 0

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [siteFilter, setSiteFilter] = useState<SiteState | 'all'>('all')
  const [campaignFilter, setCampaignFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'custom' | 'campaigns'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alpha-asc' | 'alpha-desc' | 'score' | 'rating'>('newest')

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [modalFilter, setModalFilter] = useState<'all' | 'review' | 'won' | 'broken' | 'active'>('all')
  const [modalTitle, setModalTitle] = useState('All Pipeline Leads')
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Custom Leads & File I/O Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  async function handleUpdateStatus(id: string, newStatus: LeadStatus) {
    try {
      const ok = await updateLeadStatus(id, newStatus)
      if (ok) {
        if (selectedLead?.id === id) {
          setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null))
          if (newStatus === 'won') {
            setTimeout(() => setSelectedLead(null), 800)
          }
        }
        setToast({
          id: String(Date.now()),
          title: 'Status Updated',
          description: `Lead moved to "${newStatus}".`,
          type: 'success',
        })
      }
    } catch (err) {
      console.error('Failed to update lead:', err)
    }
  }

  async function handleDeleteLead(id: string) {
    try {
      const ok = await deleteLead(id)
      if (ok) {
        if (selectedLead?.id === id) setSelectedLead(null)
        setToast({
          id: String(Date.now()),
          title: 'Lead Deleted',
          description: `Lead permanently removed.`,
          type: 'success',
        })
      }
    } catch (err) {
      console.error('Failed to delete lead:', err)
    }
  }

  async function handleSendWhatsApp(lead: Lead) {
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: lead.phone,
          pitchText: lead.pitch_angle || lead.website_audits?.ai_pitch,
          leadId: lead.id
        })
      })
      if (res.ok) {
        handleUpdateStatus(lead.id, 'sent')
        setToast({
          id: String(Date.now()),
          title: 'WhatsApp Pitch Sent',
          description: `Dispatched to ${lead.business_name} (${lead.phone}).`,
          type: 'success',
        })
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  const isCustomLead = (l: Lead) => {
    return !l.campaign_id || Boolean(
      l.notes && (
        l.notes.toLowerCase().includes('custom') ||
        l.notes.toLowerCase().includes('imported') ||
        l.notes.toLowerCase().includes('manual')
      )
    )
  }

  const customLeadsCount = useMemo(() => {
    return leads.filter(isCustomLead).length
  }, [leads])

  // Filtered & Sorted Leads
  const processedLeads = useMemo(() => {
    let result = leads.filter((l) => {
      if (l.status === 'won') return false

      const q = search.toLowerCase()
      const matchesSearch =
        l.business_name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.address && l.address.toLowerCase().includes(q)) ||
        (l.campaigns?.name && l.campaigns.name.toLowerCase().includes(q))

      const matchesStatus = statusFilter === 'all' || l.status === statusFilter
      const matchesSite = siteFilter === 'all' || l.site_state === siteFilter
      const matchesCampaign = campaignFilter === 'all' || l.campaign_id === campaignFilter

      const isCustom = isCustomLead(l)
      const matchesSource =
        sourceFilter === 'all' ||
        (sourceFilter === 'custom' && isCustom) ||
        (sourceFilter === 'campaigns' && !isCustom)

      return matchesSearch && matchesStatus && matchesSite && matchesCampaign && matchesSource
    })

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortBy === 'alpha-asc') {
        return (a.business_name || '').localeCompare(b.business_name || '')
      } else if (sortBy === 'alpha-desc') {
        return (b.business_name || '').localeCompare(a.business_name || '')
      } else if (sortBy === 'score') {
        return (b.score ?? 70) - (a.score ?? 70)
      } else if (sortBy === 'rating') {
        return (b.google_rating ?? 0) - (a.google_rating ?? 0)
      }
      return 0
    })

    return result
  }, [leads, search, statusFilter, siteFilter, campaignFilter, sourceFilter, sortBy])

  const statusCounts = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const brokenCount = leads.filter((l) => l.site_state === 'broken').length

  const getWebsiteBadge = (state: SiteState) => {
    switch (state) {
      case 'exists':
        return { label: 'Active Site', classes: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-black', icon: ShieldCheck }
      case 'broken':
        return { label: 'Broken Site', classes: 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700 font-black', icon: AlertTriangle }
      case 'none':
        return { label: 'No Website', classes: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-black', icon: Globe }
      default:
        return { label: 'Unverified', classes: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 font-bold', icon: Globe }
    }
  }

  const openPopupExplorer = (filter: 'all' | 'review' | 'won' | 'broken' | 'active', title: string) => {
    setModalFilter(filter)
    setModalTitle(title)
    setIsListModalOpen(true)
  }

  return (
    <>
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* KPI Explorer Popup Modal */}
      <LeadsListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        leads={leads}
        initialFilter={modalFilter}
        title={modalTitle}
        onSelectLead={(lead) => setSelectedLead(lead)}
      />

      {/* Large Centered Lead Detail Popup */}
      <LeadDetailPanel
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onSendWhatsApp={handleSendWhatsApp}
        onUpdateStatus={handleUpdateStatus}
        onDeleteLead={handleDeleteLead}
        onLeadEnriched={(enriched) => {
          setLeads(prev => prev.map(l => l.id === enriched.id ? enriched : l))
          setSelectedLead(enriched)
        }}
      />

      <div className="p-5 md:p-8 max-w-[1440px] mx-auto space-y-7 animate-fade-in pb-24">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Leads Pipeline
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {leads.length} Total Leads
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">
              Filter by campaign, sort by latest, inspect business dossiers in full popup, and launch WhatsApp outreach.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <UserPlus size={14} /> Add Custom Lead
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="btn btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UploadCloud size={14} className="text-indigo-600 dark:text-indigo-400" /> Import CSV / Excel
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="btn btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download size={14} className="text-emerald-600 dark:text-emerald-400" /> Export File
            </button>

            <button
              onClick={() => openPopupExplorer('all', 'All Captured Leads Database')}
              className="btn btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Eye size={14} className="text-indigo-600 dark:text-indigo-400" /> Explorer ({leads.length})
            </button>

            <button
              onClick={() => refreshAll(false)}
              disabled={isRefreshing}
              className="btn btn-secondary px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Sync Supabase"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-indigo-600' : 'text-indigo-600'} />
              Sync
            </button>
          </div>
        </div>

        {/* Clickable Floating KPI Cards (Click to Filter or Open Popup) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Pipeline Stages (Click Card to Filter)
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              ⚡ 1-click filter
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* All Ingested Leads Block */}
            <div
              onClick={() => {
                setStatusFilter('all')
                setSiteFilter('all')
                setCampaignFilter('all')
                setSourceFilter('all')
              }}
              className={`kpi-card kpi-card-indigo cursor-pointer group${statusFilter === 'all' && siteFilter === 'all' && campaignFilter === 'all' && sourceFilter === 'all' ? ' ring-2 ring-indigo-500 shadow-md' : ''}`}
              title="Click to view All Captured Leads"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="kpi-title text-xs font-black uppercase tracking-wider">
                  All Leads
                </span>
                <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                  <Database size={17} />
                </div>
              </div>
              <div className="kpi-value text-3xl sm:text-4xl font-black tracking-tight">
                {leads.length}
              </div>
              <p className="kpi-sub text-xs font-black mt-2 pt-2 border-t border-indigo-300/40 dark:border-indigo-800/50 flex items-center justify-between">
                <span>{sourceFilter === 'all' && statusFilter === 'all' && siteFilter === 'all' ? '✓ Filter Active' : 'Show All Leads'}</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </p>
            </div>

            {/* Custom Leads Block */}
            <div
              onClick={() => {
                setSourceFilter(sourceFilter === 'custom' ? 'all' : 'custom')
                setStatusFilter('all')
                setSiteFilter('all')
                setCampaignFilter('all')
              }}
              className={`kpi-card kpi-card-purple cursor-pointer group${sourceFilter === 'custom' ? ' ring-2 ring-purple-500 shadow-md' : ''}`}
              title="Click to filter Custom & Imported Leads"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="kpi-title text-xs font-black uppercase tracking-wider">
                  Custom Leads
                </span>
                <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                  <UserPlus size={17} />
                </div>
              </div>
              <div className="kpi-value text-3xl sm:text-4xl font-black tracking-tight">
                {customLeadsCount}
              </div>
              <p className="kpi-sub text-xs font-black mt-2 pt-2 border-t border-purple-300/40 dark:border-purple-800/50 flex items-center justify-between">
                <span>{sourceFilter === 'custom' ? '✓ Filter Active' : 'Filter Custom Vault'}</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </p>
            </div>

            {/* Awaiting Pitch */}
            <div
              onClick={() => {
                setStatusFilter(statusFilter === 'review' ? 'all' : 'review')
                setSiteFilter('all')
              }}
              className={`kpi-card kpi-card-amber cursor-pointer group${statusFilter === 'review' ? ' ring-2 ring-amber-500 shadow-md' : ''}`}
              title="Click to filter by Awaiting Pitch"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="kpi-title text-xs font-black uppercase tracking-wider">
                  Awaiting Pitch
                </span>
                <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                  <Sparkles size={17} />
                </div>
              </div>
              <div className="kpi-value text-3xl sm:text-4xl font-black tracking-tight">
                {(statusCounts['review'] || 0) + (statusCounts['new'] || 0)}
              </div>
              <p className="kpi-sub text-xs font-black mt-2 pt-2 border-t border-amber-300/40 dark:border-amber-800/50 flex items-center justify-between">
                <span>{statusFilter === 'review' ? '✓ Filter Active' : 'Filter Review Queue'}</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </p>
            </div>

            {/* Queued */}
            <div
              onClick={() => {
                setStatusFilter(statusFilter === 'queued' ? 'all' : 'queued')
                setSiteFilter('all')
              }}
              className={`kpi-card kpi-card-purple cursor-pointer group${statusFilter === 'queued' ? ' ring-2 ring-purple-500 shadow-md' : ''}`}
              title="Click to filter by Queued for Send"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="kpi-title text-xs font-black uppercase tracking-wider">
                  Queued for Send
                </span>
                <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                  <Send size={17} />
                </div>
              </div>
              <div className="kpi-value text-3xl sm:text-4xl font-black tracking-tight">
                {statusCounts['queued'] || 0}
              </div>
              <p className="kpi-sub text-xs font-black mt-2 pt-2 border-t border-purple-300/40 dark:border-purple-800/50 flex items-center justify-between">
                <span>{statusFilter === 'queued' ? '✓ Filter Active' : 'Filter Approved Drafts'}</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </p>
            </div>

            {/* Broken Sites */}
            <div
              onClick={() => {
                setSiteFilter(siteFilter === 'broken' ? 'all' : 'broken')
                setStatusFilter('all')
              }}
              className={`kpi-card kpi-card-rose cursor-pointer group${siteFilter === 'broken' ? ' ring-2 ring-rose-500 shadow-md' : ''}`}
              title="Click to filter by Broken Sites"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="kpi-title text-xs font-black uppercase tracking-wider">
                  Broken Sites (Urgent)
                </span>
                <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={17} />
                </div>
              </div>
              <div className="kpi-value text-3xl sm:text-4xl font-black tracking-tight">
                {brokenCount}
              </div>
              <p className="kpi-sub text-xs font-black mt-2 pt-2 border-t border-rose-300/40 dark:border-rose-800/50 flex items-center justify-between">
                <span>{siteFilter === 'broken' ? '✓ Filter Active' : 'Filter Broken Web Links'}</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </p>
            </div>

            {/* Won Clients */}
            <div
              onClick={() => openPopupExplorer('won', 'Won Clients Portfolio')}
              className="kpi-card kpi-card-green cursor-pointer group"
              title="Click to view won clients popup"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="kpi-title text-xs font-black uppercase tracking-wider">
                  Won Clients
                </span>
                <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={17} />
                </div>
              </div>
              <div className="kpi-value text-3xl sm:text-4xl font-black tracking-tight">
                {statusCounts['won'] || 0}
              </div>
              <p className="kpi-sub text-xs font-black mt-2 pt-2 border-t border-emerald-300/40 dark:border-emerald-800/50 flex items-center justify-between">
                <span>Open Won Deals Popup</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar (Rounded-2xl with High-Contrast Typography) */}
        <div className="p-4 bg-white dark:bg-[#1E1D1B] rounded-2xl border border-slate-200 dark:border-stone-800 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box (Never Blinding White in Dark Mode) */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search leads, address, phone, or campaign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-[#161B22] border border-slate-200 dark:border-stone-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-stone-500 outline-none focus:bg-white dark:focus:bg-[#1C2128] focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold selection:bg-indigo-500/30 selection:text-indigo-600 dark:selection:text-indigo-300"
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

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-xl text-xs shadow-2xs">
              <ArrowUpDown size={13} className="text-indigo-600 font-bold" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none outline-none text-slate-900 dark:text-white cursor-pointer font-bold text-xs"
              >
                <option value="newest" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Sort: Latest First</option>
                <option value="oldest" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Sort: Oldest First</option>
                <option value="alpha-asc" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Sort: A → Z (Alphabetical)</option>
                <option value="alpha-desc" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Sort: Z → A (Alphabetical)</option>
                <option value="score" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Sort: Highest Score</option>
                <option value="rating" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Sort: Google Rating</option>
              </select>
            </div>

            {/* Source Filter (All Leads vs Custom vs Scraped Campaigns) */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-xl text-xs shadow-2xs">
              <UserPlus size={13} className="text-purple-600 dark:text-purple-400 font-bold" />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="bg-transparent border-none outline-none text-slate-900 dark:text-white cursor-pointer font-bold text-xs"
              >
                <option value="all" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 py-1">
                  All Sources ({leads.length})
                </option>
                <option value="custom" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 py-1">
                  ★ Custom Leads ({customLeadsCount})
                </option>
                <option value="campaigns" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 py-1">
                  📡 Scraped Campaigns ({leads.length - customLeadsCount})
                </option>
              </select>
            </div>

            {/* Campaign Filter Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-xl text-xs shadow-2xs">
              <Target size={13} className="text-indigo-600 font-bold" />
              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-900 dark:text-white cursor-pointer font-bold text-xs max-w-[170px]"
              >
                <option value="all" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">All Campaigns</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Website State Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-xl text-xs shadow-2xs">
              <Globe size={13} className="text-slate-600" />
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value as SiteState | 'all')}
                className="bg-transparent border-none outline-none text-slate-900 dark:text-white cursor-pointer font-bold text-xs"
              >
                <option value="all" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">All Websites</option>
                <option value="exists" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Active Sites</option>
                <option value="broken" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Broken Sites</option>
                <option value="none" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">No Website</option>
              </select>
            </div>

            {/* Stage Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-xl text-xs shadow-2xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
                className="bg-transparent border-none outline-none text-slate-900 dark:text-white cursor-pointer font-bold text-xs"
              >
                {PIPELINE_STATUSES.map((st) => (
                  <option key={st.key} value={st.key} className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">
                    Stage: {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Leads Table Container (Curved Wrapper, High-Contrast Text, Never Cut Off) */}
        <div className="hkb-table-wrapper">
          <div className="hkb-custom-slider">
            <table className="hkb-table min-w-[1040px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 font-black">
                  <th>Business & Rating</th>
                  <th>Origin Campaign</th>
                  <th>Contact Phone</th>
                  <th>Full Location Address</th>
                  <th>Website Status</th>
                  <th>Score</th>
                  <th>CRM Stage</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-xs text-slate-600 font-bold">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-indigo-600" />
                      Loading pipeline leads from Supabase...
                    </td>
                  </tr>
                ) : processedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-xs text-slate-600 font-bold">
                      No leads found matching your criteria. Try resetting filters.
                    </td>
                  </tr>
                ) : (
                  processedLeads.map((lead) => {
                    const webBadge = getWebsiteBadge(lead.site_state)
                    const WebIcon = webBadge.icon
                    const score = lead.score ?? 78

                    const googleMapsUrl =
                      lead.google_maps_url ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        lead.business_name + ' ' + (lead.address || '')
                      )}`

                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="group cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all"
                      >
                        {/* Business Name & Google Rating */}
                        <td>
                          <div className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {lead.business_name}
                          </div>
                          {lead.google_rating && (
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-black mt-0.5 flex items-center gap-1">
                              <span>★ {lead.google_rating}</span>
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">on Google</span>
                            </div>
                          )}
                        </td>

                        {/* Origin Campaign Badge */}
                        <td>
                          {lead.campaigns?.name ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 max-w-[150px] truncate shadow-2xs">
                              {lead.campaigns.name}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold italic">
                              Direct Lead
                            </span>
                          )}
                        </td>

                        {/* Phone (Bigger, Bold, Highly Readable) */}
                        <td className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                              <Phone size={11} />
                            </div>
                            <span className="font-mono text-[13.5px] font-black text-slate-900 dark:text-white tracking-wide">
                              {lead.phone}
                            </span>
                          </div>
                        </td>

                        {/* Full Location Address */}
                        <td className="text-xs text-slate-800 dark:text-slate-200 font-semibold max-w-xs">
                          <div className="flex items-start gap-1.5">
                            <MapPin size={13} className="text-indigo-600 shrink-0 mt-0.5" />
                            <span className="leading-snug">{lead.address || 'Address not listed'}</span>
                          </div>
                        </td>

                        {/* Site Status Pill & Link */}
                        <td className="text-xs">
                          {(() => {
                            const hasUrl = Boolean(lead.website_url && lead.website_url.trim() !== '')
                            const isBroken = lead.site_state === 'broken'
                            const isActive = lead.site_state === 'exists'
                            
                            const badgeInfo = !hasUrl
                              ? {
                                  label: 'No Website',
                                  classes: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700',
                                  Icon: Globe
                                }
                              : isBroken
                              ? {
                                  label: 'Broken Link ⚠️',
                                  classes: 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700',
                                  Icon: AlertTriangle
                                }
                              : isActive
                              ? {
                                  label: 'Active Website',
                                  classes: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
                                  Icon: ShieldCheck
                                }
                              : {
                                  label: 'Website Link',
                                  classes: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
                                  Icon: Globe
                                }

                            const { Icon } = badgeInfo

                            return (
                              <div className="space-y-1 py-0.5">
                                <div>
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-2xs ${badgeInfo.classes}`}>
                                    <Icon size={11} className="shrink-0" />
                                    <span>{badgeInfo.label}</span>
                                  </span>
                                </div>
                                {lead.website_url ? (
                                  <a
                                    href={lead.website_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline inline-flex items-center gap-1 font-bold text-[11px] group/link max-w-[170px] truncate"
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
                            )
                          })()}
                        </td>

                        {/* Score */}
                        <td className="font-mono font-black text-xs text-purple-700 dark:text-purple-400">
                          {score}/100
                        </td>

                        {/* Stage Selector */}
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status === 'skipped' ? 'not_responded' : lead.status === 'lost' ? 'rejected' : lead.status}
                            onChange={(e) => handleUpdateStatus(lead.id, e.target.value as LeadStatus)}
                            className="text-[11px] font-black uppercase px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white outline-none cursor-pointer shadow-2xs"
                          >
                            <option value="review" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Review</option>
                            <option value="queued" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Queued</option>
                            <option value="sent" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Sent</option>
                            <option value="replied" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Replied</option>
                            <option value="won" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Won</option>
                            <option value="not_responded" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Not Responded</option>
                            <option value="rejected" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Rejected</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Open on Google Maps"
                              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              <ExternalLink size={13} />
                            </a>

                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="btn btn-sm btn-primary rounded-xl px-3.5 py-1.5 text-xs font-black gap-1 shadow-xs"
                            >
                              <Send size={11} />
                              Inspect
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-slate-100 dark:border-stone-800 bg-slate-50/80 dark:bg-[#1C2128] flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>↔ Drag / Slide table horizontally to view all details</span>
            <span>{processedLeads.length} leads in view</span>
          </div>
        </div>
      </div>

      {/* Custom Lead Entry Modal */}
      <CreateCustomLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        campaigns={campaigns}
        onSuccess={() => {
          refreshAll(true)
          setToast({
            id: String(Date.now()),
            title: 'Custom Lead Added',
            description: 'Lead was successfully saved into your pipeline.',
            type: 'success',
          })
        }}
      />

      {/* CSV / Excel Import Modal */}
      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        campaigns={campaigns}
        onSuccess={() => {
          refreshAll(true)
          setToast({
            id: String(Date.now()),
            title: 'Leads Imported',
            description: 'Imported records have been saved into your database.',
            type: 'success',
          })
        }}
      />

      {/* CSV / Excel Export Modal */}
      <ExportLeadsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allLeads={leads}
        filteredLeads={processedLeads}
      />
    </>
  )
}
