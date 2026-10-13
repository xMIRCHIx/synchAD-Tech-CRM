'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  Plus, Play, Pause, Target, Edit3, Trash2, Zap,
  RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, Users, ArrowRight,
  Sparkles, Check, Search, ArrowUpDown, Filter, X
} from 'lucide-react'
import Toast, { ToastMessage } from '@/components/Toast'
import { useData } from '@/context/DataContext'
import type { Campaign } from '@/lib/types'
import CampaignAiCopilot from '@/components/CampaignAiCopilot'

interface ExtendedCampaign extends Campaign {
  leads_count?: number
  enriched_count?: number
}

function parseNiche(rawNiche?: string | null) {
  if (!rawNiche) return { cleanNiche: '', websiteTypes: ['none', 'broken'] }
  const match = rawNiche.match(/\[sites:([^\]]+)\]/)
  const cleanNiche = rawNiche.replace(/\[sites:[^\]]+\]/g, '').trim()
  if (!match) return { cleanNiche, websiteTypes: ['none', 'broken', 'exists'] }
  const types = match[1].split(',').filter(Boolean)
  return { cleanNiche, websiteTypes: types }
}

export default function CampaignsPage() {
  const { campaigns: ctxCampaigns, leads, initialLoading, isRefreshing, refreshAll } = useData()
  const [localCampaigns, setLocalCampaigns] = useState<ExtendedCampaign[]>([])
  const loading = initialLoading && ctxCampaigns.length === 0
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [runningScrapeId, setRunningScrapeId] = useState<string | null>(null)
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Search & Filters for Campaigns
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alpha-asc' | 'alpha-desc' | 'leads'>('newest')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all')

  // Edit Campaign State
  const [editingCampaign, setEditingCampaign] = useState<ExtendedCampaign | null>(null)
  const [editWebsiteTypes, setEditWebsiteTypes] = useState<string[]>(['none', 'broken'])
  const [isEditingSaving, setIsEditingSaving] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (ctxCampaigns) {
      setLocalCampaigns(
        ctxCampaigns.map((c) => ({
          ...c,
          leads_count: leads.filter((l) => l.campaign_id === c.id).length,
        }))
      )
    }
  }, [ctxCampaigns, leads])

  const campaigns = localCampaigns

  // Toggle Campaign Status (Active / Paused)
  async function handleToggleStatus(campaign: ExtendedCampaign) {
    const nextStatus = campaign.status === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campaign.id, status: nextStatus })
      })
      if (res.ok) {
        setLocalCampaigns(prev =>
          prev.map(c => (c.id === campaign.id ? { ...c, status: nextStatus } : c))
        )
        refreshAll(true)
        setToast({
          id: Date.now().toString(),
          title: `Campaign ${nextStatus === 'active' ? 'Resumed' : 'Paused'}`,
          description: `"${campaign.name}" is now ${nextStatus}.`,
          type: 'success'
        })
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  async function handleRunScrape(campaignId: string, limit?: number) {
    setRunningScrapeId(campaignId)
    let totalImportedThisSession = 0
    let runsCount = 0
    let consecutiveEmptyCount = 0
    const maxBatches = 25

    try {
      while (runsCount < maxBatches) {
        runsCount++
        const res = await fetch('/api/campaigns/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId })
        })
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to run scraper')
        }

        totalImportedThisSession += (data.leadsImported || 0)
        await refreshAll(true)

        // If goal met or reached max, stop loop
        if (data.isFull || data.totalLeads >= data.maxLeads) {
          setToast({
            id: Date.now().toString(),
            title: 'Campaign Goal Reached! 🎯',
            description: `Target of ${data.maxLeads} leads achieved! Added ${totalImportedThisSession} new leads in this session.`,
            type: 'success'
          })
          break
        }

        if (data.leadsImported === 0) {
          consecutiveEmptyCount++
          if (consecutiveEmptyCount >= 5) {
            setToast({
              id: Date.now().toString(),
              title: 'Scraping Completed',
              description: `Campaign is at ${data.totalLeads}/${data.maxLeads} leads. Added ${totalImportedThisSession} new leads in this session.`,
              type: totalImportedThisSession > 0 ? 'success' : 'info'
            })
            break
          }
        } else {
          consecutiveEmptyCount = 0
        }

        // Show live batch progress toast while continuing to next batch
        setToast({
          id: Date.now().toString(),
          title: `Scraping in progress (${data.totalLeads}/${data.maxLeads})`,
          description: `Batch ${runsCount}: Added ${data.leadsImported} leads. Auto-fetching next batch...`,
          type: 'info'
        })
      }
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        title: 'Scraping Paused',
        description: err.message,
        type: 'error'
      })
    } finally {
      setRunningScrapeId(null)
      await refreshAll(true)
    }
  }

  function handleStartEdit(c: ExtendedCampaign) {
    const { cleanNiche, websiteTypes } = parseNiche(c.niche)
    setEditingCampaign({ ...c, niche: cleanNiche })
    setEditWebsiteTypes(websiteTypes)
  }

  function handleToggleWebsiteType(type: string) {
    setEditWebsiteTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev // Keep at least one selected
        return prev.filter(t => t !== type)
      } else {
        return [...prev, type]
      }
    })
  }

  // Save Edit Campaign
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCampaign) return

    setIsEditingSaving(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCampaign.id,
          name: editingCampaign.name,
          searchQuery: editingCampaign.search_query,
          location: editingCampaign.location,
          niche: editingCampaign.niche,
          targetWebsiteTypes: editWebsiteTypes,
          maxLeads: editingCampaign.max_leads,
          status: editingCampaign.status
        })
      })

      const data = await res.json()
      if (res.ok) {
        let updatedNiche = editingCampaign.niche
        if (editWebsiteTypes.length > 0 && editWebsiteTypes.length < 3) {
          updatedNiche = `${editingCampaign.niche || 'General'} [sites:${editWebsiteTypes.join(',')}]`
        }
        setLocalCampaigns((prev: ExtendedCampaign[]) =>
          prev.map((c: ExtendedCampaign) =>
            c.id === editingCampaign.id
              ? { ...c, ...editingCampaign, niche: updatedNiche }
              : c
          )
        )
        refreshAll(true)
        setEditingCampaign(null)
        setToast({
          id: Date.now().toString(),
          title: 'Campaign Updated',
          description: `"${editingCampaign.name}" saved successfully.`,
          type: 'success'
        })
      } else {
        throw new Error(data.error || 'Failed to update campaign')
      }
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        title: 'Error',
        description: err.message,
        type: 'error'
      })
    } finally {
      setIsEditingSaving(false)
    }
  }

  // Delete Campaign
  async function handleDeleteCampaign(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete campaign "${name}"?`)) return

    try {
      const res = await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setLocalCampaigns((prev: ExtendedCampaign[]) => prev.filter((c: ExtendedCampaign) => c.id !== id))
        refreshAll(true)
        setToast({
          id: Date.now().toString(),
          title: 'Campaign Deleted',
          description: `"${name}" removed.`,
          type: 'success'
        })
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  // Filtered & Sorted Campaigns
  const processedCampaigns = React.useMemo(() => {
    let result = (localCampaigns || []).filter((c) => {
      const q = search.toLowerCase().trim()
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.search_query.toLowerCase().includes(q) ||
        (c.niche && c.niche.toLowerCase().includes(q))

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter

      return matchesSearch && matchesStatus
    })

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortBy === 'alpha-asc') {
        return (a.name || '').localeCompare(b.name || '')
      } else if (sortBy === 'alpha-desc') {
        return (b.name || '').localeCompare(a.name || '')
      } else if (sortBy === 'leads') {
        return (b.leads_count || 0) - (a.leads_count || 0)
      }
      return 0
    })

    return result
  }, [localCampaigns, search, statusFilter, sortBy])

  return (
    <div className="p-5 md:p-8 max-w-[1440px] mx-auto space-y-7 animate-fade-in pb-24">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              Lead Generation Campaigns
            </h1>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Automate B2B lead generation via Apify Google Maps & Firecrawl website auditing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAiCopilotOpen(true)}
            className="btn px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Sparkles size={14} className="text-pink-200 animate-pulse" />
            <span>AI Campaign Copilot</span>
          </button>
          <button
            onClick={() => refreshAll(false)}
            disabled={isRefreshing}
            className="btn btn-secondary px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-indigo-500' : ''} />
            Refresh
          </button>
          <Link
            href="/campaigns/new"
            className="btn btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/25 flex items-center gap-2"
          >
            <Plus size={15} /> New Campaign Wizard
          </Link>
        </div>
      </div>

      {/* Filter Toolbar (Search & Filter Options) */}
      <div className="p-4 bg-white dark:bg-[#1E1D1B] rounded-2xl border border-slate-200 dark:border-stone-800 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search campaigns by name, location, niche, or query..."
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
              <option value="leads">Sort: Most Leads Ingested</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-xl text-xs shadow-2xs">
            <Filter size={13} className="text-indigo-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent border-none outline-none text-slate-900 dark:text-white cursor-pointer font-bold text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="paused">Paused Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(search || sortBy !== 'newest' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('')
                setSortBy('newest')
                setStatusFilter('all')
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Campaigns Table Wrapper */}
      <div className="hkb-table-wrapper">
        <div className="hkb-custom-slider">
          <table className="hkb-table min-w-[800px]">
            <thead>
              <tr>
                <th>Campaign Name & Niche</th>
                <th>Query & Target Location</th>
                <th>Ingested Leads Progress</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-xs text-[var(--ink-muted)]">
                    <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading active campaigns...
                  </td>
                </tr>
              ) : processedCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-xs text-[var(--ink-muted)]">
                    <div className="max-w-md mx-auto space-y-3">
                      <Target size={36} className="mx-auto text-indigo-500 opacity-60" />
                      <p className="font-bold text-sm text-[var(--foreground)]">
                        {localCampaigns.length === 0 ? 'No Campaigns Created Yet' : 'No Campaigns Match Your Filter Criteria'}
                      </p>
                      {localCampaigns.length === 0 ? (
                        <Link
                          href="/campaigns/new"
                          className="btn btn-primary rounded-xl px-4 py-2 text-xs inline-flex items-center gap-1.5"
                        >
                          <Plus size={14} /> Create First Campaign
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            setSearch('')
                            setSortBy('newest')
                            setStatusFilter('all')
                          }}
                          className="btn btn-secondary rounded-xl px-4 py-2 text-xs inline-flex items-center gap-1.5"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                processedCampaigns.map(c => {
                  const leadCount = c.leads_count || 0
                  const maxLeads = c.max_leads || 40
                  const isRunning = runningScrapeId === c.id

                  return (
                    <tr key={c.id} className="group hover:bg-[var(--surface-alt)] transition-colors">
                      {/* Name & Niche */}
                      <td>
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="font-bold text-[var(--foreground)] hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                        >
                          {c.name}
                        </Link>
                        <div className="text-xs text-[var(--ink-muted)] mt-1 flex items-center gap-1.5">
                          {c.niche ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-[10px] font-semibold">
                                {c.niche.replace(/\[sites:[^\]]+\]/g, '').trim() || 'General'}
                              </span>
                              {c.niche.includes('[sites:') && (() => {
                                const match = c.niche.match(/\[sites:([^\]]+)\]/)
                                if (!match) return null
                                const sites = match[1].split(',')
                                return (
                                  <>
                                    {sites.includes('none') && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                                        🚫 No Site
                                      </span>
                                    )}
                                    {sites.includes('broken') && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                        ⚠️ Broken Site
                                      </span>
                                    )}
                                    {sites.includes('exists') && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                        🌐 Live Site
                                      </span>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          ) : null}
                          <span className="text-[11px] opacity-75">
                            Created {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Query & Location */}
                      <td>
                        <div className="text-xs font-semibold text-[var(--foreground)]">
                          "{c.search_query}"
                        </div>
                        <div className="text-[11px] text-[var(--ink-muted)] mt-0.5 flex items-center gap-1">
                          📍 {c.location}
                        </div>
                      </td>

                      {/* Progress */}
                      <td>
                        {(() => {
                          const rawLeadCount = c.leads_count || 0
                          const maxLeads = c.max_leads || 40
                          const leadCount = Math.min(rawLeadCount, maxLeads)
                          const isFull = leadCount >= maxLeads

                          return (
                            <>
                              <div className="flex items-center gap-2 text-xs font-mono">
                                <Users size={13} className={isFull ? 'text-emerald-500' : 'text-indigo-500'} />
                                <span className={`font-bold ${isFull ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--foreground)]'}`}>
                                  {leadCount}
                                </span>
                                <span className="text-[var(--ink-muted)]">/ {maxLeads} leads</span>
                                {isFull && (
                                  <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30">
                                    ✓ Full
                                  </span>
                                )}
                              </div>
                              <div className="w-32 bg-[var(--surface-alt)] rounded-full h-2 mt-1.5 overflow-hidden border border-[var(--line)]">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isFull
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                      : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  }`}
                                  style={{ width: `${Math.min(100, (leadCount / maxLeads) * 100)}%` }}
                                />
                              </div>
                            </>
                          )
                        })()}
                      </td>

                      {/* Status */}
                      <td>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            c.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100'
                              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100'
                          }`}
                        >
                          {c.status === 'active' ? <Play size={10} /> : <Pause size={10} />}
                          <span className="capitalize">{c.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Run Scrape Now */}
                          {(() => {
                            const rawLeadCount = c.leads_count || 0
                            const maxLeads = c.max_leads || 40
                            const leadCount = Math.min(rawLeadCount, maxLeads)
                            const isFull = leadCount >= maxLeads
                            const needed = Math.max(0, maxLeads - leadCount)

                            return (
                              <button
                                title={isFull ? `Goal Met: All ${maxLeads}/${maxLeads} leads collected` : `Scrape remaining ${needed} leads to reach ${maxLeads}`}
                                disabled={isRunning || isFull}
                                onClick={() => {
                                  if (needed > 0) {
                                    handleRunScrape(c.id, needed)
                                  }
                                }}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-2xs ${
                                  isFull
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 opacity-60 cursor-not-allowed'
                                    : 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 cursor-pointer disabled:opacity-50'
                                }`}
                              >
                                <Zap size={14} className={isRunning ? 'animate-spin text-indigo-500' : ''} />
                              </button>
                            )
                          })()}

                          {/* Edit Campaign */}
                          <button
                            title="Edit Campaign Details"
                            onClick={() => handleStartEdit(c)}
                            className="w-8 h-8 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-muted)] hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* View Campaign Leads */}
                          <Link
                            href={`/campaigns/${c.id}`}
                            title="View Leads for this Campaign"
                            className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors shadow-2xs"
                          >
                            <ExternalLink size={14} />
                          </Link>

                          {/* Delete */}
                          <button
                            title="Delete Campaign"
                            onClick={() => handleDeleteCampaign(c.id, c.name)}
                            className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Trash2 size={14} />
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

      {/* Edit Campaign Modal (Rendered in Document Body via Portal to prevent clipping) */}
      {isMounted && editingCampaign && createPortal(
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
                onClick={() => setEditingCampaign(null)}
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
                  value={editingCampaign.name}
                  onChange={e => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
                  className="form-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Niche / Category</label>
                  <input
                    type="text"
                    value={editingCampaign.niche || ''}
                    onChange={e => setEditingCampaign({ ...editingCampaign, niche: e.target.value })}
                    className="form-input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Max Leads</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={editingCampaign.max_leads}
                    onChange={e => setEditingCampaign({ ...editingCampaign, max_leads: Number(e.target.value) })}
                    className="form-input text-xs"
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
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Search Query</label>
                <input
                  required
                  type="text"
                  value={editingCampaign.search_query}
                  onChange={e => setEditingCampaign({ ...editingCampaign, search_query: e.target.value })}
                  className="form-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Location</label>
                <input
                  required
                  type="text"
                  value={editingCampaign.location}
                  onChange={e => setEditingCampaign({ ...editingCampaign, location: e.target.value })}
                  className="form-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Status</label>
                <select
                  value={editingCampaign.status}
                  onChange={e => setEditingCampaign({ ...editingCampaign, status: e.target.value as any })}
                  className="form-select text-xs cursor-pointer"
                >
                  <option value="active">Active (Scraping Allowed)</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="flex-1 btn btn-secondary rounded-xl py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditingSaving}
                  className="flex-1 btn btn-primary rounded-xl py-2.5 text-xs font-semibold"
                >
                  {isEditingSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* AI Campaign Copilot Modal */}
      <CampaignAiCopilot
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
      />
    </div>
  )
}
