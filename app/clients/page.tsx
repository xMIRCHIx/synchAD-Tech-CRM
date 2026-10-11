'use client'

import React, { useEffect, useState } from 'react'
import type { Lead, LeadStatus } from '@/lib/types'
import {
  Search, RefreshCw, CheckCircle2, Phone, MapPin, Mail, ShieldCheck, Globe,
  PartyPopper, TrendingUp, DollarSign, ExternalLink, Sparkles
} from 'lucide-react'
import LeadDetailPanel from '@/components/LeadDetailPanel'
import Toast, { ToastMessage } from '@/components/Toast'
import { useData } from '@/context/DataContext'

export default function ClientsDashboard() {
  const { leads, initialLoading, isRefreshing, refreshAll, updateLeadStatus } = useData()
  const clients = leads.filter((l) => l.status === 'won')
  const loading = initialLoading && leads.length === 0

  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Lead | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

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

  const filteredClients = clients.filter((l) => {
    return l.business_name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.address && l.address.toLowerCase().includes(search.toLowerCase()))
  })

  // Estimated pipeline retainer metrics
  const estRetainer = clients.length * 350

  return (
    <>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      
      <LeadDetailPanel
        lead={selectedClient}
        onClose={() => setSelectedClient(null)}
        onSendWhatsApp={(lead) => setToast({ id: '1', title: 'Message Queued', description: 'WhatsApp message queued.', type: 'success'})}
        onUpdateStatus={handleUpdateStatus}
      />

      <div className="p-5 md:p-8 max-w-[1440px] mx-auto space-y-7 animate-fade-in pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] flex items-center gap-2">
                Won Clients Portfolio <PartyPopper className="text-emerald-500" size={24} />
              </h1>
            </div>
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              Manage your successfully converted businesses, retainers, and ongoing active client dossiers.
            </p>
          </div>

          <button
            onClick={() => refreshAll(false)}
            disabled={isRefreshing}
            className="btn btn-secondary px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-emerald-500' : 'text-emerald-500'} />
            Sync Portfolio
          </button>
        </div>

        {/* Top KPI Cards (Pastel Tinted Tops) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="kpi-card kpi-card-green">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Total Converted Clients
              </span>
              <div className="kpi-icon-bubble w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {clients.length}
            </div>
            <p className="text-[11px] text-[var(--ink-muted)] mt-1">
              Active paying B2B accounts
            </p>
          </div>

          <div className="kpi-card kpi-card-blue">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Estimated Monthly Value
              </span>
              <div className="kpi-icon-bubble w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
              ${estRetainer.toLocaleString()}
            </div>
            <p className="text-[11px] text-[var(--ink-muted)] mt-1">
              Based on $350/mo average retainer
            </p>
          </div>

          <div className="kpi-card kpi-card-amber">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Client Satisfaction
              </span>
              <div className="kpi-icon-bubble w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Sparkles size={16} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              100%
            </div>
            <p className="text-[11px] text-[var(--ink-muted)] mt-1">
              Zero churn recorded
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3.5 bg-[var(--surface)] rounded-2xl border border-[var(--line)] shadow-xs">
          <div className="relative w-full max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
            <input
              type="text"
              placeholder="Search won clients by name, address, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--surface-alt)] border border-[var(--line)] rounded-xl text-[var(--foreground)] outline-none focus:bg-[var(--surface)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
            />
          </div>
        </div>

        {/* Grid of Clients (Curved Cards, No Sharp Cuts) */}
        {loading ? (
          <div className="py-16 text-center text-xs text-[var(--ink-muted)]">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-emerald-500" />
            Loading won clients portfolio...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--ink-muted)] space-y-2 hkb-card p-10">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500/60 mb-2" />
            <p className="font-bold text-sm text-[var(--foreground)]">No converted clients yet.</p>
            <p>Pitch your queued leads in the Leads Pipeline to celebrate your first won client!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="hkb-card p-5 hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-[var(--foreground)] group-hover:text-emerald-600 transition-colors truncate">
                        {client.business_name}
                      </h3>
                      <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 flex items-center gap-1 truncate">
                        <MapPin size={12} className="text-emerald-500 shrink-0" />
                        <span className="truncate">{client.address || 'Address N/A'}</span>
                      </p>
                    </div>
                    <span className="badge badge-good text-[10px] shrink-0 font-bold uppercase">
                      Won Client
                    </span>
                  </div>

                  <div className="space-y-2 my-4 pt-3 border-t border-[var(--line)] text-xs">
                    <div className="flex items-center gap-2 text-[var(--foreground)] font-mono">
                      <Phone size={13} className="text-emerald-500" />
                      <span>{client.phone}</span>
                    </div>

                    {client.owner_name && (
                      <div className="flex items-center gap-2 text-[var(--ink-muted)]">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <span>POC: <strong>{client.owner_name}</strong></span>
                      </div>
                    )}

                    {client.website_url && (
                      <div className="flex items-center gap-2 text-[var(--ink-muted)] truncate">
                        <Globe size={13} className="text-indigo-500 shrink-0" />
                        <a
                          href={client.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                        >
                          {client.website_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--line)] flex justify-between items-center">
                  <div className="text-xs text-[var(--ink-muted)]">
                    Score: <span className="font-bold text-purple-600 dark:text-purple-400">{client.score || 85}/100</span>
                  </div>
                  <button
                    onClick={() => setSelectedClient(client)}
                    className="btn btn-sm btn-secondary rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:border-emerald-300"
                  >
                    View Dossier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
