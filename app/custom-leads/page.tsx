'use client'

import React, { useState, useMemo, useEffect } from 'react'
import type { Lead, LeadStatus, SiteState } from '@/lib/types'
import { useData } from '@/context/DataContext'
import LeadDetailPanel from '@/components/LeadDetailPanel'
import LeadsListModal from '@/components/LeadsListModal'
import CreateCustomLeadModal from '@/components/CreateCustomLeadModal'
import ImportLeadsModal from '@/components/ImportLeadsModal'
import ExportLeadsModal from '@/components/ExportLeadsModal'
import Toast, { ToastMessage } from '@/components/Toast'
import {
  UserPlus, UploadCloud, Download, Search, RefreshCw,
  Phone, MapPin, Globe, ShieldCheck, AlertTriangle, ExternalLink,
  Send, Sparkles, Database, CheckCircle2, Check, ArrowUpDown, Filter,
  Eye, ArrowRight
} from 'lucide-react'
import {
  normalizeLeadStatus,
  getLeadStatusLabel,
  getLeadStatusBadgeStyle,
  matchesStatusFilter,
  CANONICAL_STATUS_OPTIONS
} from '@/lib/statusHelper'

export default function CustomLeadsPage() {
  const {
    leads,
    campaigns,
    initialLoading,
    isRefreshing,
    refreshAll,
    updateLeadStatus,
    deleteLead,
    setLeads
  } = useData()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [siteFilter, setSiteFilter] = useState<SiteState | 'all'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alpha-asc' | 'alpha-desc' | 'score' | 'rating'>('newest')

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [modalFilter, setModalFilter] = useState<'all' | 'review' | 'won' | 'broken' | 'active'>('all')
  const [modalTitle, setModalTitle] = useState('All Custom Leads')

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const openPopupExplorer = (filter: 'all' | 'review' | 'won' | 'broken' | 'active', title: string) => {
    setModalFilter(filter)
    setModalTitle(title)
    setIsListModalOpen(true)
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Filter only custom / direct leads
  const customLeads = useMemo(() => {
    return leads.filter((l) => {
      const isDirect = !l.campaign_id
      const isCustomNote = l.notes && (
        l.notes.toLowerCase().includes('custom') ||
        l.notes.toLowerCase().includes('imported') ||
        l.notes.toLowerCase().includes('manual')
      )
      return isDirect || isCustomNote
    })
  }, [leads])

  // Filtered & sorted
  const processedLeads = useMemo(() => {
    let result = customLeads.filter((l) => {
      const q = search.toLowerCase()
      const matchesSearch =
        l.business_name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.address && l.address.toLowerCase().includes(q))

      const matchesStatus = matchesStatusFilter(l.status, statusFilter)
      const matchesSite = siteFilter === 'all' || l.site_state === siteFilter

      return matchesSearch && matchesStatus && matchesSite
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
  }, [customLeads, search, statusFilter, siteFilter, sortBy])

  const stats = useMemo(() => {
    const withWeb = customLeads.filter((l) => l.site_state === 'exists' || l.website_url).length
    const brokenWeb = customLeads.filter((l) => l.site_state === 'broken').length
    const won = customLeads.filter((l) => normalizeLeadStatus(l.status) === 'won').length
    return {
      total: customLeads.length,
      withWeb,
      brokenWeb,
      won
    }
  }, [customLeads])

  const handleUpdateStatus = async (id: string, newStatus: LeadStatus) => {
    const ok = await updateLeadStatus(id, newStatus)
    if (ok) {
      const canonical = normalizeLeadStatus(newStatus)
      if (selectedLead?.id === id) {
        setSelectedLead((prev) => (prev ? { ...prev, status: canonical } : null))
      }
      setToast({
        id: Date.now().toString(),
        title: 'Status Updated',
        description: `Lead moved to ${getLeadStatusLabel(canonical, false).toUpperCase()}`,
        type: 'success'
      })
    }
  }

  const handleDeleteLead = async (id: string) => {
    try {
      const ok = await deleteLead(id)
      if (ok) {
        if (selectedLead?.id === id) setSelectedLead(null)
        setToast({
          id: String(Date.now()),
          title: 'Lead Deleted',
          description: 'Custom lead was removed.',
          type: 'success'
        })
      }
    } catch (err) {
      console.error('Failed to delete lead:', err)
    }
  }

  const handleSendWhatsApp = async (lead: Lead) => {
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

  return (
    <>
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* KPI Explorer Popup Modal */}
      <LeadsListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        leads={customLeads}
        initialFilter={modalFilter}
        title={modalTitle}
        onSelectLead={(lead) => setSelectedLead(lead)}
      />

      {/* Large Centered Lead Detail Popup (Direct Child of Fragment, NEVER Clipped) */}
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

      {/* Create Custom Lead Modal */}
      <CreateCustomLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        campaigns={campaigns}
        onSuccess={(msg) => {
          refreshAll(true)
          setToast({
            id: Date.now().toString(),
            title: 'Lead Created',
            description: msg,
            type: 'success'
          })
        }}
      />

      {/* Import Leads Modal */}
      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        campaigns={campaigns}
        onSuccess={(count, msg) => {
          refreshAll(true)
          setToast({
            id: Date.now().toString(),
            title: 'Import Successful',
            description: msg,
            type: 'success'
          })
        }}
      />

      {/* Export Leads Modal */}
      <ExportLeadsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        filteredLeads={processedLeads}
        allLeads={customLeads}
        campaignName="Custom_Leads"
      />

      <div className="space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-24">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Private Vault
              </span>
              <span className="text-xs text-slate-500 font-semibold">Custom & Imported Leads</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <UserPlus className="text-indigo-600" size={28} />
              Custom Leads Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
              Manage your manually added client records, CSV imports & custom outreach prospects.
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => refreshAll(true)}
              disabled={isRefreshing}
              className="btn btn-secondary px-3 py-2 text-xs font-bold rounded-xl gap-1.5 cursor-pointer shadow-xs"
              title="Refresh database"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              onClick={() => openPopupExplorer('all', 'All Custom Leads Explorer')}
              className="btn btn-secondary px-3.5 py-2 text-xs font-bold rounded-xl gap-1.5 cursor-pointer shadow-xs"
              title="Open full database explorer"
            >
              <Eye size={14} className="text-indigo-600 dark:text-indigo-400" />
              Explorer ({customLeads.length})
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="btn btn-secondary px-3.5 py-2 text-xs font-black rounded-xl gap-1.5 cursor-pointer border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 text-indigo-700 dark:text-indigo-300 shadow-xs"
            >
              <UploadCloud size={14} className="text-indigo-600" />
              Import CSV / Excel
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="btn btn-secondary px-3.5 py-2 text-xs font-black rounded-xl gap-1.5 cursor-pointer border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 text-emerald-700 dark:text-emerald-300 shadow-xs"
            >
              <Download size={14} className="text-emerald-600" />
              Export File
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary px-4 py-2 text-xs font-black rounded-xl gap-1.5 shadow-md shadow-indigo-600/25 cursor-pointer"
            >
              <UserPlus size={14} />
              + Add Custom Lead
            </button>
          </div>
        </div>

        {/* KPI Stats Cards (Click to Filter or Open Explorer) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div
            onClick={() => openPopupExplorer('all', 'Total Custom Leads Vault')}
            className="kpi-card kpi-card-indigo cursor-pointer group hover:shadow-md transition-all active:scale-[0.99]"
            title="Click to explore all custom leads"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="kpi-title text-xs font-black uppercase tracking-wider">Total Custom Leads</span>
              <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                <Database size={17} />
              </div>
            </div>
            <div className="kpi-value text-3xl font-black">{stats.total}</div>
            <p className="kpi-sub text-xs font-semibold mt-2 pt-2 border-t border-indigo-300/40 dark:border-indigo-800/50 flex items-center justify-between">
              <span>Privately added / Imported</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </p>
          </div>

          <div
            onClick={() => openPopupExplorer('active', 'Live Websites Custom Leads')}
            className="kpi-card kpi-card-blue cursor-pointer group hover:shadow-md transition-all active:scale-[0.99]"
            title="Click to explore leads with active websites"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="kpi-title text-xs font-black uppercase tracking-wider">Live Websites</span>
              <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                <ShieldCheck size={17} />
              </div>
            </div>
            <div className="kpi-value text-3xl font-black">{stats.withWeb}</div>
            <p className="kpi-sub text-xs font-semibold mt-2 pt-2 border-t border-blue-300/40 dark:border-blue-800/50 flex items-center justify-between">
              <span>Has website URL</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </p>
          </div>

          <div
            onClick={() => openPopupExplorer('broken', 'Broken / Dead Website Leads')}
            className="kpi-card kpi-card-rose cursor-pointer group hover:shadow-md transition-all active:scale-[0.99]"
            title="Click to explore high-conversion broken site leads"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="kpi-title text-xs font-black uppercase tracking-wider">Broken / Dead Sites</span>
              <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                <AlertTriangle size={17} />
              </div>
            </div>
            <div className="kpi-value text-3xl font-black">{stats.brokenWeb}</div>
            <p className="kpi-sub text-xs font-semibold mt-2 pt-2 border-t border-rose-300/40 dark:border-rose-800/50 flex items-center justify-between">
              <span>High conversion angle</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </p>
          </div>

          <div
            onClick={() => openPopupExplorer('won', 'Won Closed Clients')}
            className="kpi-card kpi-card-green cursor-pointer group hover:shadow-md transition-all active:scale-[0.99]"
            title="Click to explore won client accounts"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="kpi-title text-xs font-black uppercase tracking-wider">Won Clients</span>
              <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={17} />
              </div>
            </div>
            <div className="kpi-value text-3xl font-black">{stats.won}</div>
            <p className="kpi-sub text-xs font-semibold mt-2 pt-2 border-t border-emerald-300/40 dark:border-emerald-800/50 flex items-center justify-between">
              <span>Successfully closed</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </p>
          </div>
        </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-[#161B22] rounded-2xl border border-slate-200 dark:border-stone-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search custom leads by name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-xl font-medium outline-none focus:bg-white dark:focus:bg-stone-800 focus:border-indigo-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-xl text-xs font-bold shadow-2xs">
            <ArrowUpDown size={12} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none outline-none text-slate-900 dark:text-white cursor-pointer font-bold text-xs"
            >
              <option value="newest" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Sort: Latest Added</option>
              <option value="oldest" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Sort: Oldest Added</option>
              <option value="alpha-asc" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Sort: A → Z</option>
              <option value="alpha-desc" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Sort: Z → A</option>
              <option value="score" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Sort: Highest Score</option>
              <option value="rating" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Sort: Google Rating</option>
            </select>
          </div>

          {/* Website Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-xl text-xs font-bold shadow-2xs">
            <Globe size={12} className="text-slate-400" />
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value as any)}
              className="bg-transparent border-none outline-none text-slate-900 dark:text-white cursor-pointer font-bold text-xs"
            >
              <option value="all" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">All Websites</option>
              <option value="exists" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Active Websites</option>
              <option value="broken" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Broken Links</option>
              <option value="none" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">No Website</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-xl text-xs font-bold shadow-2xs">
            <Filter size={12} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent border-none outline-none text-slate-900 dark:text-white cursor-pointer font-bold text-xs"
            >
              <option value="all" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">All Stages</option>
              <option value="review" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Review</option>
              <option value="queued" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Queued</option>
              <option value="sent" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Sent</option>
              <option value="replied" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Replied</option>
              <option value="won" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100">Won</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="hkb-table-wrapper">
        <div className="p-4 border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-800/60 flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus size={16} className="text-indigo-600" />
            Custom Leads ({processedLeads.length}{processedLeads.length !== customLeads.length ? ` of ${customLeads.length}` : ''})
          </h3>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Click any row to open detail dossier
          </span>
        </div>

        <div className="hkb-custom-slider">
          <table className="hkb-table min-w-[980px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 font-black">
                <th>Business & Google Rating</th>
                <th>Contact Phone</th>
                <th>Full Location Address</th>
                <th>Website Status</th>
                <th>Score</th>
                <th>CRM Stage</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialLoading && customLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-xs text-slate-600 font-bold">
                    <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading custom leads...
                  </td>
                </tr>
              ) : processedLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-xs text-slate-600 font-bold space-y-3">
                    <p className="font-black text-sm text-slate-900 dark:text-white">
                      {customLeads.length === 0 ? 'No custom leads added yet.' : 'No custom leads match your filters.'}
                    </p>
                    {customLeads.length === 0 ? (
                      <div className="flex justify-center gap-2 pt-2">
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="btn btn-primary px-3.5 py-1.5 text-xs rounded-xl font-bold gap-1 cursor-pointer"
                        >
                          <UserPlus size={13} /> + Add Your First Custom Lead
                        </button>
                        <button
                          onClick={() => setIsImportModalOpen(true)}
                          className="btn btn-secondary px-3.5 py-1.5 text-xs rounded-xl font-bold gap-1 cursor-pointer"
                        >
                          <UploadCloud size={13} /> Import CSV / Excel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSearch('')
                          setStatusFilter('all')
                          setSiteFilter('all')
                          setSortBy('newest')
                        }}
                        className="btn btn-secondary px-3 py-1.5 text-xs rounded-xl cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                processedLeads.map((lead) => {
                  const googleMapUrl =
                    lead.google_maps_url ||
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      lead.business_name + ' ' + (lead.address || '')
                    )}`

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
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer group"
                    >
                      {/* Business Name */}
                      <td>
                        <div className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {lead.business_name}
                        </div>
                        {lead.google_rating && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-black mt-0.5">
                            ★ {lead.google_rating} on Google
                          </div>
                        )}
                      </td>

                      {/* Phone */}
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

                      {/* Location */}
                      <td className="text-xs text-slate-800 dark:text-slate-200 font-semibold max-w-xs">
                        <div className="flex items-start gap-1.5">
                          <MapPin size={13} className="text-indigo-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{lead.address || 'Address not listed'}</span>
                        </div>
                      </td>

                      {/* Website Status & Link */}
                      <td className="text-xs">
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
                      </td>

                      {/* Score */}
                      <td>
                        <span className="font-mono text-xs font-black text-purple-700 dark:text-purple-400">
                          {lead.score ?? 78}/100
                        </span>
                      </td>

                      {/* Stage Selector */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-flex items-center">
                          <select
                            value={normalizeLeadStatus(lead.status)}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleUpdateStatus(lead.id, e.target.value as LeadStatus)
                            }}
                            className={`text-[10px] font-black uppercase pl-2.5 pr-6 py-1 rounded-lg border outline-none cursor-pointer appearance-none shadow-2xs transition-all ${getLeadStatusBadgeStyle(lead.status)}`}
                            title="Click to change lead status directly"
                          >
                            {CANONICAL_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[8px] opacity-60">
                            ▼
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={googleMapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Open on Google Maps"
                          >
                            <ExternalLink size={13} />
                          </a>

                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="btn btn-sm btn-primary rounded-xl px-3.5 py-1.5 text-xs font-black gap-1 shadow-xs cursor-pointer"
                          >
                            <Send size={11} />
                            Inspect & Pitch
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
      </div>

      </div>
    </>
  )
}
