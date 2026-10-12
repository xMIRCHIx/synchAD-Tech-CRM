'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  X, Printer, Check, MessageSquare, Receipt,
  Plus, Trash2, Building, Phone, MapPin, Sparkles, Upload,
  CheckCircle2, Clock, AlertTriangle, CreditCard, Banknote, ShieldCheck,
  ChevronRight, ArrowRight, Copy
} from 'lucide-react'
import type { Lead, ClientInvoice, AgencyProfile } from '@/lib/types'
import { useData } from '@/context/DataContext'

interface InvoiceModalProps {
  lead?: Lead | null
  initialInvoice?: ClientInvoice | null
  isOpen: boolean
  onClose: () => void
  dealData?: {
    deal_value?: number
    advance_paid?: number
    balance_due?: number
    currency?: string
    service_type?: string
  }
  onInvoiceCreated?: (invoice: ClientInvoice) => void
}

interface LineItem {
  id: string
  description: string
  details?: string
  quantity: number
  rate: number
  amount: number
}

const DEFAULT_AGENCY: AgencyProfile = {
  name: 'SynchAD Tech',
  representative: 'Aryan Gupta',
  email: 'contact@synchadtech.com',
  phone: '+91 70675 49982',
  address: 'Commercial Tower, Sector 62, Noida, UP, India',
  logo_url: '',
  gstin: '07AAACS1429B1Z8',
  upi_id: 'synchadtech@okhdfcbank',
  bank_name: 'HDFC Bank',
  account_number: '50200084928192',
  ifsc_code: 'HDFC0001234'
}

export default function InvoiceModal({
  lead,
  initialInvoice,
  isOpen,
  onClose,
  dealData,
  onInvoiceCreated
}: InvoiceModalProps) {
  const { leads } = useData()

  // Agency branding profile
  const [agency, setAgency] = useState<AgencyProfile>(DEFAULT_AGENCY)

  // Client Selection
  const [clientMode, setClientMode] = useState<'existing' | 'custom'>(lead ? 'existing' : 'custom')
  const [selectedLeadId, setSelectedLeadId] = useState<string>(lead?.id || '')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientAddress, setClientAddress] = useState('')

  // Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-001')
  const [issueDate, setIssueDate] = useState('2026-10-12')
  const [dueDate, setDueDate] = useState('2026-10-19')
  const [invoiceStatus, setInvoiceStatus] = useState<'paid' | 'unpaid' | 'overdue'>('paid')
  const [paymentMode, setPaymentMode] = useState('UPI / Net Banking')
  const [currency] = useState<'INR' | 'USD'>((dealData?.currency as any) || 'INR')
  const symbol = currency === 'INR' ? '₹' : '$'

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    {
      id: 'item-1',
      description: dealData?.service_type || 'Custom Website Development (Full Stack)',
      details: 'High-speed Next.js SSR architecture, mobile responsive layout, and 1-tap WhatsApp booking flow.',
      quantity: 1,
      rate: dealData?.advance_paid || 17500,
      amount: dealData?.advance_paid || 17500
    }
  ])
  const [taxPercent, setTaxPercent] = useState<number>(0)
  const [discount, setDiscount] = useState<number>(0)
  const [notes, setNotes] = useState('Thank you for partnering with SynchAD Tech. 30 days complimentary warranty included.')

  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [copiedUpi, setCopiedUpi] = useState(false)

  // Load Agency Profile from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('synchad_agency_profile')
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile)
          setAgency(prev => ({ ...prev, ...parsed }))
        } catch {}
      }
    }
  }, [isOpen])

  // Sync client details when lead is passed or selected
  useEffect(() => {
    if (initialInvoice) {
      setClientName(initialInvoice.client_name || '')
      setClientPhone(initialInvoice.client_phone || '')
      setClientAddress(initialInvoice.client_address || '')
      setClientMode('custom')
    } else if (lead) {
      setClientName(lead.business_name || lead.owner_name || '')
      setClientPhone(lead.phone || '')
      setClientAddress(lead.address || '')
      setSelectedLeadId(lead.id)
      setClientMode('existing')
    } else if (selectedLeadId) {
      const found = leads.find(l => l.id === selectedLeadId)
      if (found) {
        setClientName(found.business_name || found.owner_name || '')
        setClientPhone(found.phone || '')
        setClientAddress(found.address || '')
      }
    }
  }, [initialInvoice, lead, selectedLeadId, leads])

  // Set invoice details on open
  useEffect(() => {
    if (isOpen) {
      if (initialInvoice) {
        setInvoiceNumber(initialInvoice.invoice_number)
        setIssueDate(initialInvoice.issue_date || new Date().toISOString().split('T')[0])
        setDueDate(initialInvoice.due_date || new Date().toISOString().split('T')[0])
        const validStatus: 'paid' | 'unpaid' | 'overdue' =
          initialInvoice.status === 'paid'
            ? 'paid'
            : initialInvoice.status === 'overdue'
            ? 'overdue'
            : 'unpaid'
        setInvoiceStatus(validStatus)
        setClientName(initialInvoice.client_name || '')
        setClientPhone(initialInvoice.client_phone || '')
        setClientAddress(initialInvoice.client_address || '')
        if (initialInvoice.items && Array.isArray(initialInvoice.items) && initialInvoice.items.length > 0) {
          setItems(initialInvoice.items.map((it, idx) => ({
            id: it.id || `item-${idx + 1}`,
            description: it.description || 'Deliverable',
            details: it.details || '',
            quantity: Number(it.quantity) || 1,
            rate: Number(it.rate) || 0,
            amount: Number(it.amount) || 0
          })))
        } else {
          const itemAmt = Number(initialInvoice.total_amount ?? initialInvoice.amount) || 0
          setItems([{
            id: 'item-1',
            description: 'Software & Technology Services',
            details: 'Digital solutions, architecture and development.',
            quantity: 1,
            rate: itemAmt,
            amount: itemAmt
          }])
        }
        setTaxPercent(Number(initialInvoice.tax_percent) || 0)
        setDiscount(Number(initialInvoice.discount) || 0)
        setNotes(initialInvoice.notes || 'Thank you for partnering with SynchAD Tech. 30 days complimentary warranty included.')
      } else {
        const now = new Date()
        setInvoiceNumber(`INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
        setIssueDate(now.toISOString().split('T')[0])
        const due = new Date(now.getTime() + 7 * 86400000)
        setDueDate(due.toISOString().split('T')[0])
      }
    }
  }, [isOpen, initialInvoice])

  if (!isOpen) return null

  // Line item helpers
  const handleUpdateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'rate') {
          updated.amount = (Number(updated.quantity) || 0) * (Number(updated.rate) || 0)
        }
        return updated
      }
      return item
    }))
  }

  const handleAddItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: 'Additional Feature Deliverable / Domain & Hosting',
      details: 'Cloud hosting setup, custom domain SSL linkage, and automated DNS routing.',
      quantity: 1,
      rate: 3500,
      amount: 3500
    }
    setItems(prev => [...prev, newItem])
  }

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id))
    }
  }

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const url = reader.result as string
        setAgency(prev => {
          const updated = { ...prev, logo_url: url }
          if (typeof window !== 'undefined') {
            localStorage.setItem('synchad_agency_profile', JSON.stringify(updated))
          }
          return updated
        })
      }
      reader.readAsDataURL(file)
    }
  }

  // Computations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const taxAmount = (subtotal * (Number(taxPercent) || 0)) / 100
  const grandTotal = Math.max(0, subtotal + taxAmount - (Number(discount) || 0))

  async function handleSaveInvoice() {
    if (!clientName.trim()) {
      alert('Please specify a client name.')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId || null,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          clientAddress: clientAddress.trim(),
          amount: grandTotal,
          installmentLabel: items[0]?.description || 'Milestone Bill',
          dueDate,
          items,
          notes,
          paymentMode,
          status: invoiceStatus
        })
      })

      const data = await res.json()
      if (res.ok && data.invoice) {
        setIsSaved(true)
        if (onInvoiceCreated) {
          onInvoiceCreated(data.invoice)
        }
        setTimeout(() => setIsSaved(false), 3000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  function handleSendWhatsApp() {
    const cleanPhone = clientPhone.replace(/[^\d]/g, '')
    if (!cleanPhone) {
      alert('Please enter a valid client phone number for WhatsApp dispatch.')
      return
    }

    const itemSummary = items.map(i => `• ${i.description}: ${symbol}${Number(i.amount).toLocaleString()}`).join('\n')

    const msg = `Hi ${clientName}! Sharing your official invoice from ${agency.name}:

🧾 Invoice: ${invoiceNumber}
📅 Date: ${issueDate} (Due: ${dueDate})
📌 Status: ${invoiceStatus.toUpperCase()}

📋 Deliverables:
${itemSummary}
${taxAmount > 0 ? `Tax (${taxPercent}%): ${symbol}${taxAmount.toLocaleString()}\n` : ''}${discount > 0 ? `Discount: -${symbol}${discount.toLocaleString()}\n` : ''}
💵 Grand Total: ${symbol}${grandTotal.toLocaleString()}

🏦 Payment Instructions:
• UPI ID: ${agency.upi_id || 'synchadtech@okhdfcbank'}
• Bank: ${agency.bank_name || 'HDFC Bank'} | A/C: ${agency.account_number || 'N/A'} (IFSC: ${agency.ifsc_code || 'N/A'})

Thank you for choosing ${agency.name}!`

    const isDesktop = typeof window !== 'undefined' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = isDesktop
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  function handleCopyUpi() {
    if (agency.upi_id) {
      navigator.clipboard.writeText(agency.upi_id)
      setCopiedUpi(true)
      setTimeout(() => setCopiedUpi(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fade-in" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer print:hidden" onClick={onClose} />

      {/* Main Studio Container */}
      <div className="relative w-full max-w-[1340px] h-[95vh] max-h-[940px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 print:fixed print:inset-0 print:h-auto print:max-h-none print:w-full print:border-none print:shadow-none print:rounded-none print:bg-white">

        {/* Studio Top Bar */}
        <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-4 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Receipt size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white tracking-tight">
                  Invoice Builder Studio
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                  {invoiceNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Live side-by-side builder with realistic printable A4 fee receipt & tax invoice preview.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSaveInvoice}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              {isSaved ? <Check size={14} className="text-emerald-400" /> : <CheckCircle2 size={14} />}
              {isSaved ? 'Saved!' : isSaving ? 'Saving...' : 'Save to Ledger'}
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm shadow-indigo-500/25 transition-colors cursor-pointer"
            >
              <Printer size={14} />
              Print / Save PDF
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ea952] text-xs font-bold text-white flex items-center gap-1.5 shadow-sm shadow-emerald-500/25 transition-colors cursor-pointer"
            >
              <MessageSquare size={14} />
              Send on WhatsApp
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2-Column Split Studio Body */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden print:block">

          {/* LEFT COLUMN: Controls & Input Forms (40% width, scrollable) */}
          <div className="w-full lg:w-[460px] border-r border-slate-800 overflow-y-auto p-5 space-y-5 bg-slate-950/60 print:hidden text-xs">

            {/* 1. Client Information Box */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Building size={13} className="text-indigo-400" /> 1. Client Details
                </span>

                {!lead && (
                  <div className="flex rounded-lg bg-slate-800 p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setClientMode('existing')}
                      className={`px-2 py-0.5 rounded-md ${clientMode === 'existing' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      From CRM
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientMode('custom')}
                      className={`px-2 py-0.5 rounded-md ${clientMode === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Custom Client
                    </button>
                  </div>
                )}
              </div>

              {!lead && clientMode === 'existing' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Pick CRM Lead:</label>
                  <select
                    value={selectedLeadId}
                    onChange={e => setSelectedLeadId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold outline-none"
                  >
                    <option value="">-- Choose Lead --</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.business_name} ({l.phone})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Client / Business Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Batra Dental Care"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">WhatsApp / Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-xs font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold outline-none"
                    >
                      <option value="UPI / Online">UPI / QR Code</option>
                      <option value="Bank NEFT / RTGS">Bank NEFT / IMPS</option>
                      <option value="Cash Payment">Cash Payment</option>
                      <option value="Credit / Debit Card">Credit / Debit Card</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400">Billing Address</label>
                  <textarea
                    rows={2}
                    placeholder="Full client address..."
                    value={clientAddress}
                    onChange={e => setClientAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-medium outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Invoice Meta & Status */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="font-extrabold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Receipt size={13} className="text-emerald-400" /> 2. Invoice Meta & Status
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Invoice #</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={e => setIssueDate(e.target.value)}
                    className="w-full px-1.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-xs font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-1.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-xs font-semibold outline-none text-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Receipt Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'paid', label: 'Paid / Settled', color: 'border-emerald-500 bg-emerald-950/60 text-emerald-300' },
                    { id: 'unpaid', label: 'Payment Due', color: 'border-amber-500 bg-amber-950/60 text-amber-300' },
                    { id: 'overdue', label: 'Overdue', color: 'border-rose-500 bg-rose-950/60 text-rose-300' },
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setInvoiceStatus(st.id as any)}
                      className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all text-center ${
                        invoiceStatus === st.id
                          ? st.color + ' ring-1 ring-white/20'
                          : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Line Items & Services Box */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={13} className="text-purple-400" /> 3. Billable Items ({items.length})
                </span>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus size={11} /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2 relative group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleUpdateItem(item.id, 'description', e.target.value)}
                          placeholder="Service name / deliverable..."
                          className="w-full bg-transparent text-white font-bold text-xs outline-none border-b border-slate-700 pb-1"
                        />
                        <input
                          type="text"
                          value={item.details || ''}
                          onChange={e => handleUpdateItem(item.id, 'details', e.target.value)}
                          placeholder="Subtitle note / inclusions..."
                          className="w-full bg-transparent text-slate-400 text-[10px] outline-none"
                        />
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">Quantity / Months</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono text-xs font-semibold outline-none"
                        />
                      </div>

                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">Rate / Price ({symbol})</span>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={e => handleUpdateItem(item.id, 'rate', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tax & Discount */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <div>
                  <label className="text-[10px] font-bold text-slate-400">GST / Tax Rate</label>
                  <select
                    value={taxPercent}
                    onChange={e => setTaxPercent(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-bold outline-none"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400">Discount ({symbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. Agency Logo & Branding */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="font-extrabold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" /> 4. Agency Logo & Bank Remittance
              </span>

              <div className="flex items-center gap-3">
                {agency.logo_url ? (
                  <img
                    src={agency.logo_url}
                    alt="Logo"
                    className="w-12 h-12 object-contain rounded-xl border border-slate-700 bg-white p-1"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-dashed border-slate-700 flex items-center justify-center text-slate-400 text-[10px] font-bold">
                    No Logo
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer border border-slate-700 transition-colors">
                    <Upload size={12} /> Upload Agency Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  <p className="text-[10px] text-slate-400">PNG/JPG logo prints on official receipt.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-400 block font-semibold">UPI ID:</span>
                  <input
                    type="text"
                    value={agency.upi_id || ''}
                    onChange={e => setAgency({ ...agency, upi_id: e.target.value })}
                    className="w-full px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-white font-mono text-xs outline-none"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Bank Name:</span>
                  <input
                    type="text"
                    value={agency.bank_name || ''}
                    onChange={e => setAgency({ ...agency, bank_name: e.target.value })}
                    className="w-full px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-white text-xs outline-none"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Real-Time Live Printable Receipt (Matching Sample Design) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/40 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
            
            {/* The Formal White Paper Invoice Canvas (A4 Aspect Ratio Polish) */}
            <div className="w-full max-w-[720px] bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:rounded-none space-y-6">

              {/* 1. Header (Left: Logo & Agency, Center: Pill Code, Right: Tax Invoice & Meta) */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-100">
                
                {/* Agency Brand & Coordinates */}
                <div className="flex items-start gap-3.5 max-w-sm">
                  {agency.logo_url ? (
                    <img
                      src={agency.logo_url}
                      alt={agency.name}
                      className="w-14 h-14 object-contain rounded-xl border border-slate-200 bg-white p-1 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-700 to-purple-700 text-white font-black flex items-center justify-center text-xl shrink-0 shadow-sm">
                      {agency.name.charAt(0)}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      {agency.name}
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Autonomous AI & Web Solutions
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium leading-tight pt-1">
                      {agency.address}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Phone: {agency.phone}
                    </p>
                  </div>
                </div>

                {/* Center Badge Pill (Like Sample: MSL0101) */}
                <div className="hidden sm:flex flex-col items-center justify-center px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Official Reference
                  </span>
                  <span className="text-sm font-black font-mono text-indigo-700 tracking-wider">
                    {invoiceNumber}
                  </span>
                </div>

                {/* Right: Invoice Type, Date & Status Badge */}
                <div className="text-left sm:text-right space-y-1">
                  <span className="text-xl font-black uppercase tracking-tight text-slate-900 block font-mono">
                    FEE RECEIPT
                  </span>

                  <div className="text-xs space-y-0.5 font-medium text-slate-600">
                    <div><span className="text-slate-400 text-[10px] font-bold">DATE:</span> <span className="font-mono font-bold text-slate-800">{issueDate}</span></div>
                    <div><span className="text-slate-400 text-[10px] font-bold">DUE DATE:</span> <span className="font-mono font-bold text-rose-600">{dueDate}</span></div>
                  </div>

                  {/* Status Badge */}
                  <div className="pt-1.5">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      invoiceStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : invoiceStatus === 'overdue'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {invoiceStatus === 'paid' ? '● FULLY SETTLED' : invoiceStatus === 'overdue' ? '▲ OVERDUE' : '⏳ PAYMENT DUE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Client & Project Details Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Billed To Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Billed To:
                  </span>
                  <h3 className="text-sm font-black text-slate-900">
                    {clientName || 'Valued Client'}
                  </h3>
                  <p className="text-slate-600 font-mono text-[11px] font-semibold">
                    Phone: {clientPhone || 'Not Listed'}
                  </p>
                  {clientAddress && (
                    <p className="text-slate-500 text-[11px] leading-snug pt-0.5">
                      {clientAddress}
                    </p>
                  )}
                </div>

                {/* Subscription / Deal Info Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-right sm:text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Engagement Details:
                  </span>
                  <p className="text-xs font-bold text-indigo-700">
                    {items[0]?.description || 'Custom Web & AI Deployment'}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Payment Mode: <strong className="text-slate-800">{paymentMode}</strong>
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">
                    Currency: {currency} ({symbol})
                  </p>
                </div>
              </div>

              {/* 3. Line Items Table (Clean, Sharp, High Contrast) */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-center w-24">Item / Qty</th>
                      <th className="py-3 px-4 text-right w-32">Amount ({symbol})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <p className="font-black text-slate-900 text-xs">
                            {item.description}
                          </p>
                          {item.details && (
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {item.details}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                          {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-xs">
                          {symbol}{Number(item.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. Settlement Box & Totals Summary (Matching Sample) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-1">
                
                {/* Left: Settlement Card & Remittance Info */}
                <div className="space-y-3">
                  {invoiceStatus === 'paid' ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Check size={13} />
                      </div>
                      <div className="text-xs">
                        <span className="font-black text-emerald-900 uppercase tracking-wide block">
                          Fully Settled
                        </span>
                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5 leading-tight">
                          All dues for this milestone have been fully cleared and verified via {paymentMode}.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Clock size={13} />
                      </div>
                      <div className="text-xs">
                        <span className="font-black text-amber-900 uppercase tracking-wide block">
                          Payment Due
                        </span>
                        <p className="text-[11px] text-amber-700 font-medium mt-0.5 leading-tight">
                          Please remit due payment before <strong>{dueDate}</strong> using the UPI/Bank details below.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Remittance Credentials */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-indigo-700 font-bold">
                      <span>UPI: {agency.upi_id}</span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="text-[10px] text-indigo-600 hover:underline print:hidden cursor-pointer"
                      >
                        {copiedUpi ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-slate-600">
                      Bank: {agency.bank_name} • A/C: {agency.account_number}
                    </div>
                    <div className="text-slate-500 text-[10px]">
                      IFSC: {agency.ifsc_code} {agency.gstin ? `• GSTIN: ${agency.gstin}` : ''}
                    </div>
                  </div>
                </div>

                {/* Right: Totals Ledger Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Base Amount / Subtotal:</span>
                    <span className="font-mono font-bold text-slate-800">{symbol}{subtotal.toLocaleString()}</span>
                  </div>

                  {taxAmount > 0 && (
                    <div className="flex justify-between items-center text-slate-600 font-medium">
                      <span>GST / Tax ({taxPercent}%):</span>
                      <span className="font-mono text-slate-800">+{symbol}{taxAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {discount > 0 && (
                    <div className="flex justify-between items-center text-emerald-700 font-medium">
                      <span>Special Discount:</span>
                      <span className="font-mono">-{symbol}{discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2.5 border-t-2 border-slate-200">
                    <span className="text-sm font-black text-slate-900 uppercase">
                      Total Invoiced:
                    </span>
                    <span className="font-mono text-xl font-black text-indigo-700">
                      {symbol}{grandTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500 font-medium">
                    <span>Amount Paid:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {invoiceStatus === 'paid' ? `${symbol}${grandTotal.toLocaleString()}` : `${symbol}0.00`}
                    </span>
                  </div>
                </div>

              </div>

              {/* 5. Terms & Signatures Footer */}
              <div className="pt-6 border-t border-slate-200 text-slate-600 space-y-4">
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                  <strong>Notes & Terms:</strong> {notes}
                </p>

                <div className="flex justify-between items-end pt-4 text-xs font-semibold">
                  <div>
                    <div className="border-b border-slate-400 w-40 mb-1"></div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                      Customer Signature
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="border-b border-slate-400 w-40 ml-auto mb-1"></div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                      For {agency.name} (Authorized)
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
