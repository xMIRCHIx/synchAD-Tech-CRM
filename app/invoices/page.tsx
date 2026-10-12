'use client'

import React, { useState, useEffect } from 'react'
import {
  Receipt, Plus, Printer, MessageSquare, Search, RefreshCw, CheckCircle2,
  Clock, AlertTriangle, DollarSign, Download, ExternalLink, ArrowUpRight,
  Trash2, Phone, Calendar, User, Eye
} from 'lucide-react'
import Toast, { ToastMessage } from '@/components/Toast'
import InvoiceModal from '@/components/InvoiceModal'
import type { ClientInvoice } from '@/lib/types'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<ClientInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all')
  const [toast, setToast] = useState<ToastMessage | null>(null)

  // Invoice Modal states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [activeInvoice, setActiveInvoice] = useState<ClientInvoice | null>(null)

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

  async function handleUpdateStatus(idOrNum: string, newStatus: string) {
    try {
      const res = await fetch('/api/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idOrNum, status: newStatus })
      })
      if (res.ok) {
        setInvoices(prev => prev.map(inv =>
          (inv.id === idOrNum || inv.invoice_number === idOrNum) ? { ...inv, status: newStatus as any } : inv
        ))
        setToast({
          id: Date.now().toString(),
          title: 'Invoice Updated',
          description: `Invoice marked as ${newStatus.toUpperCase()}`,
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

  async function handleDeleteInvoice(inv: ClientInvoice) {
    if (!confirm(`Are you sure you want to delete invoice ${inv.invoice_number}?`)) return
    try {
      const res = await fetch(`/api/invoices?id=${inv.id || ''}&invoice_number=${inv.invoice_number}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setInvoices(prev => prev.filter(i => i.invoice_number !== inv.invoice_number))
        setToast({
          id: Date.now().toString(),
          title: 'Invoice Deleted',
          description: `${inv.invoice_number} has been removed.`,
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

  function handleSendWhatsApp(inv: ClientInvoice) {
    const cleanPhone = (inv.client_phone || '').replace(/[^\d]/g, '')
    if (!cleanPhone) {
      alert('No valid phone number listed for this invoice.')
      return
    }

    const msg = `Hi ${inv.client_name}! Sharing your SynchAD Tech Invoice (${inv.invoice_number}) for ${inv.installment_label}:

💵 Amount Due: ₹${Number(inv.amount).toLocaleString()}
📅 Due Date: ${inv.due_date}
📌 Status: ${inv.status.toUpperCase()}

Please let us know once the payment is completed. Thank you!`

    const isDesktop = typeof window !== 'undefined' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = isDesktop
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      inv.client_name?.toLowerCase().includes(q) ||
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.client_phone?.includes(q)

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalBilled = invoices.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0)
  const totalPending = totalBilled - totalPaid

  return (
    <>
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Invoice Generator Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false)
          setActiveInvoice(null)
        }}
        onInvoiceCreated={(newInv) => {
          setInvoices(prev => [newInv, ...prev.filter(i => i.invoice_number !== newInv.invoice_number)])
          setIsInvoiceModalOpen(false)
          setToast({
            id: Date.now().toString(),
            title: 'Invoice Created',
            description: `Invoice ${newInv.invoice_number} saved to records.`,
            type: 'success'
          })
        }}
      />

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
              Create, track, print, and dispatch installment invoices for all closed accounts or direct custom clients.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="btn btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/25 cursor-pointer"
            >
              <Plus size={14} /> Create Custom Invoice
            </button>

            <button
              onClick={fetchInvoices}
              disabled={loading}
              className="btn btn-secondary px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-emerald-500' : 'text-emerald-500'} />
              Refresh
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
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign size={14} />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              ₹{totalBilled.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              Across all milestone bills
            </div>
          </div>

          <div className="kpi-card kpi-card-blue">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Realized Paid Invoices
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              ₹{totalPaid.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              Settled into agency account
            </div>
          </div>

          <div className="kpi-card kpi-card-amber">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Outstanding Balance Due
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock size={14} />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              ₹{totalPending.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              Pending client clearance
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by invoice #, client name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">All Statuses ({invoices.length})</option>
              <option value="unpaid">Unpaid / Due</option>
              <option value="paid">Paid / Settled</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="hkb-table-wrapper">
          <div className="hkb-custom-slider">
            <table className="hkb-table min-w-[980px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 font-black">
                  <th>Invoice & Date</th>
                  <th>Client Details</th>
                  <th>Installment / Scope</th>
                  <th>Amount (INR)</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-xs text-slate-500 font-bold">
                      <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-emerald-500" />
                      Loading invoice ledger...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500 font-bold space-y-3">
                      <Receipt size={36} className="mx-auto text-slate-400 opacity-60" />
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {invoices.length === 0 ? 'No invoices recorded yet' : 'No invoices match your filter'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Create your first custom invoice or generate milestone bills directly for any closed client.
                      </p>
                      {invoices.length === 0 && (
                        <button
                          onClick={() => setIsInvoiceModalOpen(true)}
                          className="btn btn-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-indigo-500/25 cursor-pointer mt-2"
                        >
                          <Plus size={14} /> Create Your First Invoice
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => (
                    <tr key={inv.id || inv.invoice_number} className="hover:bg-slate-50 dark:hover:bg-stone-800/40 transition-colors">
                      {/* Invoice & Date */}
                      <td>
                        <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs">
                          {inv.invoice_number}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Issued: {inv.issue_date || 'Today'}
                        </div>
                        {inv.due_date && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                            Due: {inv.due_date}
                          </div>
                        )}
                      </td>

                      {/* Client Details */}
                      <td>
                        <div className="font-black text-slate-900 dark:text-white text-xs">
                          {inv.client_name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <Phone size={10} className="text-emerald-500" />
                          <span>{inv.client_phone || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Installment / Scope */}
                      <td className="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[220px]">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">
                          {inv.installment_label}
                        </span>
                        {inv.items && inv.items.length > 0 && (
                          <span className="text-[10px] text-slate-500 block truncate">
                            {inv.items[0]?.description} {inv.items.length > 1 ? `(+${inv.items.length - 1} more)` : ''}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td>
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                          ₹{Number(inv.amount).toLocaleString()}
                        </span>
                      </td>

                      {/* Status Selector */}
                      <td>
                        <select
                          value={inv.status}
                          onChange={(e) => handleUpdateStatus(inv.id || inv.invoice_number, e.target.value)}
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
                              : inv.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700'
                              : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700'
                          }`}
                        >
                          <option value="unpaid" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Unpaid / Due</option>
                          <option value="paid" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Paid 💰</option>
                          <option value="overdue" className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-slate-100 font-bold">Overdue ⚠️</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendWhatsApp(inv)}
                            className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 cursor-pointer"
                            title="Dispatch on WhatsApp"
                          >
                            <MessageSquare size={13} />
                          </button>

                          <button
                            onClick={() => handleDeleteInvoice(inv)}
                            className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 cursor-pointer"
                            title="Delete Invoice"
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
