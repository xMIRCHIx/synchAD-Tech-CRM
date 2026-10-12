'use client'

import React, { useState, useEffect } from 'react'
import {
  X, Printer, Copy, Check, MessageSquare, Receipt,
  Plus, Trash2, ArrowRight, DollarSign, Calendar
} from 'lucide-react'
import type { Lead } from '@/lib/types'

interface InvoiceModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  dealData?: {
    deal_value: number
    advance_paid: number
    balance_due: number
    currency: string
    service_type: string
  }
}

export default function InvoiceModal({
  lead,
  isOpen,
  onClose,
  dealData
}: InvoiceModalProps) {
  if (!isOpen || !lead) return null

  const currency = dealData?.currency || 'INR'
  const symbol = currency === 'INR' ? '₹' : '$'
  const clientName = lead.owner_name || lead.business_name

  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-1001')
  const [issueDate, setIssueDate] = useState('2026-10-12')
  const [dueDate, setDueDate] = useState('2026-10-19')
  const [installmentLabel, setInstallmentLabel] = useState('50% Mobilization Deposit / Advance')
  const [amount, setAmount] = useState<number>(dealData?.advance_paid || 17500)
  const [notes, setNotes] = useState('Payment Due upon receipt. Thank you for partnering with SynchAD Tech!')
  const [copied, setCopied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      setInvoiceNumber(`INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
      setIssueDate(now.toISOString().split('T')[0])
      const due = new Date(now.getTime() + 7 * 86400000)
      setDueDate(due.toISOString().split('T')[0])
    }
  }, [isOpen])

  async function handleSaveInvoice() {
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead?.id,
          clientName: lead?.business_name,
          clientPhone: lead?.phone,
          clientAddress: lead?.address,
          amount,
          installmentLabel,
          dueDate,
          notes
        })
      })
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  function handlePrint() {
    window.print()
  }

  function handleSendWhatsApp() {
    const cleanPhone = (lead?.phone || '').replace(/[^\d]/g, '')
    const msg = `Hi ${clientName}! Here is your official Milestone Invoice from SynchAD Tech:

🧾 Invoice Number: ${invoiceNumber}
💼 Deliverable: ${dealData?.service_type || 'Custom Website Development'}
📌 Milestone: ${installmentLabel}
💵 Amount Due: ${symbol}${amount.toLocaleString()} ${currency}
📅 Due Date: ${dueDate}

Payment via UPI / Bank Transfer is accepted. Please let us know once transferred so we can issue your payment receipt!`

    const isDesktop = typeof window !== 'undefined' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = isDesktop
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fade-in" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl h-[92vh] max-h-[850px] bg-white dark:bg-[#161B22] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-stone-800 flex flex-col overflow-hidden z-10 print:fixed print:inset-0 print:h-auto print:max-h-none print:w-full print:border-none print:shadow-none print:rounded-none">

        {/* Top Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-stone-800 bg-slate-50/95 dark:bg-[#1C2128] flex items-center justify-between gap-4 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Receipt size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Milestone Invoice Studio
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold">
                  {invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official Bill of Supply for <strong>{lead.business_name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Action Toolbar */}
        <div className="p-3 sm:px-6 border-b border-slate-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#161B22] shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveInvoice}
              className="btn btn-secondary py-2 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer text-indigo-700 dark:text-indigo-300"
            >
              {isSaved ? <Check size={13} className="text-emerald-600" /> : <Receipt size={13} />}
              {isSaved ? 'Saved to Records!' : 'Save Invoice'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn btn-secondary py-2 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer text-indigo-700 dark:text-indigo-300"
            >
              <Printer size={13} />
              Print / Save PDF
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="btn bg-[#25D366] hover:bg-[#1ea952] text-white py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <MessageSquare size={13} />
              Send Invoice WA
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 md:p-10 bg-slate-100 dark:bg-[#0D1117] print:bg-white print:p-0">
          <div className="max-w-[700px] mx-auto bg-white dark:bg-stone-900 shadow-xl border border-slate-200 dark:border-stone-800 rounded-3xl p-6 sm:p-10 text-slate-900 dark:text-slate-100 print:shadow-none print:border-none print:p-0 space-y-6">

            {/* Letterhead */}
            <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-200 dark:border-stone-800">
              <div>
                <span className="text-xl font-black text-indigo-700 dark:text-indigo-400 block tracking-tight">
                  SynchAD Tech
                </span>
                <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                  Autonomous AI & Web Solutions
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 block mt-2 font-mono">
                  UPI: synchadtech@okhdfcbank
                </span>
              </div>

              <div className="text-right">
                <span className="text-xl font-black tracking-wider uppercase text-slate-900 dark:text-white block">
                  INVOICE
                </span>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 block mt-1">
                  #{invoiceNumber}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 block mt-1">
                  Date: {issueDate}
                </span>
              </div>
            </div>

            {/* Bill To & Due Date Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-800/50 border border-slate-200 dark:border-stone-700 space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400 block">
                  Billed To (Client):
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {lead.business_name}
                </p>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  Attn: {clientName}
                </p>
                <p className="text-slate-500 font-mono">
                  {lead.phone}
                </p>
                {lead.address && (
                  <p className="text-slate-500 text-[11px]">
                    {lead.address}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-800/50 border border-slate-200 dark:border-stone-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                    Payment Due:
                  </span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-xs font-semibold print:border-none"
                  />
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-stone-700">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                    Milestone Stage:
                  </span>
                  <input
                    type="text"
                    value={installmentLabel}
                    onChange={(e) => setInstallmentLabel(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-xs font-bold text-right print:border-none"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-stone-800 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-stone-800 border-b border-slate-200 dark:border-stone-800 font-extrabold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-3 sm:px-4">Description</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Amount ({symbol})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-stone-800 font-medium">
                  <tr>
                    <td className="p-3 sm:px-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {dealData?.service_type || 'Custom Website Development + WhatsApp Integration'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {installmentLabel}
                      </p>
                    </td>
                    <td className="p-3 text-right font-mono">1</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="font-bold">{symbol}</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(Number(e.target.value))}
                          className="w-24 px-2 py-1 rounded-lg border border-slate-300 dark:border-stone-600 text-right font-mono font-bold text-xs bg-white dark:bg-stone-900 print:border-none"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-2 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">{symbol}{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Tax / GST:</span>
                  <span className="font-mono">₹0.00 (Exempt)</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-indigo-200 dark:border-indigo-800 text-sm font-black text-indigo-950 dark:text-white">
                  <span>Total Due:</span>
                  <span className="font-mono text-base text-indigo-700 dark:text-indigo-400">
                    {symbol}{amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment & Sign-off Notes */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-800/40 border border-slate-200 dark:border-stone-700 text-xs space-y-2">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 block">
                Payment Instructions:
              </span>
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                • Bank Transfer / IMPS / NEFT or direct UPI scan.
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-slate-700 dark:text-slate-300 print:border-none font-medium"
              />
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
