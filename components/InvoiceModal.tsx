'use client'

import React, { useState, useEffect } from 'react'
import {
  X, Printer, Check, MessageSquare, Receipt,
  Plus, Trash2, Building, Phone, MapPin, Sparkles, Upload
} from 'lucide-react'
import type { Lead, ClientInvoice, AgencyProfile } from '@/lib/types'
import { useData } from '@/context/DataContext'

interface InvoiceModalProps {
  lead?: Lead | null
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
  isOpen,
  onClose,
  dealData,
  onInvoiceCreated
}: InvoiceModalProps) {
  const { leads } = useData()

  // Agency branding profile
  const [agency, setAgency] = useState<AgencyProfile>(DEFAULT_AGENCY)

  // Client Selection (when lead is not provided)
  const [clientMode, setClientMode] = useState<'existing' | 'custom'>(lead ? 'existing' : 'custom')
  const [selectedLeadId, setSelectedLeadId] = useState<string>(lead?.id || '')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientAddress, setClientAddress] = useState('')

  // Invoice Meta
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-1001')
  const [issueDate, setIssueDate] = useState('2026-10-12')
  const [dueDate, setDueDate] = useState('2026-10-19')
  const [status, setStatus] = useState<'draft' | 'unpaid' | 'paid' | 'overdue'>('unpaid')
  const [currency] = useState<'INR' | 'USD'>((dealData?.currency as any) || 'INR')
  const symbol = currency === 'INR' ? '₹' : '$'
  const [paymentMode, setPaymentMode] = useState('upi')

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    {
      id: 'item-1',
      description: dealData?.service_type || 'Custom Website Development + WhatsApp Integration',
      quantity: 1,
      rate: dealData?.advance_paid || 17500,
      amount: dealData?.advance_paid || 17500
    }
  ])
  const [taxPercent, setTaxPercent] = useState<number>(0)
  const [discount, setDiscount] = useState<number>(0)
  const [notes, setNotes] = useState('Payment Due upon receipt. Thank you for partnering with us!')

  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

  // Sync client details from lead prop or selected lead
  useEffect(() => {
    if (lead) {
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
  }, [lead, selectedLeadId, leads])

  // Initialize fresh dates & invoice number when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      setInvoiceNumber(`INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
      setIssueDate(now.toISOString().split('T')[0])
      const due = new Date(now.getTime() + 7 * 86400000)
      setDueDate(due.toISOString().split('T')[0])
    }
  }, [isOpen])

  if (!isOpen) return null

  // Line item helpers
  const handleUpdateItem = (id: string, field: 'description' | 'quantity' | 'rate', value: any) => {
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
      description: 'Additional Milestone / Feature Deliverable',
      quantity: 1,
      rate: 5000,
      amount: 5000
    }
    setItems(prev => [...prev, newItem])
  }

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id))
    }
  }

  // Logo upload handler
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

  // Calculations
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
          paymentMode
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

    const itemSummary = items.map(i => `• ${i.description} (x${i.quantity}): ${symbol}${Number(i.amount).toLocaleString()}`).join('\n')

    const msg = `Hi ${clientName}! Sharing your official invoice from ${agency.name}:

🧾 Invoice: ${invoiceNumber}
📅 Date: ${issueDate} (Due: ${dueDate})

📋 Bill Breakdown:
${itemSummary}
${taxAmount > 0 ? `Tax (${taxPercent}%): ${symbol}${taxAmount.toLocaleString()}\n` : ''}${discount > 0 ? `Discount: -${symbol}${discount.toLocaleString()}\n` : ''}
💵 Total Amount Due: ${symbol}${grandTotal.toLocaleString()}

📌 Payment Options:
• UPI ID: ${agency.upi_id || 'synchadtech@okhdfcbank'}
• Bank: ${agency.bank_name || 'HDFC Bank'} | A/C: ${agency.account_number || 'N/A'} (IFSC: ${agency.ifsc_code || 'N/A'})

Please confirm once transferred so we can issue your payment receipt!`

    const isDesktop = typeof window !== 'undefined' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = isDesktop
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fade-in" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer" onClick={onClose} />

      <div className="relative w-full max-w-4xl h-[94vh] max-h-[920px] bg-white dark:bg-[#161B22] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-stone-800 flex flex-col overflow-hidden z-10 print:fixed print:inset-0 print:h-auto print:max-h-none print:w-full print:border-none print:shadow-none print:rounded-none">

        {/* Modal Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-stone-800 bg-slate-50/95 dark:bg-[#1C2128] flex items-center justify-between gap-4 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Receipt size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Invoice Studio & Generator
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold">
                  {invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Create official GST/Tax bills of supply with custom branding & 1-click WhatsApp delivery.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-3 sm:px-6 border-b border-slate-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#161B22] shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveInvoice}
              disabled={isSaving}
              className="btn btn-secondary py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50"
            >
              {isSaved ? <Check size={14} className="text-emerald-600" /> : <Receipt size={14} />}
              {isSaved ? 'Saved to Records!' : isSaving ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn btn-secondary py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer text-indigo-700 dark:text-indigo-300"
            >
              <Printer size={14} />
              Print / Save PDF
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="btn bg-[#25D366] hover:bg-[#1ea952] text-white py-2 px-4 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <MessageSquare size={14} />
              Send on WhatsApp
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-[#0D1117] print:bg-white print:p-0">
          <div className="max-w-[760px] mx-auto bg-white dark:bg-stone-900 shadow-xl border border-slate-200 dark:border-stone-800 rounded-3xl p-6 sm:p-10 text-slate-900 dark:text-slate-100 print:shadow-none print:border-none print:p-0 space-y-6">

            {/* Top Branding & Letterhead */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200 dark:border-stone-800">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  {agency.logo_url ? (
                    <img
                      src={agency.logo_url}
                      alt={agency.name}
                      className="w-12 h-12 object-contain rounded-xl border border-slate-200 dark:border-stone-700 bg-white"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
                      {agency.name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {agency.name}
                    </h1>
                    <span className="text-[11px] text-slate-500 font-semibold block">
                      Autonomous AI & Digital Engineering
                    </span>
                  </div>

                  {/* Logo upload shortcut */}
                  <label className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer print:hidden flex items-center gap-1 px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50/50">
                    <Upload size={11} /> Change Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium max-w-sm pt-1">
                  {agency.address}
                </p>
                <div className="text-[11px] text-slate-500 font-mono space-x-2">
                  <span>Phone: {agency.phone}</span>
                  {agency.gstin && <span>• GSTIN: {agency.gstin}</span>}
                </div>
              </div>

              {/* Invoice Meta Block */}
              <div className="text-left sm:text-right space-y-1">
                <span className="text-2xl font-black tracking-wider uppercase text-emerald-600 dark:text-emerald-400 block font-mono">
                  TAX INVOICE
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 block">
                  #{invoiceNumber}
                </span>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Date: </span>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="font-mono text-xs font-semibold bg-transparent border-none outline-none text-right"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Due: </span>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="font-mono text-xs font-semibold bg-transparent border-none outline-none text-right font-bold text-rose-600 dark:text-rose-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Client Info Selector & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-800/50 border border-slate-200 dark:border-stone-700 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-stone-700 print:hidden">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">
                    Billed To (Client):
                  </span>
                  {!lead && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setClientMode('existing')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${clientMode === 'existing' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                      >
                        From CRM
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientMode('custom')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${clientMode === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                      >
                        Custom Client
                      </button>
                    </div>
                  )}
                </div>

                {!lead && clientMode === 'existing' && (
                  <div className="print:hidden space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Select Lead / Client:</label>
                    <select
                      value={selectedLeadId}
                      onChange={e => setSelectedLeadId(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold"
                    >
                      <option value="">-- Choose Existing Lead --</option>
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.business_name} ({l.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    required
                    placeholder="Client Business Name / Client Full Name"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full text-sm font-black text-slate-900 dark:text-white bg-transparent border-b border-slate-200 dark:border-stone-700 pb-1 outline-none print:border-none"
                  />
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Phone size={12} className="text-emerald-500" />
                    <input
                      type="text"
                      placeholder="Client WhatsApp / Phone"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      className="font-mono text-xs font-semibold bg-transparent border-none outline-none w-full"
                    />
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-500 text-[11px]">
                    <MapPin size={12} className="text-indigo-500 shrink-0 mt-0.5" />
                    <textarea
                      rows={2}
                      placeholder="Billing Address (City, State, Pin Code)"
                      value={clientAddress}
                      onChange={e => setClientAddress(e.target.value)}
                      className="text-xs bg-transparent border-none outline-none w-full resize-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Details & Mode Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-800/50 border border-slate-200 dark:border-stone-700 space-y-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">
                  Remittance / Bank Instructions:
                </span>
                <div className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <p><strong className="text-indigo-600 dark:text-indigo-400">UPI ID:</strong> {agency.upi_id}</p>
                  <p><strong>Bank:</strong> {agency.bank_name}</p>
                  <p><strong>A/C No:</strong> {agency.account_number}</p>
                  <p><strong>IFSC:</strong> {agency.ifsc_code}</p>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-stone-700 flex items-center justify-between text-xs font-bold">
                  <span>Payment Mode:</span>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-xs font-bold capitalize"
                  >
                    <option value="upi">UPI / Instant Transfer</option>
                    <option value="bank_transfer">NEFT / RTGS / IMPS</option>
                    <option value="cash">Cash Settlement</option>
                    <option value="stripe">Card / Stripe</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Itemized Line Items Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-stone-800 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-stone-800 border-b border-slate-200 dark:border-stone-800 font-extrabold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-3 sm:px-4">Deliverable / Service Description</th>
                    <th className="p-3 text-center w-20">Qty</th>
                    <th className="p-3 text-right w-28">Rate ({symbol})</th>
                    <th className="p-3 text-right w-28">Total ({symbol})</th>
                    <th className="p-3 text-center w-12 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-stone-800 font-medium">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-stone-800/40">
                      <td className="p-3 sm:px-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleUpdateItem(item.id, 'description', e.target.value)}
                          className="w-full font-bold text-slate-900 dark:text-white bg-transparent border-none outline-none text-xs"
                          placeholder="Service description..."
                        />
                      </td>
                      <td className="p-3 text-center font-mono">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-12 text-center font-mono text-xs bg-transparent border border-slate-200 dark:border-stone-700 rounded-md py-0.5 print:border-none"
                        />
                      </td>
                      <td className="p-3 text-right font-mono">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={e => handleUpdateItem(item.id, 'rate', Number(e.target.value))}
                          className="w-24 text-right font-mono text-xs bg-transparent border border-slate-200 dark:border-stone-700 rounded-md py-0.5 px-1.5 print:border-none"
                        />
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {symbol}{(item.amount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-center print:hidden">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Remove line item"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-2.5 bg-slate-50/60 dark:bg-stone-800/40 border-t border-slate-200 dark:border-stone-800 print:hidden flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Add Line Item
                </button>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {items.length} Deliverable(s) listed
                </span>
              </div>
            </div>

            {/* Calculations & Total Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
              <div className="flex-1 space-y-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">
                  Terms & Client Notes:
                </span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800/40 text-slate-700 dark:text-slate-300 print:border-none font-medium"
                />
              </div>

              <div className="w-full sm:w-72 space-y-2 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-semibold">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">{symbol}{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-semibold">
                  <span>GST / Tax Rate:</span>
                  <div className="flex items-center gap-1">
                    <select
                      value={taxPercent}
                      onChange={e => setTaxPercent(Number(e.target.value))}
                      className="px-1.5 py-0.5 rounded-md border border-slate-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono font-bold print:border-none"
                    >
                      <option value="0">0% (Exempt)</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST</option>
                    </select>
                    {taxAmount > 0 && <span className="font-mono text-[11px]">+{symbol}{taxAmount.toLocaleString()}</span>}
                  </div>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-semibold">
                  <span>Discount ({symbol}):</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    className="w-20 px-1.5 py-0.5 rounded-md border border-slate-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono font-bold text-right print:border-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-indigo-200 dark:border-indigo-800 text-sm font-black text-indigo-950 dark:text-white">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base text-indigo-700 dark:text-indigo-400">
                    {symbol}{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Block for Print */}
            <div className="pt-8 border-t border-slate-200 dark:border-stone-800 flex justify-between items-end text-xs">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Customer Acceptance:</p>
                <div className="mt-8 border-b border-slate-400 w-44"></div>
                <p className="text-[10px] text-slate-500 mt-1">Authorized Client Signature</p>
              </div>

              <div className="text-right">
                <p className="font-bold text-slate-800 dark:text-slate-200">For {agency.name}:</p>
                <div className="mt-8 border-b border-slate-400 w-44 ml-auto"></div>
                <p className="text-[10px] text-slate-500 mt-1">Authorized Agency Signatory</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
