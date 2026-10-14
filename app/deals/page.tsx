'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Briefcase, DollarSign, Calendar, Layers, CheckCircle2, Clock, Plus,
  Trash2, Search, ArrowRight, MessageSquare, Receipt, FileText, Check,
  CreditCard, ShieldCheck, RefreshCw, Sparkles, Filter, ChevronRight, Phone,
  ExternalLink, UserCheck, Users, TrendingUp, AlertCircle
} from 'lucide-react'
import { useData } from '@/context/DataContext'
import type { Lead, ClientDeal, DealStage, PaymentMode, DealInstallment } from '@/lib/types'
import Toast, { ToastMessage } from '@/components/Toast'
import InvoiceModal from '@/components/InvoiceModal'
import AgreementModal from '@/components/AgreementModal'

const PRESET_FEATURES = [
  '⚡ Next.js Ultra-Fast Architecture',
  '📱 100% Mobile Responsive Layout',
  '💬 WhatsApp Lead & Inquiry Integration',
  '📍 Google Maps & Local SEO Setup',
  '🔒 SSL Certificate & Domain Linking',
  '💳 UPI & Online Payment Gateway',
  '🛡️ 30-Day Tech Support & Bug Warranty',
  '📊 Admin Analytics CRM'
]

function DealsStudioContent() {
  const { leads, refreshAll } = useData()
  const searchParams = useSearchParams()
  const preselectedLeadId = searchParams?.get('leadId')

  // Client Selection State
  const [clientCategoryTab, setClientCategoryTab] = useState<'won' | 'all'>('won')
  const [clientSearch, setClientSearch] = useState('')
  const [selectedLeadId, setSelectedLeadId] = useState<string>('')
  
  // Deal Form State
  const [dealValue, setDealValue] = useState<number>(35000)
  const [advancePaid, setAdvancePaid] = useState<number>(17500)
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi')
  const [serviceType, setServiceType] = useState('Custom Website + WhatsApp Lead Funnel')
  const [projectScope, setProjectScope] = useState('High-performance Next.js web application with direct WhatsApp client lead generation and mobile optimization.')
  const [targetDeadline, setTargetDeadline] = useState('')
  const [stage, setStage] = useState<DealStage>('closing')

  // Features checklist
  const [features, setFeatures] = useState<string[]>([
    '⚡ Next.js Ultra-Fast Architecture',
    '📱 100% Mobile Responsive Layout',
    '💬 WhatsApp Lead & Inquiry Integration',
    '📍 Google Maps & Local SEO Setup'
  ])
  const [customFeatureInput, setCustomFeatureInput] = useState('')

  // Installments list
  const [installments, setInstallments] = useState<DealInstallment[]>([
    { id: 'inst-1', label: '50% Advance Booking', amount: 17500, due_date: '', status: 'paid' },
    { id: 'inst-2', label: '50% Final Launch & Handover', amount: 17500, due_date: '', status: 'pending' }
  ])

  // Modals & Feedback
  const [allDeals, setAllDeals] = useState<ClientDeal[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingDeals, setIsLoadingDeals] = useState(true)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  // Invoice & Agreement Modals
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [isAgreementOpen, setIsAgreementOpen] = useState(false)

  // Filter lists
  const wonClients = useMemo(() => leads.filter(l => l.status === 'won'), [leads])
  const eligibleClients = clientCategoryTab === 'won' ? wonClients : leads

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase()
    return eligibleClients.filter(c => 
      c.business_name?.toLowerCase().includes(q) ||
      c.owner_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    )
  }, [eligibleClients, clientSearch])

  // Selected Lead Object
  const currentLead = useMemo(() => {
    return leads.find(l => l.id === selectedLeadId) || null
  }, [leads, selectedLeadId])

  // Initial load
  useEffect(() => {
    fetchAllDeals()
    if (!targetDeadline) {
      const d = new Date()
      d.setDate(d.getDate() + 14)
      setTargetDeadline(d.toISOString().split('T')[0])
    }
  }, [])

  // Auto-select lead from query params or first won client
  useEffect(() => {
    if (preselectedLeadId) {
      setSelectedLeadId(preselectedLeadId)
      const found = leads.find(l => l.id === preselectedLeadId)
      if (found && found.status !== 'won') {
        setClientCategoryTab('all')
      }
    } else if (!selectedLeadId && wonClients.length > 0) {
      setSelectedLeadId(wonClients[0].id)
    }
  }, [preselectedLeadId, wonClients, leads])

  // Fetch deal details when selectedLeadId changes
  useEffect(() => {
    if (selectedLeadId) {
      loadLeadDeal(selectedLeadId)
    }
  }, [selectedLeadId])

  async function fetchAllDeals() {
    setIsLoadingDeals(true)
    try {
      const res = await fetch('/api/clients/deal')
      const data = await res.json()
      if (data.deals) {
        setAllDeals(data.deals)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingDeals(false)
    }
  }

  async function loadLeadDeal(leadId: string) {
    try {
      const res = await fetch(`/api/clients/deal?leadId=${leadId}`)
      const data = await res.json()
      if (data.deal) {
        const d = data.deal
        const val = Number(d.deal_value) || 35000
        const adv = Number(d.advance_paid) || 17500
        setDealValue(val)
        setAdvancePaid(adv)
        setCurrency(d.currency || 'INR')
        setPaymentMode(d.payment_mode || 'upi')
        setServiceType(d.service_type || 'Custom Website + WhatsApp Booking Funnel')
        setProjectScope(d.project_scope || '')
        if (d.target_deadline) setTargetDeadline(d.target_deadline)
        if (d.stage) setStage(d.stage)

        if (Array.isArray(d.features) && d.features.length > 0) {
          setFeatures(d.features)
        } else {
          setFeatures([
            '⚡ Next.js Ultra-Fast Architecture',
            '📱 100% Mobile Responsive Layout',
            '💬 1-Tap WhatsApp Booking Engine',
            '📍 Google Maps & Local SEO Setup'
          ])
        }

        if (Array.isArray(d.installments) && d.installments.length > 0) {
          setInstallments(d.installments)
        } else {
          const bal = Math.max(0, val - adv)
          setInstallments([
            { id: 'inst-1', label: 'Advance Booking', amount: adv, due_date: new Date().toISOString().split('T')[0], status: 'paid' },
            { id: 'inst-2', label: 'Final Launch & Handover', amount: bal, due_date: d.target_deadline || '', status: 'pending' }
          ])
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const balanceDue = Math.max(0, dealValue - advancePaid)
  const symbol = currency === 'INR' ? '₹' : '$'
  const advancePercent = dealValue > 0 ? Math.min(100, Math.round((advancePaid / dealValue) * 100)) : 0

  // Feature Toggles
  const toggleFeature = (feat: string) => {
    setFeatures(prev => prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat])
  }

  const addCustomFeature = () => {
    const trimmed = customFeatureInput.trim()
    if (trimmed && !features.includes(trimmed)) {
      setFeatures(prev => [...prev, trimmed])
      setCustomFeatureInput('')
    }
  }

  // Installment Management
  const addInstallment = () => {
    const newInst: DealInstallment = {
      id: `inst-${Date.now()}`,
      label: `Milestone ${installments.length + 1}`,
      amount: Math.round(balanceDue / 2) || 5000,
      due_date: targetDeadline || new Date().toISOString().split('T')[0],
      status: 'pending'
    }
    setInstallments(prev => [...prev, newInst])
  }

  const updateInstallment = (id: string, field: keyof DealInstallment, val: any) => {
    setInstallments(prev => prev.map(inst => inst.id === id ? { ...inst, [field]: val } : inst))
  }

  const removeInstallment = (id: string) => {
    if (installments.length > 1) {
      setInstallments(prev => prev.filter(inst => inst.id !== id))
    }
  }

  // Save Deal
  async function handleSaveDeal() {
    if (!selectedLeadId || !currentLead) {
      alert('Please select a client first.')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/clients/deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLeadId,
          client_name: currentLead.business_name || currentLead.owner_name,
          client_phone: currentLead.phone,
          deal_value: dealValue,
          advance_paid: advancePaid,
          balance_due: balanceDue,
          currency,
          payment_mode: paymentMode,
          service_type: serviceType,
          project_scope: projectScope,
          features,
          installments,
          target_deadline: targetDeadline,
          stage
        })
      })

      const data = await res.json()
      if (res.ok && data.deal) {
        setToast({
          id: String(Date.now()),
          title: 'Deal Scope Saved!',
          description: `Pricing, milestones & features locked for ${currentLead.business_name}.`,
          type: 'success'
        })
        fetchAllDeals()
        refreshAll(true)
      } else {
        throw new Error(data.error || 'Failed to save deal')
      }
    } catch (err: any) {
      setToast({
        id: String(Date.now()),
        title: 'Save Failed',
        description: err.message,
        type: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // WhatsApp Dispatch
  function handleWhatsAppDispatch() {
    if (!currentLead?.phone) {
      alert('No phone number registered for this client.')
      return
    }

    const cleanPhone = currentLead.phone.replace(/[^\d]/g, '')
    const msg = `Hi ${currentLead.owner_name || currentLead.business_name}! 🚀

Here is the approved project scope and financial summary for your ${serviceType}:

💼 Total Deal Value: ${symbol}${dealValue.toLocaleString()}
✅ Advance Paid: ${symbol}${advancePaid.toLocaleString()}
⏳ Balance Due: ${symbol}${balanceDue.toLocaleString()}
📅 Target Delivery Date: ${targetDeadline || 'Within 14 business days'}

📌 Included Deliverables:
${features.map(f => `• ${f}`).join('\n')}

We are working actively on your build. Let us know if you have any questions!`

    const isDesktop = typeof window !== 'undefined' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = isDesktop
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  // Portfolio Totals
  const totalPortfolioValue = allDeals.reduce((sum, d) => sum + (Number(d.deal_value) || 0), 0)
  const totalAdvanceCollected = allDeals.reduce((sum, d) => sum + (Number(d.advance_paid) || 0), 0)
  const totalReceivables = Math.max(0, totalPortfolioValue - totalAdvanceCollected)

  return (
    <>
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Invoice Studio Modal */}
      <InvoiceModal
        lead={currentLead}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        dealData={{
          deal_value: dealValue,
          advance_paid: advancePaid,
          balance_due: balanceDue,
          currency,
          service_type: serviceType
        }}
      />

      {/* Agreement Studio Modal */}
      <AgreementModal
        lead={currentLead}
        isOpen={isAgreementOpen}
        onClose={() => setIsAgreementOpen(false)}
        dealData={{
          deal_value: dealValue,
          advance_paid: advancePaid,
          balance_due: balanceDue,
          currency,
          service_type: serviceType,
          project_scope: `${serviceType}\n\nFeatures Included:\n${features.map(f => `• ${f}`).join('\n')}\n\n${projectScope}`,
          target_deadline: targetDeadline
        }}
      />

      <div className="p-4 sm:p-7 max-w-[1500px] mx-auto space-y-7 animate-fade-in pb-28">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Client Deal & Project Scope Studio <Briefcase className="text-indigo-600 dark:text-indigo-400" size={24} />
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure closing prices, milestone installments, deadlines and tech deliverables. Auto-syncs into Invoices & AI Agreements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchAllDeals()
                refreshAll(true)
              }}
              className="btn btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={isLoadingDeals ? 'animate-spin' : ''} />
              Sync Deals
            </button>
          </div>
        </div>

        {/* Executive KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Deal Portfolio
              </span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                ₹{totalPortfolioValue.toLocaleString()}
              </div>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                {allDeals.length} Configured Contracts
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
              <Briefcase size={22} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Advance Collected
              </span>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{totalAdvanceCollected.toLocaleString()}
              </div>
              <span className="text-[11px] font-bold text-slate-500 mt-0.5 block">
                Secured Bank/UPI Inflow
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                Pending Balance Due
              </span>
              <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
                ₹{totalReceivables.toLocaleString()}
              </div>
              <span className="text-[11px] font-bold text-slate-500 mt-0.5 block">
                To collect on milestone launch
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
              <Clock size={22} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">
                Won Clients Pipeline
              </span>
              <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1">
                {wonClients.length} Won
              </div>
              <span className="text-[11px] font-bold text-slate-500 mt-0.5 block">
                {leads.length} Total Leads in CRM
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
              <UserCheck size={22} />
            </div>
          </div>
        </div>

        {/* Main Studio Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Scope & Deal Configurator (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#161B22] rounded-3xl border border-slate-200 dark:border-stone-800 p-5 sm:p-7 shadow-xl space-y-6">
            
            {/* Client Picker with Tabs */}
            <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-stone-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-600" />
                  Select Client for Deal Scoping:
                </label>

                {/* Tab Switcher: Won Clients vs All Pipeline */}
                <div className="flex items-center bg-slate-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setClientCategoryTab('won')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      clientCategoryTab === 'won'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Won Clients ({wonClients.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientCategoryTab('all')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      clientCategoryTab === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    All Pipeline Leads ({leads.length})
                  </button>
                </div>
              </div>

              {/* Search + Client Select Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by business name or phone..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-900 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-black text-slate-900 dark:text-white outline-none cursor-pointer focus:border-indigo-500"
                >
                  <option value="">-- Choose Client --</option>
                  {filteredClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.business_name} ({c.phone}) {c.status === 'won' ? '★ WON' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Client Banner */}
              {currentLead && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        {currentLead.business_name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-black bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 uppercase">
                        {currentLead.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Representative: {currentLead.owner_name || 'Owner'} • Phone: {currentLead.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block font-semibold">Current State</span>
                    <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 capitalize">
                      {stage.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Parameters */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-600" />
                Deal Value & Advance Pricing
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-1">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 block">
                    Total Deal Value ({symbol})
                  </label>
                  <input
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(Number(e.target.value))}
                    className="w-full text-lg font-black font-mono bg-transparent text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-700 dark:text-emerald-300 block">
                    Advance Paid ({symbol})
                  </label>
                  <input
                    type="number"
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(Number(e.target.value))}
                    className="w-full text-lg font-black font-mono bg-transparent text-emerald-700 dark:text-emerald-300 outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-amber-700 dark:text-amber-300 block">
                    Balance Due ({symbol})
                  </label>
                  <div className="text-lg font-black font-mono text-amber-700 dark:text-amber-300">
                    {symbol}{balanceDue.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Currency, Payment Mode, Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Payment Channel
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="upi">UPI / Instant QR</option>
                    <option value="bank_transfer">Net Banking / NEFT</option>
                    <option value="cash">Cash / Cheque</option>
                    <option value="stripe">Stripe / Cards</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Delivery Deadline 📅
                  </label>
                  <input
                    type="date"
                    value={targetDeadline}
                    onChange={(e) => setTargetDeadline(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Features Checklist */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-stone-900/60 border border-slate-200 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-600" />
                    Deliverable Features Checklist ({features.length} selected)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    What features are promised? Automatically pulled as invoice line items and agreement clauses.
                  </p>
                </div>
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {PRESET_FEATURES.map((feat) => {
                  const isSelected = features.includes(feat)
                  return (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => toggleFeature(feat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                          : 'bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400'
                      }`}
                    >
                      {isSelected && <Check size={11} />}
                      {feat}
                    </button>
                  )
                })}
                {features.filter(f => !PRESET_FEATURES.includes(f)).map((customFeat) => (
                  <span
                    key={customFeat}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white flex items-center gap-1.5"
                  >
                    <Check size={11} />
                    {customFeat}
                    <button
                      type="button"
                      onClick={() => toggleFeature(customFeat)}
                      className="hover:text-rose-200 ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Custom Feature Adder */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="+ Add custom deliverable / feature requested by client..."
                  value={customFeatureInput}
                  onChange={(e) => setCustomFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomFeature())}
                  className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomFeature}
                  className="btn btn-secondary px-3 py-2 text-xs font-bold rounded-xl cursor-pointer"
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>

            {/* Installments & Milestones Planner */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-stone-900/60 border border-slate-200 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CreditCard size={14} className="text-emerald-600" />
                    Installment Milestones & Payment Schedule
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Kitna installment, kab tak chahiye, and payment release milestones
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addInstallment}
                  className="btn btn-secondary px-2.5 py-1 text-xs font-bold rounded-xl text-indigo-600 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> Add Milestone
                </button>
              </div>

              <div className="space-y-2">
                {installments.map((inst, idx) => (
                  <div
                    key={inst.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs"
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-stone-700 font-mono font-bold flex items-center justify-center text-slate-500 shrink-0 text-[11px]">
                      #{idx + 1}
                    </span>

                    <input
                      type="text"
                      value={inst.label}
                      onChange={(e) => updateInstallment(inst.id, 'label', e.target.value)}
                      placeholder="Milestone Title"
                      className="flex-1 font-bold bg-transparent text-slate-900 dark:text-white outline-none min-w-[130px]"
                    />

                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-stone-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-stone-700">
                      <span className="font-bold text-slate-400">{symbol}</span>
                      <input
                        type="number"
                        value={inst.amount}
                        onChange={(e) => updateInstallment(inst.id, 'amount', Number(e.target.value))}
                        className="w-20 font-mono font-black bg-transparent text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <input
                      type="date"
                      value={inst.due_date}
                      onChange={(e) => updateInstallment(inst.id, 'due_date', e.target.value)}
                      className="p-1 rounded-lg border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-900 font-mono text-[11px] text-slate-700 dark:text-slate-300 outline-none w-32"
                    />

                    <select
                      value={inst.status}
                      onChange={(e) => updateInstallment(inst.id, 'status', e.target.value as any)}
                      className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                        inst.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}
                    >
                      <option value="paid">Paid 💰</option>
                      <option value="pending">Pending ⏳</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => removeInstallment(inst.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Scope Notes */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Project Scope Details & Tech Specifications Notes
              </label>
              <textarea
                rows={3}
                value={projectScope}
                onChange={(e) => setProjectScope(e.target.value)}
                placeholder="Tech stack, domain requirements, revision cycle, specific client preferences..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-slate-900 dark:text-white outline-none leading-relaxed"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Auto-saves and syncs with Won Clients & Revenue Dashboard
              </span>

              <button
                type="button"
                onClick={handleSaveDeal}
                disabled={isSaving}
                className="btn btn-primary px-6 py-2.5 text-xs font-black rounded-xl cursor-pointer shadow-md shadow-indigo-500/25 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
              >
                <Check size={15} />
                {isSaving ? 'Locking Deal Scope...' : 'Lock Deal & Save Scope'}
              </button>
            </div>

          </div>

          {/* Right Column: Live Executive Preview & 1-Tap Generator Studio (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Live Deal Summary Card */}
            <div className="bg-white dark:bg-[#161B22] rounded-3xl border border-slate-200 dark:border-stone-800 p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-stone-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-extrabold block">
                    LIVE DEAL DOSSIER
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {currentLead?.business_name || 'Select a Client'}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 block">Total Contract</span>
                  <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                    {symbol}{dealValue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Advance vs Balance Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Advance Paid: {symbol}{advancePaid.toLocaleString()} ({advancePercent}%)
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">
                    Due: {symbol}{balanceDue.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-stone-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-stone-700">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${advancePercent}%` }}
                  />
                </div>
              </div>

              {/* Delivery Target Pill */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                  <Calendar size={14} className="text-indigo-600" />
                  Target Delivery:
                </div>
                <span className="font-mono font-black text-slate-900 dark:text-white">
                  {targetDeadline || 'Not set'}
                </span>
              </div>

              {/* Features Included List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Included Features ({features.length})
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200 font-semibold">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1-Tap Trigger Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-stone-800 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setIsInvoiceOpen(true)}
                  className="w-full btn btn-primary py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Receipt size={15} />
                  Generate Invoice for {currentLead?.business_name || 'Client'}
                  <ArrowRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsAgreementOpen(true)}
                  className="w-full btn btn-secondary py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                >
                  <FileText size={15} />
                  Draft Legal Agreement with AI
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppDispatch}
                  className="w-full btn bg-[#25D366] hover:bg-[#1ea952] text-white py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <MessageSquare size={15} />
                  Dispatch Deal Scope on WhatsApp
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* Saved Deals Ledger Table */}
        <div className="hkb-table-wrapper">
          <div className="p-4 border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-800/60 flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase size={16} className="text-indigo-600" />
              Locked Client Deals Ledger ({allDeals.length})
            </h3>
            <span className="text-xs font-bold text-slate-500">
              Click any row to load into editor
            </span>
          </div>

          <div className="hkb-custom-slider">
            <table className="hkb-table min-w-[980px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 font-black">
                  <th>Client / Business</th>
                  <th>Total Contract</th>
                  <th>Advance Paid</th>
                  <th>Balance Due</th>
                  <th>Delivery Target</th>
                  <th>Stage</th>
                  <th className="text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingDeals ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-xs text-slate-500 font-bold">
                      <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-indigo-600" />
                      Loading deals portfolio...
                    </td>
                  </tr>
                ) : allDeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-xs text-slate-500 font-bold space-y-2">
                      <Briefcase size={32} className="mx-auto text-slate-400 opacity-60" />
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        No configured deals yet.
                      </p>
                      <p className="text-xs text-slate-500">
                        Select a won client above and save pricing, installments, and feature checklist.
                      </p>
                    </td>
                  </tr>
                ) : (
                  allDeals.map((d) => {
                    const client = leads.find(l => l.id === d.lead_id)
                    const isSelected = d.lead_id === selectedLeadId

                    return (
                      <tr
                        key={d.lead_id || d.id}
                        onClick={() => setSelectedLeadId(d.lead_id)}
                        className={`hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''
                        }`}
                      >
                        <td>
                          <div className="font-black text-slate-900 dark:text-white text-xs">
                            {d.client_name || client?.business_name || 'Client'}
                          </div>
                          {d.client_phone && (
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                              <Phone size={10} className="text-emerald-500" />
                              <span>{d.client_phone}</span>
                            </div>
                          )}
                        </td>

                        <td>
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                            {d.currency === 'USD' ? '$' : '₹'}{Number(d.deal_value).toLocaleString()}
                          </span>
                        </td>

                        <td>
                          <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {d.currency === 'USD' ? '$' : '₹'}{Number(d.advance_paid).toLocaleString()}
                          </span>
                        </td>

                        <td>
                          <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                            {d.currency === 'USD' ? '$' : '₹'}{Number(d.balance_due).toLocaleString()}
                          </span>
                        </td>

                        <td>
                          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                            {d.target_deadline || '—'}
                          </span>
                        </td>

                        <td>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            {d.stage}
                          </span>
                        </td>

                        <td className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedLeadId(d.lead_id)
                                setIsInvoiceOpen(true)
                              }}
                              className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 cursor-pointer"
                              title="Generate Invoice"
                            >
                              <Receipt size={13} />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedLeadId(d.lead_id)
                                setIsAgreementOpen(true)
                              }}
                              className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center hover:bg-purple-100 cursor-pointer"
                              title="Draft Legal Agreement"
                            >
                              <FileText size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}

export default function DealsStudioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold">Loading Deals Studio...</div>}>
      <DealsStudioContent />
    </Suspense>
  )
}
