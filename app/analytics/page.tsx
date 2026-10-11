'use client'

import React, { useState, useEffect } from 'react'
import {
  BarChart3, TrendingUp, Users, Target, CheckCircle2,
  RefreshCw, Globe, AlertTriangle, ArrowUpRight, ArrowRight, Eye
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'
import Link from 'next/link'
import LeadsListModal from '@/components/LeadsListModal'
import LeadDetailPanel from '@/components/LeadDetailPanel'
import type { Lead } from '@/lib/types'

const STATUS_COLORS = ['#f59e0b', '#6366f1', '#3b82f6', '#10b981', '#14b8a6']
const SITE_COLORS = ['#10b981', '#f59e0b', '#ef4444']

let cachedAnalyticsData: any = null

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(!cachedAnalyticsData)
  const [data, setData] = useState<any>(cachedAnalyticsData)
  const [allLeads, setAllLeads] = useState<Lead[]>(cachedAnalyticsData?.leads || [])

  // Modal states for clicking KPI cards
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [modalFilter, setModalFilter] = useState<'all' | 'review' | 'won' | 'broken' | 'active'>('all')
  const [modalTitle, setModalTitle] = useState('Analytics Leads Explorer')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    fetchAnalytics(Boolean(cachedAnalyticsData))
  }, [])

  async function fetchAnalytics(silent = false) {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/analytics')
      const json = await res.json()
      if (res.ok) {
        cachedAnalyticsData = json
        setData(json)
        if (json.leads) setAllLeads(json.leads)
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const stats = data?.stats || {
    total: 0,
    won: 0,
    conversionRate: '0.0',
    activeCampaigns: 0,
    totalCampaigns: 0
  }

  const timelineData = data?.timelineData || []
  const siteStateData = data?.siteStateData || []
  const campaignStats = data?.campaignStats || []

  const openLeadsExplorer = (filter: 'all' | 'review' | 'won' | 'broken' | 'active', title: string) => {
    setModalFilter(filter)
    setModalTitle(title)
    setIsListModalOpen(true)
  }

  // Calculate total for site state safely
  const totalSiteLeads = siteStateData.reduce((acc: number, cur: any) => acc + (cur.count ?? cur.value ?? 0), 0) || 1

  return (
    <>
      {/* Leads List Modal Popup */}
      <LeadsListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        leads={allLeads}
        initialFilter={modalFilter}
        title={modalTitle}
        onSelectLead={(lead) => setSelectedLead(lead)}
      />

      {/* Large Centered Lead Detail Popup */}
      <LeadDetailPanel
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onSendWhatsApp={(lead) => {
          setSelectedLead(null)
        }}
        onUpdateStatus={(id, st) => {
          setAllLeads(prev => prev.map(l => l.id === id ? { ...l, status: st } : l))
          if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, status: st } : null)
        }}
      />

      <div className="p-5 md:p-8 max-w-[1440px] mx-auto space-y-7 animate-fade-in pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Analytics & Conversion ROI
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">
              Real-time pipeline metrics, conversion rates, and campaign performance across your database.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openLeadsExplorer('all', 'All Scraped Leads Database')}
              className="btn btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Eye size={14} className="text-indigo-600" /> Inspect Leads Popup
            </button>
            <button
              onClick={() => fetchAnalytics(false)}
              disabled={loading}
              className="btn btn-secondary px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start cursor-pointer shadow-xs"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-600' : 'text-indigo-600'} />
              Refresh
            </button>
          </div>
        </div>

        {/* Clickable KPI Cards (Opens Leads Explorer Popup) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Pipeline Performance (Click Card To Inspect Leads)
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              ⚡ Click cards to open popup
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Leads */}
            <div
              onClick={() => openLeadsExplorer('all', 'Total Ingested Leads Explorer')}
              className="kpi-card kpi-card-blue cursor-pointer group hover:border-blue-400"
              title="Click to view all leads in popup"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Total Ingested Leads
                </span>
                <div className="kpi-icon-bubble w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-700 dark:text-blue-300 shadow-xs">
                  <Users size={16} />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.total}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 font-bold">
                <span>Inspect All Leads</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Won Clients */}
            <div
              onClick={() => openLeadsExplorer('won', 'Won / Closed Clients Portfolio')}
              className="kpi-card kpi-card-green cursor-pointer group hover:border-emerald-400"
              title="Click to view won clients in popup"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Won / Closed Clients
                </span>
                <div className="kpi-icon-bubble w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shadow-xs">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                {stats.won}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                <span>View Won Clients</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Conversion Rate */}
            <div
              onClick={() => openLeadsExplorer('review', 'Leads Awaiting Outreach Pitch')}
              className="kpi-card kpi-card-amber cursor-pointer group hover:border-amber-400"
              title="Click to view awaiting pitch leads in popup"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Conversion Win Rate
                </span>
                <div className="kpi-icon-bubble w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shadow-xs">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-amber-700 dark:text-amber-300 tracking-tight">
                {stats.conversionRate}%
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-100 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 font-bold">
                <span>Review Pipeline</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Active Campaigns */}
            <Link
              href="/campaigns"
              className="kpi-card kpi-card-purple cursor-pointer group hover:border-purple-400 block"
              title="Click to view campaigns"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Active Campaigns
                </span>
                <div className="kpi-icon-bubble w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-700 dark:text-purple-300 shadow-xs">
                  <Target size={16} />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-purple-700 dark:text-purple-300 tracking-tight">
                {stats.activeCampaigns} <span className="text-sm text-slate-500 font-bold">/ {stats.totalCampaigns}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-purple-100 dark:border-purple-900/40 text-xs text-purple-800 dark:text-purple-300 font-bold">
                <span>Manage Campaigns</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline Area Chart (2 cols) */}
          <div className="lg:col-span-2 hkb-card p-6 space-y-4">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Lead Acquisition Velocity (Last 7 Days)
              </h3>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Daily scraped Google Maps businesses ingested into database
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.6} />
                  <XAxis dataKey="date" stroke="var(--ink-faint)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--ink-faint)" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--line)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
                    }}
                  />
                  <Area type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#leadGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Website Quality Breakdown (1 col - NO Truncation, Clean Counts) */}
          <div className="hkb-card p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Lead Website Health Distribution
              </h3>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Condition detected via Firecrawl website scans
              </p>
            </div>

            <div className="space-y-4 my-2">
              {siteStateData.map((item: any, idx: number) => {
                const count = item.count ?? item.value ?? 0
                const pct = Math.round((count / totalSiteLeads) * 100) || 0
                const color = SITE_COLORS[idx % SITE_COLORS.length]

                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                      <span className="font-mono font-black text-slate-800 dark:text-slate-200">
                        {count} leads ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-stone-800 rounded-full h-2.5 overflow-hidden border border-slate-200 dark:border-stone-700">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, pct)}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border-2 border-amber-300 dark:border-amber-700 text-xs font-bold text-amber-950 dark:text-amber-100 leading-relaxed">
              💡 <strong>Strategic High-ROI Angle:</strong> Leads with "No Website" or "Broken Site" convert at <strong>3.2x higher reply rates</strong> when pitched with automated WhatsApp booking microsites.
            </div>
          </div>
        </div>

        {/* Campaign Performance Matrix Table */}
        <div className="hkb-table-wrapper">
          <div className="p-4 border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-800/60 flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Target size={16} className="text-indigo-600" />
              Campaign Performance Matrix
            </h3>
            <Link
              href="/campaigns/new"
              className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Launch Campaign <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="hkb-custom-slider">
            <table className="hkb-table min-w-[780px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 font-black">
                  <th>Campaign Name</th>
                  <th>Target Niche</th>
                  <th>Location</th>
                  <th>Ingested Leads</th>
                  <th>Won Clients</th>
                  <th>Win Rate</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {campaignStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-500 font-bold">
                      No active campaign data recorded yet.
                    </td>
                  </tr>
                ) : (
                  campaignStats.map((c: any) => (
                    <tr key={c.id} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors">
                      <td className="font-black text-slate-900 dark:text-white">
                        {c.name}
                      </td>
                      <td>
                        <span className="badge badge-primary text-[10px] font-bold">
                          {c.niche}
                        </span>
                      </td>
                      <td className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        📍 {c.location}
                      </td>
                      <td className="font-mono text-xs font-black text-slate-900 dark:text-white">
                        {c.totalLeads}
                      </td>
                      <td className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-300">
                        {c.wonCount}
                      </td>
                      <td>
                        <span className="font-mono text-xs font-black text-indigo-700 dark:text-indigo-400">
                          {c.conversionRate}%
                        </span>
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="btn btn-sm btn-secondary rounded-xl font-bold"
                        >
                          View Leads
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
