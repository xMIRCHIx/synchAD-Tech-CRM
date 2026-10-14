'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, Zap, CheckCircle2, Target, ArrowRight,
  TrendingUp, Sparkles, MessageSquare, Compass, RefreshCw,
  Globe, ShieldCheck, AlertTriangle, MapPin, ChevronRight, Eye, Phone
} from 'lucide-react'
import LeadsListModal from '@/components/LeadsListModal'
import LeadDetailPanel from '@/components/LeadDetailPanel'
import { useData } from '@/context/DataContext'
import type { Lead } from '@/lib/types'
import {
  normalizeLeadStatus,
  getLeadStatusLabel,
  getLeadStatusBadgeStyle
} from '@/lib/statusHelper'

export default function DashboardOverview() {
  const { leads, stats, initialLoading, updateLeadStatus } = useData()

  const allLeads = leads
  const recentLeads = leads.slice(0, 8)
  const loading = initialLoading && leads.length === 0

  // Modal states for clicking KPI cards
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [modalFilter, setModalFilter] = useState<'all' | 'review' | 'won' | 'broken' | 'active'>('all')
  const [modalTitle, setModalTitle] = useState('All Ingested Leads Explorer')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const totalLeads = stats?.total ?? allLeads.length
  const wonClients = stats?.won ?? allLeads.filter(l => l.status === 'won').length
  const activeCampaigns = stats?.activeCampaigns ?? 0
  const winRate = stats?.conversionRate ?? '0'

  const openLeadsExplorer = (filter: 'all' | 'review' | 'won' | 'broken' | 'active', title: string) => {
    setModalFilter(filter)
    setModalTitle(title)
    setIsListModalOpen(true)
  }

  return (
    <>
      {/* KPI Explorer Popup Modal */}
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
          updateLeadStatus(id, st)
          if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, status: st } : null)
        }}
      />

      <div className="p-5 md:p-8 max-w-[1440px] mx-auto space-y-7 animate-fade-in pb-24">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Outreach Command Center
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">
              Autonomous AI engine: Google Maps Places scraping, Firecrawl audits & personalized WhatsApp conversion.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openLeadsExplorer('all', 'All Captured Leads Database')}
              className="btn btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Eye size={14} className="text-indigo-600" /> Inspect All Leads Popup
            </button>
            <Link
              href="/campaigns/new"
              className="btn btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-500/25"
            >
              <Zap size={14} /> Launch Campaign
            </Link>
          </div>
        </div>

        {/* Hero Command Card */}
        <div className="hexabox-hero-card">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 backdrop-blur-md border border-white/30 text-white">
              <Sparkles size={13} className="text-amber-300" />
              Autonomous B2B Lead Gen & AI WhatsApp Outreach Active
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight text-white">
              Convert Local Google Maps Visitors into Paying Clients
            </h2>
            <p className="text-xs md:text-sm text-indigo-50 font-medium leading-relaxed max-w-xl">
              Apify extracts verified Google Maps places, Firecrawl audits mobile website flaws, and Google Gemini AI writes personalized WhatsApp hooks ready to send in 1 click.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => openLeadsExplorer('all', 'Ingested Leads Explorer')}
                className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-black text-xs hover:bg-indigo-50 transition-all shadow-md active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              >
                <Users size={14} /> Open Leads Popup ({totalLeads})
              </button>
              <Link
                href="/campaigns/new"
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all backdrop-blur-md border border-white/20 inline-flex items-center gap-1.5"
              >
                Start New Campaign <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Clickable KPI Cards (Clicking opens Leads Detail Popup) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Live Pipeline Metrics (Click Any Card To Inspect Leads)
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              ⚡ Click cards to open popup
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Ingested Leads Card */}
            <div
              onClick={() => openLeadsExplorer('all', 'Total Ingested Leads Explorer')}
              className="kpi-card kpi-card-blue cursor-pointer group"
              title="Click to view all ingested leads in popup"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="kpi-title text-xs font-black uppercase tracking-wider">
                  Total Ingested Leads
                </span>
                <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                  <Users size={17} />
                </div>
              </div>
              <div className="kpi-value text-3xl sm:text-4xl font-black tracking-tight">
                {totalLeads}
              </div>
              <div className="kpi-sub flex items-center justify-between mt-2.5 pt-2 border-t border-blue-300/40 dark:border-blue-800/50 text-xs font-black">
                <span>View All Leads Popup</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Won Clients Card */}
            <div
              onClick={() => openLeadsExplorer('won', 'Won / Converted Clients Portfolio')}
              className="kpi-card kpi-card-green cursor-pointer group"
              title="Click to view won clients in popup"
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
                {wonClients}
              </div>
              <div className="kpi-sub flex items-center justify-between mt-2.5 pt-2 border-t border-emerald-300/40 dark:border-emerald-800/50 text-xs font-black">
                <span>Converted Deals</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Win Rate Card */}
            <div
              onClick={() => openLeadsExplorer('review', 'Leads Awaiting Outreach Pitch')}
              className="kpi-card kpi-card-amber cursor-pointer group"
              title="Click to view leads awaiting pitch in popup"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="kpi-title text-xs font-black uppercase tracking-wider">
                  Win Rate Ratio
                </span>
                <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                  <TrendingUp size={17} />
                </div>
              </div>
              <div className="kpi-value text-3xl sm:text-4xl font-black tracking-tight">
                {winRate}%
              </div>
              <div className="kpi-sub flex items-center justify-between mt-2.5 pt-2 border-t border-amber-300/40 dark:border-amber-800/50 text-xs font-black">
                <span>Awaiting Pitch Leads</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Active Campaigns Card */}
            <Link
              href="/campaigns"
              className="kpi-card kpi-card-purple cursor-pointer group block"
              title="Click to view campaigns manager"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="kpi-title text-xs font-black uppercase tracking-wider">
                  Active Campaigns
                </span>
                <div className="kpi-icon-bubble w-9 h-9 rounded-xl flex items-center justify-center">
                  <Target size={17} />
                </div>
              </div>
              <div className="kpi-value text-3xl sm:text-4xl font-black tracking-tight">
                {activeCampaigns}
              </div>
              <div className="kpi-sub flex items-center justify-between mt-2.5 pt-2 border-t border-purple-300/40 dark:border-purple-800/50 text-xs font-black">
                <span>Manage Campaigns</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        {/* Two Column Section: Recent Leads & Presets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Pipeline Leads (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Recent Scraped Leads (Click to Inspect)
                </h3>
              </div>
              <button
                onClick={() => openLeadsExplorer('all', 'All Scraped Leads Database')}
                className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Open Full Popup <ChevronRight size={14} />
              </button>
            </div>

            <div className="hkb-table-wrapper">
              <div className="hkb-custom-slider">
                <table className="hkb-table min-w-[760px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 font-black">
                      <th>Business Name</th>
                      <th>Origin Campaign</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-14 text-center text-xs text-slate-500 font-semibold">
                          <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-indigo-600" />
                          Loading pipeline...
                        </td>
                      </tr>
                    ) : recentLeads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-14 text-center text-xs text-slate-500 font-semibold">
                          No leads scraped yet. Launch your first campaign!
                        </td>
                      </tr>
                    ) : (
                      recentLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className="group cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors"
                        >
                          <td>
                            <div className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                              {lead.business_name}
                            </div>
                            {lead.google_rating && (
                              <div className="text-[11px] text-amber-600 font-bold mt-0.5">
                                ★ {lead.google_rating} on Google
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 max-w-[140px] truncate">
                              {lead.campaigns?.name || 'Direct Lead'}
                            </span>
                          </td>
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
                          <td>
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg inline-block border ${getLeadStatusBadgeStyle(lead.status)}`}>
                              {getLeadStatusLabel(lead.status)}
                            </span>
                          </td>
                          <td className="text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="btn btn-sm btn-primary rounded-xl px-3 py-1.5 text-xs font-bold"
                            >
                              Inspect <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Preset Launcher Box */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Quick Scrape Presets
              </h3>
            </div>

            <div className="hkb-card p-5 space-y-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                Launch pre-configured scraping runs for high-ROI local niches:
              </p>

              <div className="space-y-2.5">
                {[
                  { name: 'Dental Clinics Mumbai', niche: 'Dentist & Dental Clinic', loc: 'Mumbai, India' },
                  { name: 'Gyms & CrossFit Delhi', niche: 'Fitness Gym & CrossFit', loc: 'Delhi, India' },
                  { name: 'Cafes & Bakeries Bangalore', niche: 'Cafe & Bakery', loc: 'Bangalore, India' },
                ].map((preset, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-800 hover:border-indigo-400 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                        {preset.name}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {preset.loc}
                      </p>
                    </div>
                    <Link
                      href={`/campaigns/new?niche=${encodeURIComponent(preset.niche)}&location=${encodeURIComponent(preset.loc)}`}
                      className="btn btn-sm btn-primary rounded-xl shrink-0 font-bold"
                    >
                      Launch <ArrowRight size={12} />
                    </Link>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-stone-800">
                <Link
                  href="/campaigns/new"
                  className="w-full btn btn-secondary rounded-xl text-xs font-bold justify-center py-2.5"
                >
                  + Custom Niche Campaign
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
