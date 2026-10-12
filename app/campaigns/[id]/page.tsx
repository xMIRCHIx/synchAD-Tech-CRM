'use client'

import React, { Suspense, useEffect, useState, use } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Target, Users, Play, Pause, Zap, Edit3, Trash2,
  CheckCircle2, Globe, ExternalLink, RefreshCw, Send, MapPin, Sparkles, TrendingUp, Eye, ArrowRight, Phone, Check,
  Search, ArrowUpDown, Filter, X, ShieldCheck, AlertTriangle
} from 'lucide-react'
import Toast, { ToastMessage } from '@/components/Toast'
import LeadDetailPanel from '@/components/LeadDetailPanel'
import LeadsListModal from '@/components/LeadsListModal'
import type { Lead, LeadStatus, SiteState, Campaign } from '@/lib/types'

function parseNiche(rawNiche?: string | null) {
  if (!rawNiche) return { cleanNiche: '', websiteTypes: ['none', 'broken'] }
  const match = rawNiche.match(/\[sites:([^\]]+)\]/)
  const cleanNiche = rawNiche.replace(/\[sites:[^\]]+\]/g, '').trim()
  if (!match) return { cleanNiche, websiteTypes: ['none', 'broken', 'exists'] }
  const types = match[1].split(',').filter(Boolean)
  return { cleanNiche, websiteTypes: types }
}

function getStatusBadgeStyle(status: LeadStatus) {
  switch (status) {
    case 'won':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
    case 'replied':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-700'
    case 'sent':
    case 'delivered':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700'
    case 'queued':
      return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-700'
    case 'review':
    case 'new':
      return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700'
    case 'lost':
    case 'skipped':
      return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
  }
}


function CampaignDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const campaignId = resolvedParams.id
  const router = useRouter()
  const searchParams = useSearchParams()
  const shouldBgScrape = searchParams?.get('bgScrape') === 'true'
  const hasTriggeredBgScrape = React.useRef(false)

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [modalFilter, setModalFilter] = useState<'all' | 'review' | 'won' | 'broken' | 'active'>('all')
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [isScraping, setIsScraping] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Search, Sort & Filters for Leads
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alpha-asc' | 'alpha-desc' | 'score' | 'rating'>('newest')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [siteFilter, setSiteFilter] = useState<SiteState | 'all'>('all')

  // Edit & Republish modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    search_query: '',
    location: '',
    niche: '',
    max_leads: 10,
    republishAndScrape: false
  })
  const [editWebsiteTypes, setEditWebsiteTypes] = useState<string[]>(['none', 'broken'])
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    fetchCampaignAndLeads()
  }, [campaignId])

  // Trigger background scrape if navigated from campaign creation wizard
  useEffect(() => {
    if (shouldBgScrape && campaign && !hasTriggeredBgScrape.current) {
      hasTriggeredBgScrape.current = true
      handleScrapeMore()
    }
  }, [shouldBgScrape, campaign])

  // Poll leads periodically while scraping is active so user sees live lead collection
  useEffect(() => {
    if (!campaign) return
    const maxLeads = campaign.max_leads || 10
    if (isScraping && leads.length < maxLeads) {
      const interval = setInterval(() => {
        fetchCampaignAndLeads(true)
      }, 3500)
      return () => clearInterval(interval)
    }
  }, [isScraping, leads.length, campaign])

  async function fetchCampaignAndLeads(silent = false) {
    if (!silent) setLoading(true)
    try {
      // 1. Fetch campaigns
      const cRes = await fetch('/api/campaigns')
      const cData = await cRes.json()
      const foundCampaign = (cData.campaigns || []).find((c: any) => c.id === campaignId)
      if (foundCampaign) {
        setCampaign(foundCampaign)
        const { cleanNiche, websiteTypes } = parseNiche(foundCampaign.niche)
        setEditForm({
          name: foundCampaign.name,
          search_query: foundCampaign.search_query,
          location: foundCampaign.location,
          niche: cleanNiche,
          max_leads: foundCampaign.max_leads || 25,
          republishAndScrape: false
        })
        setEditWebsiteTypes(websiteTypes)
      }

      // 2. Fetch leads for this campaign
      const lRes = await fetch('/api/leads')
      const lData = await lRes.json()
      if (lData.leads) {
        const campaignLeads = lData.leads.filter((l: Lead) => l.campaign_id === campaignId)
        setLeads(campaignLeads)
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  function handleToggleWebsiteType(type: string) {
    setEditWebsiteTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev
        return prev.filter(t => t !== type)
      } else {
        return [...prev, type]
      }
    })
  }

  // Instant Scrape More Leads
  async function handleScrapeMore() {
    if (!campaign) return
    setIsScraping(true)
    try {
      const res = await fetch('/api/campaigns/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id })
      })
      const data = await res.json()
      if (res.ok) {
        await fetchCampaignAndLeads()
        if (data.isFull || data.leadsImported === 0) {
          setToast({
            id: Date.now().toString(),
            title: 'Goal Already Met',
            description: `Campaign already has all ${data.maxLeads || campaign.max_leads} required leads.`,
            type: 'info'
          })
        } else {
          setToast({
            id: Date.now().toString(),
            title: 'Scrape Complete!',
            description: `Added ${data.leadsImported} verified leads. Total: ${data.totalLeads}/${data.maxLeads} leads.`,
            type: 'success'
          })
        }
      } else {
        throw new Error(data.error || 'Failed to scrape')
      }
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        title: 'Scrape Failed',
        description: err.message,
        type: 'error'
      })
    } finally {
      setIsScraping(false)
    }
  }

  // Toggle active/paused
  async function handleToggleStatus() {
    if (!campaign) return
    const nextStatus = campaign.status === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campaign.id, status: nextStatus })
      })
      if (res.ok) {
        setCampaign({ ...campaign, status: nextStatus })
        setToast({
          id: Date.now().toString(),
          title: `Campaign ${nextStatus === 'active' ? 'Active' : 'Paused'}`,
          description: `Outreach status updated.`,
          type: 'success'
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Edit & Republish Campaign
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!campaign) return
    setIsSavingEdit(true)

    try {
      // 1. Update Campaign details
      const patchRes = await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: campaign.id,
          name: editForm.name,
          searchQuery: editForm.search_query,
          location: editForm.location,
          niche: editForm.niche,
          targetWebsiteTypes: editWebsiteTypes,
          maxLeads: editForm.max_leads,
          status: campaign.status || 'active'
        })
      })

      if (!patchRes.ok) throw new Error('Failed to update campaign details')

      // 2. If republish & scrape selected, immediately run new scrape with updated parameters
      if (editForm.republishAndScrape) {
        await fetch('/api/campaigns/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: campaign.id, limit: 10 })
        })
      }

      await fetchCampaignAndLeads()
      setIsEditModalOpen(false)
      setToast({
        id: Date.now().toString(),
        title: 'Campaign Updated & Saved',
        description: editForm.republishAndScrape
          ? 'Saved new parameters and initiated live Google Maps scraping.'
          : 'Campaign parameters successfully updated.',
        type: 'success'
      })
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        title: 'Update Failed',
        description: err.message,
        type: 'error'
      })
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleUpdateStatus(id: string, newStatus: LeadStatus) {
    const previousLeads = leads
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    )
    if (selectedLead?.id === id) {
      setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null))
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (!res.ok) {
        throw new Error('Failed to update lead status in database')
      }
      setToast({
        id: Date.now().toString(),
        title: 'Status Updated',
        description: `Lead status updated to ${newStatus.toUpperCase()}`,
        type: 'success',
      })
    } catch (err: any) {
      console.error(err)
      setLeads(previousLeads)
      setToast({
        id: Date.now().toString(),
        title: 'Update Failed',
        description: err.message || 'Could not update status',
        type: 'error',
      })
    }
  }

  const wonCount = leads.filter(l => l.status === 'won').length
  const enrichedCount = leads.filter(l => l.status === 'enriched' || l.website_audits).length
  const sentCount = leads.filter(l => l.status === 'sent' || l.status === 'delivered' || l.status === 'replied').length

  // Filtered & Sorted Leads
  const processedLeads = React.useMemo(() => {
    let result = leads.filter((l) => {
      const q = search.toLowerCase().trim()
      const matchesSearch =
        !q ||
        l.business_name?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q) ||
        l.address?.toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'review'
          ? l.status === 'review' || l.status === 'new'
          : l.status === statusFilter

      const matchesSite =
        siteFilter === 'all'
          ? true
          : l.site_state === siteFilter

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
  }, [leads, search, statusFilter, siteFilter, sortBy])

  return (
    <>
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Explorer Modal for Campaign Leads */}
      <LeadsListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        leads={leads}
        initialFilter={modalFilter}
        title={`${campaign?.name || 'Campaign'} Leads Explorer`}
        onSelectLead={(lead) => setSelectedLead(lead)}
      />

      {/* Large Centered Lead Detail Popup */}
      <LeadDetailPanel
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onSendWhatsApp={(lead) => {
          handleUpdateStatus(lead.id, 'sent')
          setToast({
            id: Date.now().toString(),
            title: 'Pitch Sent',
            description: `Sent to ${lead.business_name}`,
            type: 'success'
          })
        }}
        onUpdateStatus={handleUpdateStatus}
        onLeadEnriched={(enriched) => {
          setLeads(prev => prev.map(l => (l.id === enriched.id ? enriched : l)))
          setSelectedLead(enriched)
        }}
      />

      <div className="p-5 md:p-8 max-w-[1440px] mx-auto space-y-7 animate-fade-in pb-24">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <Link
              href="/campaigns"
              className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {campaign?.name || 'Campaign Leads'}
                </h1>
                {campaign && (
                  <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase border ${
                    campaign.status === 'active'
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300'
                  }`}>
                    {campaign.status}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span>Niche: <strong className="text-slate-900 dark:text-white">{campaign?.niche || 'General'}</strong></span>
                <span>•</span>
                <span>Query: <strong className="text-slate-900 dark:text-white">"{campaign?.search_query}"</strong></span>
                <span>•</span>
                <span>Location: <strong className="text-slate-900 dark:text-white">{campaign?.location}</strong></span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setModalFilter('all')
                setIsListModalOpen(true)
              }}
              className="btn btn-secondary px-3.5 py-2 text-xs rounded-xl flex items-center gap-1.5 font-bold shadow-xs cursor-pointer"
            >
              <Eye size={13} className="text-indigo-600" /> Open Leads Popup
            </button>

            {/* Toggle Pause/Resume */}
            <button
              onClick={handleToggleStatus}
              className="btn btn-secondary px-3.5 py-2 text-xs rounded-xl flex items-center gap-1.5 font-bold shadow-xs cursor-pointer"
            >
              {campaign?.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
              {campaign?.status === 'active' ? 'Pause' : 'Resume'}
            </button>

            {/* Edit Campaign */}
            <button
              onClick={() => {
                if (campaign) {
                  const { cleanNiche, websiteTypes } = parseNiche(campaign.niche)
                  setEditForm({
                    name: campaign.name,
                    search_query: campaign.search_query,
                    location: campaign.location,
                    niche: cleanNiche,
                    max_leads: campaign.max_leads || 25,
                    republishAndScrape: false
                  })
                  setEditWebsiteTypes(websiteTypes)
                }
                setIsEditModalOpen(true)
              }}
              className="btn btn-secondary px-3.5 py-2 text-xs rounded-xl flex items-center gap-1.5 font-bold shadow-xs cursor-pointer"
            >
              <Edit3 size={13} /> Edit Campaign
            </button>

            {/* Scrape More Leads */}
            {(() => {
              const maxLeads = campaign?.max_leads || 40
              const isFull = leads.length >= maxLeads
              return (
                <button
                  disabled={isScraping || isFull}
                  onClick={handleScrapeMore}
                  className={`btn px-4 py-2 text-xs rounded-xl flex items-center gap-1.5 font-bold shadow-md transition-all ${
                    isFull
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 opacity-60 cursor-not-allowed'
                      : 'btn-primary shadow-indigo-500/25 cursor-pointer'
                  }`}
                >
                  <Zap size={14} className={isScraping ? 'animate-spin text-amber-300' : 'text-amber-300'} />
                  {isScraping
                    ? 'Scraping Google Maps...'
                    : isFull
                    ? `Goal Met (${maxLeads}/${maxLeads})`
                    : 'Scrape Remaining Leads'}
                </button>
              )
            })()}
          </div>
        </div>

        {/* Background Lead Harvesting Status Banner */}
        {isScraping && (
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-4 animate-fade-in shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-5 h-5 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <div>
                <div className="text-sm font-bold text-indigo-950 dark:text-indigo-100 flex items-center gap-2">
                  <span>⚡ Background Lead Harvester Active</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-200 font-extrabold">
                    {leads.length} / {campaign?.max_leads || 10} Leads Collected
                  </span>
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5 font-medium">
                  Apify Google Maps crawler is actively harvesting and verifying local leads in the background. Leads appear live below!
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchCampaignAndLeads(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 text-xs font-bold hover:bg-indigo-50 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw size={13} className="animate-spin" /> Live Sync
            </button>
          </div>
        )}

        {/* KPI Cards for This Campaign (Clickable to Filter Table) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            onClick={() => {
              setStatusFilter('all')
              setSiteFilter('all')
            }}
            className={`kpi-card kpi-card-blue cursor-pointer group${statusFilter === 'all' && siteFilter === 'all' ? ' ring-2 ring-indigo-500 shadow-md' : ''}`}
            title="Click to show all campaign leads"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="kpi-title text-xs font-black uppercase tracking-wider block">
                Ingested Leads
              </span>
              <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                <Users size={17} />
              </div>
            </div>
            <div className="kpi-value text-3xl sm:text-4xl font-black tracking-tight">
              {leads.length} <span className="text-xs font-bold opacity-75">/ {campaign?.max_leads || 40}</span>
            </div>
            <p className="kpi-sub text-xs font-black mt-2 pt-2 border-t border-blue-300/40 dark:border-blue-800/50 flex items-center justify-between">
              <span>{statusFilter === 'all' && siteFilter === 'all' ? '✓ Showing All' : 'Show All Leads'}</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </p>
          </div>

          <div
            onClick={() => {
              setSiteFilter(siteFilter === 'broken' ? 'all' : 'broken')
            }}
            className={`kpi-card kpi-card-purple cursor-pointer group${siteFilter === 'broken' ? ' ring-2 ring-purple-500 shadow-md' : ''}`}
            title="Click to filter by Broken/Audited Sites"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="kpi-title text-xs font-black uppercase tracking-wider block">
                AI Audited Sites
              </span>
              <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                <Sparkles size={17} />
              </div>
            </div>
            <div className="kpi-value text-3xl sm:text-4xl font-black tracking-tight">
              {enrichedCount}
            </div>
            <p className="kpi-sub text-xs font-black mt-2 pt-2 border-t border-purple-300/40 dark:border-purple-800/50 flex items-center justify-between">
              <span>{siteFilter === 'broken' ? '✓ Filter Active' : 'Filter Audited'}</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </p>
          </div>

          <div
            onClick={() => {
              setStatusFilter(statusFilter === 'sent' ? 'all' : 'sent')
            }}
            className={`kpi-card kpi-card-amber cursor-pointer group${statusFilter === 'sent' ? ' ring-2 ring-amber-500 shadow-md' : ''}`}
            title="Click to filter by WhatsApp Pitched Leads"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="kpi-title text-xs font-black uppercase tracking-wider block">
                Pitched on WhatsApp
              </span>
              <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                <Send size={17} />
              </div>
            </div>
            <div className="kpi-value text-3xl sm:text-4xl font-black tracking-tight">
              {sentCount}
            </div>
            <p className="kpi-sub text-xs font-black mt-2 pt-2 border-t border-amber-300/40 dark:border-amber-800/50 flex items-center justify-between">
              <span>{statusFilter === 'sent' ? '✓ Filter Active' : 'Filter Pitched'}</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </p>
          </div>

          <div
            onClick={() => {
              setStatusFilter(statusFilter === 'won' ? 'all' : 'won')
            }}
            className={`kpi-card kpi-card-green cursor-pointer group${statusFilter === 'won' ? ' ring-2 ring-emerald-500 shadow-md' : ''}`}
            title="Click to filter by Won Clients"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="kpi-title text-xs font-black uppercase tracking-wider block">
                Won Clients
              </span>
              <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={17} />
              </div>
            </div>
            <div className="kpi-value text-3xl sm:text-4xl font-black tracking-tight">
              {wonCount}
            </div>
            <p className="kpi-sub text-xs font-black mt-2 pt-2 border-t border-emerald-300/40 dark:border-emerald-800/50 flex items-center justify-between">
              <span>{statusFilter === 'won' ? '✓ Filter Active' : 'Filter Won'}</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </p>
          </div>
        </div>

        {/* Filter Toolbar (Search & Filter Options) */}
        <div className="p-4 bg-white dark:bg-[#1E1D1B] rounded-2xl border border-slate-200 dark:border-stone-800 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search leads by name, phone, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter & Sort Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-xl text-xs shadow-2xs">
              <ArrowUpDown size={13} className="text-indigo-600 font-bold" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none outline-none text-slate-900 dark:text-white cursor-pointer font-bold text-xs"
              >
                <option value="newest">Sort: Latest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="alpha-asc">Sort: A → Z (Alphabetical)</option>
                <option value="alpha-desc">Sort: Z → A (Alphabetical)</option>
                <option value="score">Sort: Highest Score</option>
                <option value="rating">Sort: Google Rating</option>
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
                <option value="all">All Websites</option>
                <option value="exists">Active Sites</option>
                <option value="broken">Broken Sites</option>
                <option value="none">No Website</option>
              </select>
            </div>

            {/* Stage Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-xl text-xs shadow-2xs">
              <Filter size={13} className="text-indigo-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
                className="bg-transparent border-none outline-none text-slate-900 dark:text-white cursor-pointer font-bold text-xs"
              >
                <option value="all">All Stages</option>
                <option value="review">Stage: Review / New</option>
                <option value="queued">Stage: Queued</option>
                <option value="sent">Stage: Sent</option>
                <option value="won">Stage: Won</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(search || sortBy !== 'newest' || statusFilter !== 'all' || siteFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('')
                  setSortBy('newest')
                  setStatusFilter('all')
                  setSiteFilter('all')
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Leads Table for This Specific Campaign */}
        <div className="hkb-table-wrapper">
          <div className="p-4 border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-800/60 flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              Leads Scraped from This Campaign ({processedLeads.length}{processedLeads.length !== leads.length ? ` of ${leads.length}` : ''})
            </h3>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Click any row to open large centered detail popup
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
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-xs text-slate-600 font-bold">
                      <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-indigo-600" />
                      Loading campaign leads...
                    </td>
                  </tr>
                ) : processedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-xs text-slate-600 font-bold space-y-2">
                      <p className="font-black text-sm text-slate-900 dark:text-white">
                        {leads.length === 0 ? 'No leads found in this campaign yet.' : 'No leads match your search/filter criteria.'}
                      </p>
                      {leads.length === 0 ? (
                        <p className="text-xs">Click "Scrape More Leads" above to run Apify and fetch real businesses from Google Maps.</p>
                      ) : (
                        <button
                          onClick={() => {
                            setSearch('')
                            setSortBy('newest')
                            setStatusFilter('all')
                            setSiteFilter('all')
                          }}
                          className="btn btn-secondary px-3 py-1.5 text-xs rounded-xl mt-2 cursor-pointer"
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

                        {/* Phone (Enlarged, Bold, Clear) */}
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

                        {/* Full Address */}
                        <td className="text-xs text-slate-800 dark:text-slate-200 font-semibold max-w-xs">
                          <div className="flex items-start gap-1.5">
                            <MapPin size={13} className="text-indigo-600 shrink-0 mt-0.5" />
                            <span className="leading-snug">{lead.address || 'Address not listed'}</span>
                          </div>
                        </td>

                        {/* Website Status & Link */}
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
                        <td>
                          <span className="font-mono text-xs font-black text-purple-700 dark:text-purple-400">
                            {lead.score ?? 78}/100
                          </span>
                        </td>

                        {/* Status Interactive Selector */}
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-flex items-center">
                            <select
                              value={lead.status}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleUpdateStatus(lead.id, e.target.value as LeadStatus)
                              }}
                              className={`text-[10px] font-black uppercase pl-2.5 pr-6 py-1 rounded-lg border outline-none cursor-pointer appearance-none shadow-2xs transition-all ${getStatusBadgeStyle(lead.status)}`}
                              title="Click to change lead status directly"
                            >
                              <option value="review" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Review</option>
                              <option value="new" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">New</option>
                              <option value="queued" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Queued</option>
                              <option value="sent" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Pitched / Sent</option>
                              <option value="delivered" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Delivered</option>
                              <option value="replied" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Replied</option>
                              <option value="won" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Won 🏆</option>
                              <option value="lost" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Lost</option>
                              <option value="skipped" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Skipped</option>
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
                            >
                              <ExternalLink size={12} />
                            </a>

                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="btn btn-sm btn-primary rounded-xl px-3.5 py-1.5 text-xs font-bold"
                            >
                              Pitch <Send size={11} />
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

        {/* Edit & Republish Modal (Rendered in Document Body via Portal) */}
        {isMounted && isEditModalOpen && createPortal(
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden my-auto animate-scale-in">
              <div className="p-5 border-b border-[var(--line)] bg-[var(--surface-alt)] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[var(--foreground)] flex items-center gap-2">
                    <Edit3 size={16} className="text-indigo-500" /> Edit Campaign
                  </h2>
                  <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                    Update search parameters, target lead count, or website filters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Campaign Name</label>
                  <input
                    required
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="form-input text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Niche / Category</label>
                    <input
                      type="text"
                      value={editForm.niche}
                      onChange={e => setEditForm({ ...editForm, niche: e.target.value })}
                      className="form-input text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Target Leads Count</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={editForm.max_leads}
                      onChange={e => setEditForm({ ...editForm, max_leads: Number(e.target.value) })}
                      className="form-input text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Target Website Presence Multi-Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center justify-between">
                    <span>Target Website Status</span>
                    <span className="text-[11px] font-normal lowercase text-indigo-500">Multi-select filter</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleWebsiteType('none')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        editWebsiteTypes.includes('none')
                          ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 ring-2 ring-rose-400/20'
                          : 'border-[var(--line)] bg-[var(--surface-alt)] opacity-60 hover:opacity-100 text-[var(--foreground)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">🚫 Bina Website</span>
                        {editWebsiteTypes.includes('none') && <Check size={12} className="text-rose-600" />}
                      </div>
                      <span className="text-[10px] text-[var(--ink-muted)] mt-1">No site listed</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleWebsiteType('broken')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        editWebsiteTypes.includes('broken')
                          ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400/20'
                          : 'border-[var(--line)] bg-[var(--surface-alt)] opacity-60 hover:opacity-100 text-[var(--foreground)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">⚠️ Broken Site</span>
                        {editWebsiteTypes.includes('broken') && <Check size={12} className="text-amber-600" />}
                      </div>
                      <span className="text-[10px] text-[var(--ink-muted)] mt-1">404 / dead link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleWebsiteType('exists')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        editWebsiteTypes.includes('exists')
                          ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400/20'
                          : 'border-[var(--line)] bg-[var(--surface-alt)] opacity-60 hover:opacity-100 text-[var(--foreground)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">🌐 Live Website</span>
                        {editWebsiteTypes.includes('exists') && <Check size={12} className="text-emerald-600" />}
                      </div>
                      <span className="text-[10px] text-[var(--ink-muted)] mt-1">Active site</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Google Maps Search Query</label>
                  <input
                    required
                    type="text"
                    value={editForm.search_query}
                    onChange={e => setEditForm({ ...editForm, search_query: e.target.value })}
                    className="form-input text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Target Location</label>
                  <input
                    required
                    type="text"
                    value={editForm.location}
                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                    className="form-input text-xs font-bold"
                  />
                </div>

                {/* Instant Re-Scrape Option */}
                <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                      ⚡ Immediately Scrape 10 New Leads Now
                    </p>
                    <p className="text-[11px] font-semibold text-[var(--ink-muted)] mt-0.5">
                      Runs Apify Google Maps synchronously upon saving.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editForm.republishAndScrape}
                    onChange={e => setEditForm({ ...editForm, republishAndScrape: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 btn btn-secondary rounded-xl py-2.5 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="flex-1 btn btn-primary rounded-xl py-2.5 text-xs font-bold"
                  >
                    {isSavingEdit ? 'Saving Changes...' : (editForm.republishAndScrape ? 'Save & Scrape Leads' : 'Save Changes')}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  )
}

export default function CampaignDetailPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="p-8 max-w-[1440px] mx-auto min-h-[60vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-[var(--ink-muted)]">Loading campaign details...</p>
        </div>
      }
    >
      <CampaignDetailContent {...props} />
    </Suspense>
  )
}
