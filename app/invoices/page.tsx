'use client'

import React, { useState, useEffect } from 'react'
import {
  Receipt, Plus, Printer, MessageSquare, Search, RefreshCw, CheckCircle2,
  Clock, AlertTriangle, DollarSign, Download, ExternalLink, ArrowUpRight
} from 'lucide-react'
import Toast, { ToastMessage } from '@/components/Toast'
import type { ClientInvoice } from '@/lib/types'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<ClientInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<ToastMessage | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    setLoading(true)
    try {
      const res = await fetch('/api/invoices')
      const data = await res.json()
      if (data.invoices) {
        setInvoices(data.invoices)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = invoices.filter(inv =>
    inv.client_name.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    inv.client_phone.includes(search)
  )

  const totalBilled = invoices.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0)
  const totalPending = totalBilled - totalPaid

  function handleSendWhatsApp(inv: ClientInvoice) {
    const cleanPhone = inv.client_phone.replace(/[^\d]/g, '')
    const msg = `Hi ${inv.client_name}! Sharing your SynchAD Tech Invoice (${inv.invoice_number}) for ${inv.installment_label}:

💵 Amount Due: ₹${inv.amount.toLocaleString()}
📅 Due Date: ${inv.due_date}
📌 Status: ${inv.status.toUpperCase()}

Please let us know once the transfer is completed. Thank you!`

    const isDesktop = typeof window !== 'undefined' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = isDesktop
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <>
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div className="p-5 md:p-8 max-w-[1440px] mx-auto space-y-7 animate-fade-in pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Milestone Invoices Ledger <Receipt className="text-emerald-500" size={24} />
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Create, track, print, and dispatch installment invoices for all closed agency client accounts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchInvoices}
              disabled={loading}
              className="btn btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-emerald-500' : 'text-emerald-500'} />
              Refresh Invoices
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="kpi-card kpi-card-green">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Total Invoiced Amount
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 font-mono tracking-tight">
              ₹{totalBilled.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">
              Across all milestone bills
            </p>
          </div>

          <div className="kpi-card kpi-card-blue">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Realized Paid Invoices
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300 font-mono tracking-tight">
              ₹{totalPaid.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">
              Settled into agency account
            </p>
          </div>

          <div className="kpi-card kpi-card-amber">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Outstanding Balance Due
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Clock size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300 font-mono tracking-tight">
              ₹{totalPending.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">
              Pending client clearance
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by invoice #, client name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Invoices Table */}
        <div className="rounded-3xl bg-white dark:bg-stone-900 border-2 border-slate-200 dark:border-stone-800 overflow-hidden shadow-xs">
          {filtered.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Receipt size={36} className="mx-auto text-slate-400" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No invoices recorded yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Open any client in <strong>Won Clients</strong> and click <strong>"Milestone Bill"</strong> to generate and dispatch your first official invoice!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-stone-800/60 border-b border-slate-200 dark:border-stone-800 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4 pl-6">Invoice #</th>
                    <th className="p-4">Client Business</th>
                    <th className="p-4">Milestone</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Issue Date</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-stone-800 font-medium">
                  {filtered.map((inv) => (
                    <tr key={inv.invoice_number} className="hover:bg-slate-50/60 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {inv.invoice_number}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {inv.client_name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {inv.client_phone}
                        </p>
                      </td>
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                        {inv.installment_label}
                      </td>
                      <td className="p-4 font-mono font-black text-slate-900 dark:text-white">
                        ₹{inv.amount.toLocaleString()}
                      </td>
                      <td className="p-4 text-slate-500">
                        {inv.issue_date}
                      </td>
                      <td className="p-4 text-slate-500">
                        {inv.due_date}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendWhatsApp(inv)}
                            className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                            title="Send on WhatsApp"
                          >
                            <MessageSquare size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
