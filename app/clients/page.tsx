'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Lead, LeadStatus, ClientDeal } from '@/lib/types'
import {
  Search, RefreshCw, CheckCircle2, Phone, MapPin, Mail, ShieldCheck, Globe,
  PartyPopper, TrendingUp, DollarSign, ExternalLink, Sparkles, Receipt,
  Briefcase, FileText, MessageSquare, Plus, Calendar, CreditCard, Banknote,
  ChevronRight, ArrowUpRight
} from 'lucide-react'
import LeadDetailPanel from '@/components/LeadDetailPanel'
import DealDossierModal from '@/components/DealDossierModal'
import AgreementModal from '@/components/AgreementModal'
import InvoiceModal from '@/components/InvoiceModal'
import Toast, { ToastMessage } from '@/components/Toast'
import { useData } from '@/context/DataContext'
import { normalizeLeadStatus } from '@/lib/statusHelper'

export default function ClientsDashboard() {
  const { leads, initialLoading, isRefreshing, refreshAll, updateLeadStatus } = useData()
  const clients = React.useMemo(() => leads.filter((l) => normalizeLeadStatus(l.status) === 'won'), [leads])
  const loading = initialLoading && leads.length === 0

  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Lead | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  // Deal, Agreement & Invoice Modals
  const [dealModalClient, setDealModalClient] = useState<Lead | null>(null)
  const [agreementModalClient, setAgreementModalClient] = useState<Lead | null>(null)
  const [invoiceModalClient, setInvoiceModalClient] = useState<Lead | null>(null)
  const [localDeals, setLocalDeals] = useState<Record<string, ClientDeal>>({})

  // Derive dealsMap cleanly without infinite re-render loop
  const dealsMap = React.useMemo(() => {
    const map: Record<string, ClientDeal> = { ...localDeals }
    for (const c of clients) {
      if (c.notes) {
        try {
          const parsed = JSON.parse(c.notes)
          if (parsed?.__deal && !map[c.id]) {
            map[c.id] = parsed.__deal
          }
        } catch {}
      }
    }
    return map
  }, [clients, localDeals])

  async function handleUpdateStatus(id: string, newStatus: LeadStatus) {
    try {
      const ok = await updateLeadStatus(id, newStatus)
      if (ok) {
        if (newStatus !== 'won') {
          setSelectedClient(null)
        }
        setToast({ id: String(Date.now()), title: 'Status Updated', description: 'Client moved pipeline stage.', type: 'success' })
      }
    } catch (err) {}
  }

  function handleDealSaved(deal: ClientDeal) {
    setLocalDeals(prev => ({ ...prev, [deal.lead_id]: deal }))
    refreshAll(true)
    setToast({
      id: String(Date.now()),
      title: 'Deal Dossier Saved',
      description: `Updated project scope & financials (${deal.currency === 'INR' ? '₹' : '$'}${deal.deal_value.toLocaleString()}).`,
      type: 'success'
    })
  }

  const filteredClients = clients.filter((l) => {
    return l.business_name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.address && l.address.toLowerCase().includes(search.toLowerCase()))
  })

  // Financial aggregates
  const totalContracted = clients.reduce((acc, c) => {
    const deal = dealsMap[c.id]
    return acc + (deal ? Number(deal.deal_value) || 0 : 35000)
  }, 0)

  const totalAdvanceCollected = clients.reduce((acc, c) => {
    const deal = dealsMap[c.id]
    return acc + (deal ? Number(deal.advance_paid) || 0 : 17500)
  }, 0)

  const totalReceivables = Math.max(0, totalContracted - totalAdvanceCollected)

  return (
    <>
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Lead Dossier Detail Modal */}
      <LeadDetailPanel
        lead={selectedClient}
        onClose={() => setSelectedClient(null)}
        onSendWhatsApp={(lead) => setToast({ id: '1', title: 'Message Queued', description: 'WhatsApp message queued.', type: 'success'})}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Deal Financials & Scope Modal */}
      <DealDossierModal
        lead={dealModalClient}
        isOpen={Boolean(dealModalClient)}
        onClose={() => setDealModalClient(null)}
        onSaved={handleDealSaved}
      />

      {/* AI Legal Agreement Modal */}
      <AgreementModal
        lead={agreementModalClient}
        isOpen={Boolean(agreementModalClient)}
        onClose={() => setAgreementModalClient(null)}
        dealData={agreementModalClient ? dealsMap[agreementModalClient.id] : undefined}
      />

      {/* Milestone Invoice Modal */}
      <InvoiceModal
        lead={invoiceModalClient}
        isOpen={Boolean(invoiceModalClient)}
        onClose={() => setInvoiceModalClient(null)}
        dealData={invoiceModalClient ? dealsMap[invoiceModalClient.id] : undefined}
      />

      <div className="p-5 md:p-8 max-w-[1440px] mx-auto space-y-7 animate-fade-in pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Won Clients & Deal Portfolio <PartyPopper className="text-emerald-500" size={24} />
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Complete Agency OS: Deal Dossiers, AI Legal Service Agreements, Milestone Invoices & Revenue Intelligence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/deals"
              className="btn btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white cursor-pointer"
            >
              <Briefcase size={14} />
              <span>Deals & Scope Studio</span>
            </Link>

            <button
              onClick={() => refreshAll(false)}
              disabled={isRefreshing}
              className="btn btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-emerald-500' : 'text-emerald-500'} />
              Sync Portfolio
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="kpi-card kpi-card-green">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Total Contracted Revenue
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 font-mono tracking-tight">
              ₹{totalContracted.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">
              From {clients.length} closed clients
            </p>
          </div>

          <div className="kpi-card kpi-card-blue">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Advance Paid / Realized
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300 font-mono tracking-tight">
              ₹{totalAdvanceCollected.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">
              Bank / UPI & Cash received
            </p>
          </div>

          <div className="kpi-card kpi-card-amber">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Pending Balance Receivables
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300 font-mono tracking-tight">
              ₹{totalReceivables.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">
              Due upon final delivery
            </p>
          </div>

          <div className="kpi-card kpi-card-purple">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                Active Client Accounts
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                <PartyPopper size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-300 font-mono tracking-tight">
              {clients.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">
              100% Client retention
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search won clients by business name, phone, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-3">
            <PartyPopper size={36} className="mx-auto text-slate-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No won clients found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When you close deals from your WhatsApp Inbox or Lead Pipeline, mark them as <strong>Won 🏆</strong> to manage their contracts, project deliverables, and milestone invoices here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClients.map((client) => {
              const deal = dealsMap[client.id]
              const dealVal = deal ? Number(deal.deal_value) || 0 : 35000
              const advanceVal = deal ? Number(deal.advance_paid) || 0 : 17500
              const balanceVal = Math.max(0, dealVal - advanceVal)
              const symbol = deal?.currency === 'USD' ? '$' : '₹'
              const service = deal?.service_type || 'Custom Website + WhatsApp Booking Funnel'
              const stage = deal?.stage || 'closing'
              const deadline = deal?.target_deadline || '14 Days'

              const stageColors: Record<string, string> = {
                closing: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300',
                in_development: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300',
                review: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300',
                delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300',
                maintenance: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300',
              }

              return (
                <div
                  key={client.id}
                  className="rounded-3xl bg-white dark:bg-stone-900 border-2 border-slate-200 dark:border-stone-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all p-5 sm:p-6 space-y-4 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Business Name & Stage Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight line-clamp-1">
                          {client.business_name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {client.owner_name || 'Client Lead'} • {client.phone}
                        </p>
                      </div>

                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 ${stageColors[stage] || stageColors.closing}`}>
                        {stage.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Deliverable Box */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-800/50 border border-slate-200 dark:border-stone-700/60 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400 block tracking-wider">
                        Project Deliverable:
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                        {service}
                      </p>
                    </div>

                    {/* Financial Numbers Row */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-stone-800">
                        <span className="text-[10px] font-bold text-slate-500 block">Deal Value</span>
                        <span className="text-xs font-black font-mono text-slate-900 dark:text-white">
                          {symbol}{dealVal.toLocaleString()}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                        <span className="text-[10px] font-bold text-emerald-600 block">Advance</span>
                        <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-300">
                          {symbol}{advanceVal.toLocaleString()}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                        <span className="text-[10px] font-bold text-amber-600 block">Balance</span>
                        <span className="text-xs font-black font-mono text-amber-700 dark:text-amber-300">
                          {symbol}{balanceVal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-stone-800">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setAgreementModalClient(client)}
                        className="btn btn-secondary py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-purple-700 dark:text-purple-300 cursor-pointer hover:bg-purple-50"
                        title="Generate Legal Agreement"
                      >
                        <ShieldCheck size={13} />
                        <span>AI Contract</span>
                      </button>

                      <button
                        onClick={() => setInvoiceModalClient(client)}
                        className="btn btn-secondary py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-300 cursor-pointer hover:bg-emerald-50"
                        title="Generate Milestone Invoice"
                      >
                        <Receipt size={13} />
                        <span>Milestone Bill</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/deals?leadId=${client.id}`}
                        className="btn btn-secondary py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-indigo-700 dark:text-indigo-300 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        title="Open Full Deal & Project Scope Studio"
                      >
                        <Briefcase size={13} />
                        <span>Scope Studio</span>
                      </Link>

                      <button
                        onClick={() => setSelectedClient(client)}
                        className="btn btn-secondary py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer"
                        title="Inspect Full Lead Details & Audit"
                      >
                        <FileText size={13} />
                        <span>Lead Audit</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
