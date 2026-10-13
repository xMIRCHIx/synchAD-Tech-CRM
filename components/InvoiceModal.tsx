'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  X, Printer, Check, MessageSquare, Receipt,
  Plus, Trash2, Building, Phone, MapPin, Sparkles, Upload,
  CheckCircle2, Clock, AlertTriangle, CreditCard, Banknote, ShieldCheck,
  ChevronRight, ArrowRight, Copy, Users
} from 'lucide-react'
import type { Lead, ClientInvoice, AgencyProfile } from '@/lib/types'
import { useData } from '@/context/DataContext'
import { numberToWordsINR } from '@/lib/numberToWords'
import { generateInvoiceHtml, executePrint } from '@/lib/printTemplates'
import '@/app/invoice-templates.css'

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
  sac?: string
  quantity: number
  rate: number
  amount: number
}

interface PaymentMilestone {
  id: string
  milestone: string
  share: number
  amount: number
  status: 'due' | 'upcoming' | 'paid'
}

const DEFAULT_AGENCY: AgencyProfile & { pan?: string; tagline?: string; place_of_supply?: string } = {
  name: 'SynchAD Tech',
  representative: 'Aryan Gupta',
  partner1_role: 'Co-Founder & Technical Director',
  partner2_name: 'Harsh Vardhan',
  partner2_role: 'Co-Founder & Managing Partner',
  has_dual_signatories: true,
  email: 'hello@synchadtech.com',
  phone: '+91 70675 49982',
  address: 'Shop/Office No. 04, Commercial Complex, Sector 62, Noida, UP 201309, India',
  logo_url: '',
  gstin: '07AAACS1429B1Z8',
  pan: 'AAACS1429B',
  tagline: 'Websites, branding and digital growth',
  place_of_supply: 'Uttar Pradesh (09)',
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
  const [agency, setAgency] = useState<any>(DEFAULT_AGENCY)

  // Client Selection
  const [clientMode, setClientMode] = useState<'existing' | 'custom'>(lead ? 'existing' : 'custom')
  const [clientCategoryTab, setClientCategoryTab] = useState<'won' | 'all'>('won')
  const [selectedLeadId, setSelectedLeadId] = useState<string>(lead?.id || '')
  const [clientName, setClientName] = useState('')
  const [clientSignatory, setClientSignatory] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientGstin, setClientGstin] = useState('22BBBBB1111B1Z5')

  // Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-0042')
  const [issueDate, setIssueDate] = useState('13 Oct 2026')
  const [dueDate, setDueDate] = useState('20 Oct 2026')
  const [placeOfSupply, setPlaceOfSupply] = useState('Chhattisgarh (22)')
  const [agreementRef, setAgreementRef] = useState('AGR-2026-001')
  const [projectName, setProjectName] = useState('Website and local SEO set-up')
  const [installmentLabel, setInstallmentLabel] = useState('1 of 3 due on this invoice')
  const [invoiceStatus, setInvoiceStatus] = useState<'due' | 'paid' | 'upcoming'>('due')
  const [amountReceived, setAmountReceived] = useState<number>(0)

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    {
      id: 'item-1',
      description: 'Website design and development',
      details: '5 pages (Home, About, Services, Gallery, Contact), mobile friendly, contact form, WhatsApp button',
      sac: '998314',
      quantity: 1,
      rate: 35000,
      amount: 35000
    },
    {
      id: 'item-2',
      description: 'Google Business Profile and local SEO setup',
      details: 'Profile set-up, 10 keywords, titles and descriptions, sitemap, Search Console',
      sac: '998314',
      quantity: 1,
      rate: 8000,
      amount: 8000
    },
    {
      id: 'item-3',
      description: 'Booking and lead form integration',
      details: 'Appointment request form with email and WhatsApp alerts',
      sac: '998314',
      quantity: 1,
      rate: 5000,
      amount: 5000
    }
  ])

  // Payment Schedule Milestones
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([
    {
      id: 'm-1',
      milestone: 'On signing this agreement (advance)',
      share: 40,
      amount: 22656,
      status: 'due'
    },
    {
      id: 'm-2',
      milestone: 'On approval of the website design',
      share: 30,
      amount: 16992,
      status: 'upcoming'
    },
    {
      id: 'm-3',
      milestone: 'Before go-live, after final testing',
      share: 30,
      amount: 16992,
      status: 'upcoming'
    }
  ])

  const [taxPercent, setTaxPercent] = useState<number>(18)
  const [discount, setDiscount] = useState<number>(0)

  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Load Agency Profile from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('synchad_agency_profile')
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile)
          setAgency((prev: any) => ({ ...prev, ...parsed }))
        } catch {}
      }
      const today = new Date()
      setIssueDate(today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))
      const due = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      setDueDate(due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))
    }
  }, [isOpen])

  // Sync client details when lead is selected
  useEffect(() => {
    if (lead) {
      setClientName(lead.business_name || lead.owner_name || 'Smile Care Dental Clinic')
      setClientSignatory(lead.owner_name ? `Dr. ${lead.owner_name}, Owner` : 'Dr. Client Name, Owner')
      setClientPhone(lead.phone || '+91 91234 56789')
      setClientAddress(lead.address || 'Plot 12, Main Road, Raipur, Chhattisgarh 492001, India')
      setClientEmail(lead.email || 'client@smilecare.in')
      setProjectName(`Website and local SEO set-up for ${lead.business_name || 'Client'}`)
      setSelectedLeadId(lead.id)
      setClientMode('existing')
    } else if (selectedLeadId) {
      const found = leads.find(l => l.id === selectedLeadId)
      if (found) {
        setClientName(found.business_name || found.owner_name || '')
        setClientSignatory(found.owner_name ? `${found.owner_name}, Owner` : 'Authorized Signatory')
        setClientPhone(found.phone || '')
        setClientAddress(found.address || '')
        setClientEmail(found.email || '')
        setProjectName(`Website and digital growth for ${found.business_name || 'Client'}`)
      }
    }
  }, [lead, selectedLeadId, leads])

  // Auto fetch deal parameters if available
  useEffect(() => {
    if (selectedLeadId && !initialInvoice) {
      fetch(`/api/clients/deal?leadId=${selectedLeadId}`)
        .then(r => r.json())
        .then(data => {
          if (data.deal) {
            const d = data.deal
            if (d.service_type) setProjectName(`${d.service_type} for ${clientName || 'Client'}`)
            if (d.deal_value) {
              const val = Number(d.deal_value)
              const adv = Number(d.advance_paid) || Math.round(val * 0.4)
              setItems([
                {
                  id: 'item-1',
                  description: d.service_type || 'Website design and development',
                  details: d.project_scope || 'High-performance responsive website, WhatsApp conversion funnels, local SEO readiness',
                  sac: '998314',
                  quantity: 1,
                  rate: val,
                  amount: val
                }
              ])
              const sub = val
              const tax = (sub * taxPercent) / 100
              const tot = sub + tax
              setMilestones([
                { id: 'm-1', milestone: 'On signing this agreement (advance)', share: 40, amount: Math.round(tot * 0.4), status: 'due' },
                { id: 'm-2', milestone: 'On approval of the website design', share: 30, amount: Math.round(tot * 0.3), status: 'upcoming' },
                { id: 'm-3', milestone: 'Before go-live, after final testing', share: 30, amount: Math.round(tot * 0.3), status: 'upcoming' }
              ])
            }
          }
        })
        .catch(() => {})
    }
  }, [selectedLeadId, initialInvoice])

  if (!isOpen) return null

  // Financial calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const taxableValue = Math.max(0, subtotal - (Number(discount) || 0))
  const cgstRate = taxPercent > 0 ? taxPercent / 2 : 0
  const sgstRate = taxPercent > 0 ? taxPercent / 2 : 0
  const cgstAmount = (taxableValue * cgstRate) / 100
  const sgstAmount = (taxableValue * sgstRate) / 100
  const totalTax = cgstAmount + sgstAmount
  const rawTotal = taxableValue + totalTax
  const invoiceTotal = Math.round(rawTotal)
  const roundOff = Number((invoiceTotal - rawTotal).toFixed(2))
  const balanceDue = Math.max(0, invoiceTotal - amountReceived)
  const amountInWords = numberToWordsINR(invoiceTotal)

  function updateAgencyProfile(partial: Partial<AgencyProfile>) {
    setAgency((prev: any) => {
      const next = { ...prev, ...partial }
      if (typeof window !== 'undefined') {
        localStorage.setItem('synchad_agency_profile', JSON.stringify(next))
      }
      return next
    })
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const url = reader.result as string
        updateAgencyProfile({ logo_url: url })
      }
      reader.readAsDataURL(file)
    }
  }

  function handleAddItem() {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: 'New Deliverable Service',
      details: 'Deliverable scope details and features',
      sac: '998314',
      quantity: 1,
      rate: 5000,
      amount: 5000
    }
    setItems([...items, newItem])
  }

  function handleUpdateItem(id: string, field: keyof LineItem, val: any) {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: val }
        if (field === 'quantity' || field === 'rate') {
          updated.amount = (Number(updated.quantity) || 0) * (Number(updated.rate) || 0)
        }
        return updated
      }
      return item
    }))
  }

  function handleRemoveItem(id: string) {
    if (items.length <= 1) return
    setItems(items.filter(i => i.id !== id))
  }

  function handlePrint() {
    const html = generateInvoiceHtml({
      agency,
      client: {
        name: clientName,
        signatory: clientSignatory,
        address: clientAddress,
        gstin: clientGstin,
        email: clientEmail,
        phone: clientPhone
      },
      invoiceNumber,
      issueDate,
      dueDate,
      placeOfSupply,
      agreementRef,
      projectName,
      installmentLabel,
      items,
      milestones,
      subtotal,
      discount,
      taxableValue,
      taxPercent,
      cgstAmount,
      sgstAmount,
      roundOff,
      invoiceTotal,
      amountReceived,
      balanceDue,
      amountInWords
    })
    executePrint(html)
  }

  function handleSendWhatsApp() {
    const cleanPhone = clientPhone.replace(/[^\d]/g, '')
    if (!cleanPhone) {
      alert('Please enter a valid client phone number for WhatsApp dispatch.')
      return
    }

    const msg = `Hi ${clientName}! Sharing your official Tax Invoice (${invoiceNumber}) from ${agency.name}:

🧾 Invoice: ${invoiceNumber}
📅 Date: ${issueDate} (Due: ${dueDate})
💼 Project: ${projectName}
💵 Total Amount: ₹${invoiceTotal.toLocaleString()}
📌 Balance Due: ₹${balanceDue.toLocaleString()}

🏦 Bank Remittance:
• Bank: ${agency.bank_name}
• A/C: ${agency.account_number} (IFSC: ${agency.ifsc_code})
• UPI ID: ${agency.upi_id}

Thank you for choosing ${agency.name}!`

    const isDesktop = typeof window !== 'undefined' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = isDesktop
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  async function handleSaveInvoice() {
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
          amount: invoiceTotal,
          installmentLabel,
          dueDate,
          items,
          status: balanceDue === 0 ? 'paid' : 'unpaid'
        })
      })

      const data = await res.json()
      if (res.ok && data.invoice) {
        setIsSaved(true)
        if (onInvoiceCreated) onInvoiceCreated(data.invoice)
        setTimeout(() => setIsSaved(false), 3000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative w-full h-full max-w-[1600px] max-h-[96vh] m-2 bg-stone-900 border border-stone-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:m-0 print:rounded-none print:max-w-none print:max-h-none print:h-auto print:w-auto">

        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-3 sm:px-6 border-b border-stone-800 flex items-center justify-between bg-stone-950 text-white shrink-0 print:hidden BLzxva_noPrint">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
              <Receipt size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  Tax Invoice Studio
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                  {invoiceNumber}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Official GST-compliant A4 Tax Invoice with dual partnership signatures.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveInvoice}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Check size={14} />
              {isSaved ? 'Saved!' : 'Save Invoice'}
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer size={14} />
              Print / Save as PDF
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ea952] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <MessageSquare size={14} />
              WhatsApp
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden print:overflow-visible">

          {/* LEFT: Controls & Form Configuration (Hidden on Print) */}
          <div className="w-full lg:w-[460px] border-b lg:border-b-0 lg:border-r border-stone-800 bg-stone-900 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs text-stone-200 print:hidden BLzxva_noPrint shrink-0">
            
            {/* 1. Client Details */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
              <span className="font-extrabold text-stone-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Building size={13} className="text-purple-400" /> 1. Billed To (Client Info)
              </span>

              <div className="flex gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setClientMode('existing')}
                  className={`flex-1 py-1 rounded-lg font-bold ${clientMode === 'existing' ? 'bg-purple-600 text-white' : 'bg-stone-800 text-stone-400'}`}
                >
                  CRM Leads
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode('custom')}
                  className={`flex-1 py-1 rounded-lg font-bold ${clientMode === 'custom' ? 'bg-purple-600 text-white' : 'bg-stone-800 text-stone-400'}`}
                >
                  Custom
                </button>
              </div>

              {clientMode === 'existing' && (
                <div className="space-y-2">
                  <div className="flex rounded-lg bg-stone-800 p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setClientCategoryTab('won')}
                      className={`flex-1 py-0.5 rounded ${clientCategoryTab === 'won' ? 'bg-purple-600 text-white' : 'text-stone-400'}`}
                    >
                      Won Clients ({leads.filter(l => l.status === 'won').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientCategoryTab('all')}
                      className={`flex-1 py-0.5 rounded ${clientCategoryTab === 'all' ? 'bg-purple-600 text-white' : 'text-stone-400'}`}
                    >
                      All Leads ({leads.length})
                    </button>
                  </div>

                  <select
                    value={selectedLeadId}
                    onChange={e => setSelectedLeadId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 text-white text-xs font-bold"
                  >
                    <option value="">-- Select Client --</option>
                    {(clientCategoryTab === 'won' ? leads.filter(l => l.status === 'won') : leads).map(l => (
                      <option key={l.id} value={l.id}>
                        {l.business_name || l.owner_name} {l.status === 'won' ? '★ WON' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Client Business Name"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 text-white text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Attn: Owner / Representative Name"
                  value={clientSignatory}
                  onChange={e => setClientSignatory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 text-white text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Client Phone"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 text-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Client GSTIN"
                    value={clientGstin}
                    onChange={e => setClientGstin(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 text-white text-xs font-mono"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Client Address"
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 text-white text-xs"
                />
              </div>
            </div>

            {/* 2. Metadata */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
              <span className="font-extrabold text-stone-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Receipt size={13} className="text-purple-400" /> 2. Invoice Meta & Project
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Invoice No.</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-stone-700 bg-stone-900 text-white font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Place of Supply</label>
                  <input
                    type="text"
                    value={placeOfSupply}
                    onChange={e => setPlaceOfSupply(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-stone-700 bg-stone-900 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Invoice Date</label>
                  <input
                    type="text"
                    value={issueDate}
                    onChange={e => setIssueDate(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-stone-700 bg-stone-900 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Due Date</label>
                  <input
                    type="text"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-stone-700 bg-stone-900 text-white text-xs font-bold text-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 text-white text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Instalment Label</label>
                  <input
                    type="text"
                    value={installmentLabel}
                    onChange={e => setInstallmentLabel(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-stone-700 bg-stone-900 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Agreement Ref.</label>
                  <input
                    type="text"
                    value={agreementRef}
                    onChange={e => setAgreementRef(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-stone-700 bg-stone-900 text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 3. Deliverables Items */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-stone-300 text-[11px] uppercase tracking-wider">
                  3. Line Items & Deliverables ({items.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> Add Item
                </button>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-purple-400 font-bold">#{idx + 1}</span>
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => handleUpdateItem(item.id, 'description', e.target.value)}
                        placeholder="Item Title"
                        className="flex-1 px-2 py-0.5 rounded border border-stone-700 bg-stone-800 text-white font-bold text-xs"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={item.details || ''}
                      onChange={e => handleUpdateItem(item.id, 'details', e.target.value)}
                      placeholder="Details / Specifications"
                      className="w-full p-1.5 rounded border border-stone-700 bg-stone-800 text-stone-300 text-[11px]"
                    />
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <div>
                        <span className="text-[9px] text-stone-400 block">SAC:</span>
                        <input
                          type="text"
                          value={item.sac || '998314'}
                          onChange={e => handleUpdateItem(item.id, 'sac', e.target.value)}
                          className="w-full px-1.5 py-0.5 rounded border border-stone-700 bg-stone-800 text-white font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-400 block">Qty:</span>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-full px-1.5 py-0.5 rounded border border-stone-700 bg-stone-800 text-white font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-400 block">Rate (₹):</span>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={e => handleUpdateItem(item.id, 'rate', Number(e.target.value))}
                          className="w-full px-1.5 py-0.5 rounded border border-stone-700 bg-stone-800 text-white font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tax & Discount */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">GST Rate (%)</label>
                  <select
                    value={taxPercent}
                    onChange={e => setTaxPercent(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded-lg border border-stone-700 bg-stone-900 text-white font-bold"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% (CGST 2.5% + SGST 2.5%)</option>
                    <option value="12">12% (CGST 6% + SGST 6%)</option>
                    <option value="18">18% (CGST 9% + SGST 9%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Discount (₹)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded-lg border border-stone-700 bg-stone-900 text-white font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 4. Dual Signatories & Agency Profile */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-stone-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={13} className="text-purple-400" /> 4. Dual Partners (Signatories)
                </span>
                <label className="flex items-center gap-1.5 text-[10px] text-stone-400 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agency.has_dual_signatories ?? true}
                    onChange={e => updateAgencyProfile({ has_dual_signatories: e.target.checked })}
                    className="rounded accent-purple-600"
                  />
                  2 Partners
                </label>
              </div>

              <div className="flex items-center gap-3">
                {agency.logo_url ? (
                  <img src={agency.logo_url} alt="Logo" className="w-12 h-12 object-contain rounded-xl border border-stone-700 bg-white p-1" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-stone-800 border border-dashed border-stone-700 flex items-center justify-center text-stone-400 text-[10px] font-bold">
                    No Logo
                  </div>
                )}
                <label className="flex-1 cursor-pointer py-1.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-center font-bold text-xs flex items-center justify-center gap-1.5 border border-stone-700">
                  <Upload size={13} /> Upload Agency Logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>

              <div className="space-y-2">
                <div className="p-2 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
                  <span className="text-[10px] font-bold text-purple-400">Partner 1 (Lead Signatory)</span>
                  <input
                    type="text"
                    value={agency.representative || ''}
                    onChange={e => updateAgencyProfile({ representative: e.target.value })}
                    placeholder="Partner 1 Name"
                    className="w-full px-2 py-0.5 rounded border border-stone-700 bg-stone-800 text-white font-bold"
                  />
                  <input
                    type="text"
                    value={agency.partner1_role || ''}
                    onChange={e => updateAgencyProfile({ partner1_role: e.target.value })}
                    placeholder="Role: Co-Founder & Technical Director"
                    className="w-full px-2 py-0.5 rounded border border-stone-700 bg-stone-800 text-stone-300 text-[11px]"
                  />
                </div>

                {(agency.has_dual_signatories ?? true) && (
                  <div className="p-2 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
                    <span className="text-[10px] font-bold text-purple-400">Partner 2 (Co-Signatory)</span>
                    <input
                      type="text"
                      value={agency.partner2_name || ''}
                      onChange={e => updateAgencyProfile({ partner2_name: e.target.value })}
                      placeholder="Partner 2 Name"
                      className="w-full px-2 py-0.5 rounded border border-stone-700 bg-stone-800 text-white font-bold"
                    />
                    <input
                      type="text"
                      value={agency.partner2_role || ''}
                      onChange={e => updateAgencyProfile({ partner2_role: e.target.value })}
                      placeholder="Role: Co-Founder & Managing Partner"
                      className="w-full px-2 py-0.5 rounded border border-stone-700 bg-stone-800 text-stone-300 text-[11px]"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT: High-Fidelity Printable A4 Sheet (Exact Template Design) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-950/60 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
            
            <div className="BLzxva_doc _18hRHG_sheet BLzxva_printable">
              
              {/* TOP: Brand & Metadata */}
              <div className="_18hRHG_top">
                <div>
                  {agency.logo_url ? (
                    <img src={agency.logo_url} alt={agency.name} className="BLzxva_logoImg" />
                  ) : (
                    <div className="BLzxva_logo">
                      <span>{agency.name}</span>
                      <small>PNG or SVG, about 60 x 20 mm</small>
                    </div>
                  )}

                  <div className="_18hRHG_co">
                    <b>{agency.name}</b><br />
                    {agency.tagline || 'Websites, branding and digital growth'}<br />
                    {agency.address}
                  </div>
                </div>

                <div className="_18hRHG_title">
                  <h1 className="_18hRHG_titleH">Tax Invoice</h1>
                  <table className="_18hRHG_meta">
                    <tbody>
                      <tr><td>Invoice no.</td><td>{invoiceNumber}</td></tr>
                      <tr><td>Invoice date</td><td>{issueDate}</td></tr>
                      <tr><td>Due date</td><td>{dueDate}</td></tr>
                      <tr><td>Place of supply</td><td>{placeOfSupply}</td></tr>
                      <tr><td>Agreement ref.</td><td>{agreementRef}</td></tr>
                      <tr><td>Reverse charge</td><td>No</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gradient Divider */}
              <div className="BLzxva_rule _18hRHG_ruleGap"></div>

              {/* PARTIES CARDS */}
              <div className="_18hRHG_parties">
                {/* Billed By */}
                <div className="_18hRHG_party">
                  <div className="BLzxva_label">Billed by</div>
                  <b>{agency.name}</b>
                  <div>{agency.address}</div>
                  <div className="_18hRHG_partyRow"><span>GSTIN</span><span>{agency.gstin || '22AAAAA0000A1Z5'}</span></div>
                  <div className="_18hRHG_partyRow"><span>PAN</span><span>{agency.pan || 'AAAAA0000A'}</span></div>
                  <div className="_18hRHG_partyRow"><span>Email</span><span>{agency.email}</span></div>
                  <div className="_18hRHG_partyRow"><span>Phone</span><span>{agency.phone}</span></div>
                </div>

                {/* Billed To */}
                <div className="_18hRHG_party">
                  <div className="BLzxva_label">Billed to</div>
                  <b>{clientName || 'Valued Client'}</b>
                  <div>{clientAddress || 'Registered Business Address, India'}</div>
                  <div className="_18hRHG_partyRow"><span>GSTIN</span><span>{clientGstin || 'Unregistered'}</span></div>
                  <div className="_18hRHG_partyRow"><span>Attn.</span><span>{clientSignatory || clientName}</span></div>
                  <div className="_18hRHG_partyRow"><span>Email</span><span>{clientEmail || 'client@email.com'}</span></div>
                  <div className="_18hRHG_partyRow"><span>Phone</span><span>{clientPhone || '+91 91234 56789'}</span></div>
                </div>
              </div>

              {/* PROJECT & INSTALMENT BANNER */}
              <div className="_18hRHG_project">
                <b>Project:</b> {projectName}
                <span className="_18hRHG_gap"></span>
                <b>Instalment:</b> {installmentLabel}
              </div>

              {/* ITEMS TABLE */}
              <table className="_18hRHG_items">
                <thead>
                  <tr>
                    <th style={{ width: '4%' }}>#</th>
                    <th>Description</th>
                    <th style={{ width: '10%' }}>SAC</th>
                    <th className="_18hRHG_num" style={{ width: '7%' }}>Qty</th>
                    <th className="_18hRHG_num" style={{ width: '15%' }}>Rate (₹)</th>
                    <th className="_18hRHG_num" style={{ width: '15%' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <b>{item.description}</b>
                        {item.details && <small>{item.details}</small>}
                      </td>
                      <td>{item.sac || '998314'}</td>
                      <td className="_18hRHG_num">{item.quantity}</td>
                      <td className="_18hRHG_num">{Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="_18hRHG_num">{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* MID SECTION: Amount in Words + Milestones + Ledger */}
              <div className="_18hRHG_mid">
                <div>
                  {/* Amount in words */}
                  <div className="_18hRHG_words">
                    <div className="BLzxva_label">Amount in words</div>
                    <b>{amountInWords}</b>
                  </div>

                  {/* Payment schedule from agreement */}
                  <div className="BLzxva_label">Payment schedule (from agreement {agreementRef})</div>
                  <table className="_18hRHG_sched">
                    <thead>
                      <tr>
                        <th style={{ width: '6%' }}>#</th>
                        <th>Milestone</th>
                        <th className="_18hRHG_num">Share</th>
                        <th className="_18hRHG_num">Amount (₹)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {milestones.map((m, idx) => (
                        <tr key={m.id}>
                          <td>{idx + 1}</td>
                          <td>{m.milestone}</td>
                          <td className="_18hRHG_num">{m.share}%</td>
                          <td className="_18hRHG_num">{Number(m.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td>
                            <span className={`_18hRHG_status ${
                              m.status === 'due' ? '_18hRHG_sDue' : m.status === 'paid' ? '_18hRHG_sPaid' : '_18hRHG_sUp'
                            }`}>
                              {m.status === 'due' ? 'Due now' : m.status === 'paid' ? 'Paid' : 'Upcoming'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Ledger */}
                <table className="_18hRHG_tot">
                  <tbody>
                    <tr>
                      <td>Subtotal</td>
                      <td className="_18hRHG_num">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    {discount > 0 && (
                      <tr>
                        <td>Discount</td>
                        <td className="_18hRHG_num">-₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}
                    <tr>
                      <td>Taxable value</td>
                      <td className="_18hRHG_num">₹{taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    {taxPercent > 0 && (
                      <>
                        <tr>
                          <td>CGST @ {cgstRate}%</td>
                          <td className="_18hRHG_num">₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                          <td>SGST @ {sgstRate}%</td>
                          <td className="_18hRHG_num">₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </>
                    )}
                    {roundOff !== 0 && (
                      <tr>
                        <td>Round off</td>
                        <td className="_18hRHG_num">{roundOff > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}</td>
                      </tr>
                    )}
                    <tr className="_18hRHG_big">
                      <td>Invoice total</td>
                      <td className="_18hRHG_num">₹{invoiceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td>Amount received</td>
                      <td className="_18hRHG_num">₹{amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="_18hRHG_dueRow">
                      <td>Balance due</td>
                      <td className="_18hRHG_num">₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* BOTTOM: Bank Details + UPI QR + Signatures (Dual Partners) */}
              <div className="_18hRHG_bottom">
                {/* Bank Card */}
                <div className="_18hRHG_card">
                  <div className="BLzxva_label">Bank details for payment</div>
                  <div className="_18hRHG_kv">
                    <span>Name</span><span>{agency.name}</span>
                    <span>Bank</span><span>{agency.bank_name}</span>
                    <span>Account</span><span>{agency.account_number} (Current)</span>
                    <span>IFSC</span><span>{agency.ifsc_code}</span>
                    <span>UPI ID</span><span>{agency.upi_id}</span>
                  </div>
                </div>

                {/* QR Card */}
                <div className="_18hRHG_qr">
                  <i className="_18hRHG_qrBox"></i>
                  UPI QR code<br />goes here
                </div>

                {/* Signatures Card (Supporting 2 Partners) */}
                <div className="_18hRHG_card _18hRHG_sign">
                  <div>
                    <div className="BLzxva_label">For {agency.name}</div>
                  </div>
                  
                  <div className="_18hRHG_signSpace">
                    Stamp and signature
                  </div>

                  <div style={{ fontSize: '7.8pt' }}>
                    <b>{agency.representative || 'Aryan Gupta'}</b>
                    <br />
                    <span className="BLzxva_muted">{agency.partner1_role || 'Director'}</span>

                    {(agency.has_dual_signatories ?? true) && (
                      <div style={{ marginTop: '4px', paddingTop: '3px', borderTop: '1px dotted var(--line)' }}>
                        <b>{agency.partner2_name || 'Harsh Vardhan'}</b>
                        <br />
                        <span className="BLzxva_muted">{agency.partner2_role || 'Managing Partner'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TERMS */}
              <div className="_18hRHG_terms">
                <b>Terms</b>
                <ol>
                  <li>Please pay by the due date. Late payment attracts a charge of 1.5% per month on the amount overdue.</li>
                  <li>Quote the invoice number in your payment reference. Bank charges are borne by the payer.</li>
                  <li>Work on each stage starts after the matching instalment is received, as set out in the agreement.</li>
                  <li>Disputes are subject to the jurisdiction of courts at {agency.address?.includes('Noida') ? 'Gautam Buddha Nagar, UP' : 'Ambikapur, Chhattisgarh'}.</li>
                </ol>
              </div>

              {/* FOOTER */}
              <div className="_18hRHG_foot">
                This is a computer-generated invoice. Questions about it? Write to {agency.email} or call {agency.phone}.
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
