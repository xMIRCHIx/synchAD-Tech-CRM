'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText, Plus, Printer, MessageSquare, Search, RefreshCw, CheckCircle2,
  Clock, ShieldCheck, DollarSign, Trash2, Phone, Calendar, Eye, Sparkles
} from 'lucide-react'
import Toast, { ToastMessage } from '@/components/Toast'
import AgreementModal from '@/components/AgreementModal'
import type { ClientAgreement } from '@/lib/types'

export default function AgreementsPage() {
  const [agreements, setAgreements] = useState<ClientAgreement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'signed' | 'completed'>('all')
  const [toast, setToast] = useState<ToastMessage | null>(null)

  // Agreement Modal states
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false)
  const [activeAgreement, setActiveAgreement] = useState<ClientAgreement | null>(null)

  useEffect(() => {
    fetchAgreements()
  }, [])

  async function fetchAgreements() {
    setLoading(true)
    try {
      const res = await fetch('/api/agreements')
      const data = await res.json()
      if (data.agreements) {
        setAgreements(data.agreements)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStatus(idOrNum: string, newStatus: string) {
    try {
      const res = await fetch('/api/agreements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idOrNum, status: newStatus })
      })
      if (res.ok) {
        setAgreements(prev => prev.map(agr =>
          (agr.id === idOrNum || agr.agreement_number === idOrNum) ? { ...agr, status: newStatus as any } : agr
        ))
        setToast({
          id: Date.now().toString(),
          title: 'Agreement Updated',
          description: `Contract marked as ${newStatus.toUpperCase()}`,
          type: 'success'
        })
      }
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        title: 'Update Failed',
        description: err.message,
        type: 'error'
      })
    }
  }

  async function handleDeleteAgreement(agr: ClientAgreement) {
    if (!confirm(`Are you sure you want to delete agreement ${agr.agreement_number}?`)) return
    try {
      const res = await fetch(`/api/agreements?id=${agr.id || ''}&agreement_number=${agr.agreement_number}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setAgreements(prev => prev.filter(a => a.agreement_number !== agr.agreement_number))
        setToast({
          id: Date.now().toString(),
          title: 'Agreement Deleted',
          description: `${agr.agreement_number} has been removed.`,
          type: 'success'
        })
      }
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        title: 'Delete Failed',
        description: err.message,
        type: 'error'
      })
    }
  }

  function handleSendWhatsApp(agr: ClientAgreement) {
    const cleanPhone = (agr.client_phone || '').replace(/[^\d]/g, '')
    if (!cleanPhone) {
      alert('No phone number listed for this agreement.')
      return
    }

    const msg = `Hi ${agr.client_signatory}! Sharing your official Service Agreement (${agr.agreement_number}) for ${agr.title}:

💼 Deal Value: ₹${Number(agr.deal_value).toLocaleString()}
📅 Date: ${agr.effective_date}
📌 Status: ${(agr.status || 'SENT').toUpperCase()}

Please review and confirm acceptance. Thank you!`

    const isDesktop = typeof window !== 'undefined' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = isDesktop
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const filtered = agreements.filter(agr => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      agr.title?.toLowerCase().includes(q) ||
      agr.agreement_number?.toLowerCase().includes(q) ||
      agr.client_signatory?.toLowerCase().includes(q)

    const matchesStatus = statusFilter === 'all' || agr.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalContractVal = agreements.reduce((acc, a) => acc + (Number(a.deal_value) || 0), 0)
  const signedCount = agreements.filter(a => a.status === 'signed' || a.status === 'completed').length

  return (
    <>
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Agreement Modal */}
      <AgreementModal
        isOpen={isAgreementModalOpen}
        initialAgreement={activeAgreement}
        onClose={() => {
          setIsAgreementModalOpen(false)
          setActiveAgreement(null)
        }}
        onAgreementCreated={(newAgr) => {
          setAgreements(prev => [newAgr, ...prev.filter(a => a.agreement_number !== newAgr.agreement_number)])
          setIsAgreementModalOpen(false)
          setToast({
            id: Date.now().toString(),
            title: 'Agreement Created',
            description: `Contract ${newAgr.agreement_number} saved to records.`,
            type: 'success'
          })
        }}
      />

      <div className="p-5 md:p-8 max-w-[1440px] mx-auto space-y-7 animate-fade-in pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Legal Service Agreements <FileText className="text-purple-500" size={24} />
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Draft, customize, sign, and print ironclad B2B software development agreements generated with Gemini AI.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAgreementModalOpen(true)}
              className="btn btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/25 cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 border-none text-white hover:opacity-95"
            >
              <Sparkles size={14} /> Generate New Agreement
            </button>

            <button
              onClick={fetchAgreements}
              disabled={loading}
              className="btn btn-secondary px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-purple-500' : 'text-purple-500'} />
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="kpi-card kpi-card-purple">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                Total Agreement Pipeline
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <FileText size={14} />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              ₹{totalContractVal.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              Across {agreements.length} drafted contracts
            </div>
          </div>

          <div className="kpi-card kpi-card-green">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Executed / Signed Contracts
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {signedCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              Fully active service contracts
            </div>
          </div>

          <div className="kpi-card kpi-card-blue">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                AI Generation Engine
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Sparkles size={14} />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              Gemini 2.5
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              Ironclad commercial terms & warranty
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search agreements by contract #, title, or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 outline-none focus:border-purple-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">All Contracts ({agreements.length})</option>
              <option value="draft">Draft Mode</option>
              <option value="sent">Dispatched / Sent</option>
              <option value="signed">Signed & Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Agreements Table */}
        <div className="hkb-table-wrapper">
          <div className="hkb-custom-slider">
            <table className="hkb-table min-w-[980px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 font-black">
                  <th>Contract # & Date</th>
                  <th>Contract Scope & Title</th>
                  <th>Client Signatory</th>
                  <th>Deal Value (INR)</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-xs text-slate-500 font-bold">
                      <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-purple-500" />
                      Loading agreement ledger...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500 font-bold space-y-3">
                      <FileText size={36} className="mx-auto text-slate-400 opacity-60" />
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {agreements.length === 0 ? 'No legal agreements generated yet' : 'No agreements match your search'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Generate official software service contracts with customized IP, warranty, and payment milestone clauses.
                      </p>
                      {agreements.length === 0 && (
                        <button
                          onClick={() => setIsAgreementModalOpen(true)}
                          className="btn btn-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-purple-500/25 cursor-pointer mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                        >
                          <Sparkles size={14} /> Draft Your First Agreement
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((agr) => (
                    <tr key={agr.id || agr.agreement_number} className="hover:bg-slate-50 dark:hover:bg-stone-800/40 transition-colors">
                      {/* Contract # & Date */}
                      <td>
                        <div className="font-mono font-black text-purple-700 dark:text-purple-400 text-xs">
                          {agr.agreement_number}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Date: {agr.effective_date || 'Today'}
                        </div>
                      </td>

                      {/* Title & Scope */}
                      <td className="max-w-[280px]">
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {agr.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Agency: {agr.agency_signatory}
                        </div>
                      </td>

                      {/* Client Signatory */}
                      <td>
                        <div className="font-black text-slate-900 dark:text-white text-xs">
                          {agr.client_signatory}
                        </div>
                        {agr.client_phone && (
                          <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                            <Phone size={10} className="text-emerald-500" />
                            <span>{agr.client_phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Deal Value */}
                      <td>
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                          ₹{Number(agr.deal_value).toLocaleString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <select
                          value={agr.status || 'draft'}
                          onChange={(e) => handleUpdateStatus(agr.id || agr.agreement_number, e.target.value)}
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                            agr.status === 'signed' || agr.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
                              : agr.status === 'sent'
                              ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700'
                              : 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-700'
                          }`}
                        >
                          <option value="draft" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Draft</option>
                          <option value="sent" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Sent to Client</option>
                          <option value="signed" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Signed / Active ✍️</option>
                          <option value="completed" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Fulfilled 🏆</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setActiveAgreement(agr)
                              setIsAgreementModalOpen(true)
                            }}
                            className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center hover:bg-purple-100 cursor-pointer"
                            title="View / Print Agreement"
                          >
                            <Printer size={13} />
                          </button>

                          {agr.client_phone && (
                            <button
                              onClick={() => handleSendWhatsApp(agr)}
                              className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 cursor-pointer"
                              title="Dispatch on WhatsApp"
                            >
                              <MessageSquare size={13} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteAgreement(agr)}
                            className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 cursor-pointer"
                            title="Delete Agreement"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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
