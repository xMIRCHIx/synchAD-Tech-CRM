'use client'

import React, { useState, useEffect } from 'react'
import {
  X, Sparkles, Printer, Copy, Check, MessageSquare, ShieldCheck,
  FileText, Download, Edit3, ArrowRight, RefreshCw, Phone, MapPin, Building
} from 'lucide-react'
import type { Lead, ClientAgreement, AgencyProfile } from '@/lib/types'
import { useData } from '@/context/DataContext'

interface AgreementModalProps {
  lead?: Lead | null
  initialAgreement?: ClientAgreement | null
  isOpen: boolean
  onClose: () => void
  dealData?: {
    deal_value?: number
    advance_paid?: number
    balance_due?: number
    currency?: string
    service_type?: string
    project_scope?: string
    target_deadline?: string | null
  }
  onAgreementCreated?: (agreement: ClientAgreement) => void
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

export default function AgreementModal({
  lead,
  initialAgreement,
  isOpen,
  onClose,
  dealData,
  onAgreementCreated
}: AgreementModalProps) {
  const { leads } = useData()

  // Agency branding profile
  const [agency, setAgency] = useState<AgencyProfile>(DEFAULT_AGENCY)

  // Client info
  const [clientMode, setClientMode] = useState<'existing' | 'custom'>(lead ? 'existing' : 'custom')
  const [clientCategoryTab, setClientCategoryTab] = useState<'won' | 'all'>('won')
  const [selectedLeadId, setSelectedLeadId] = useState<string>(lead?.id || '')
  const [clientName, setClientName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientAddress, setClientAddress] = useState('')

  // Contract parameters
  const [dealVal, setDealVal] = useState<number>(dealData?.deal_value || 35000)
  const [advanceVal, setAdvanceVal] = useState<number>(dealData?.advance_paid || 17500)
  const [service, setService] = useState(dealData?.service_type || 'Custom Website + WhatsApp Booking Funnel')
  const [scope, setScope] = useState(dealData?.project_scope || 'Responsive modern website design, mobile speed optimization, and 1-tap WhatsApp booking flow.')
  const [deadline, setDeadline] = useState(dealData?.target_deadline || '14 Business Days from advance payment')

  const [isGenerating, setIsGenerating] = useState(false)
  const [agreementText, setAgreementText] = useState('')
  const [agreementNumber, setAgreementNumber] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('13 Oct 2026')
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Load Agency Profile from LocalStorage & set effective date
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('synchad_agency_profile')
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile)
          setAgency(prev => ({ ...prev, ...parsed }))
        } catch {}
      }
      setEffectiveDate(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))
    }
  }, [isOpen])

  // Sync client details from initialAgreement, lead prop, or selected lead
  useEffect(() => {
    if (initialAgreement) {
      setAgreementNumber(initialAgreement.agreement_number)
      setAgreementText(initialAgreement.content || '')
      setBusinessName(initialAgreement.client_signatory || '')
      setClientName(initialAgreement.client_signatory || '')
      setClientPhone(initialAgreement.client_phone || '')
      setDealVal(initialAgreement.deal_value || 0)
      setService(initialAgreement.title || 'Custom Website Development Agreement')
      if (initialAgreement.effective_date) setEffectiveDate(initialAgreement.effective_date)
    } else if (lead) {
      setBusinessName(lead.business_name || '')
      setClientName(lead.owner_name || lead.business_name || '')
      setClientPhone(lead.phone || '')
      setClientAddress(lead.address || '')
      setSelectedLeadId(lead.id)
      setClientMode('existing')
    } else if (selectedLeadId) {
      const found = leads.find(l => l.id === selectedLeadId)
      if (found) {
        setBusinessName(found.business_name || '')
        setClientName(found.owner_name || found.business_name || '')
        setClientPhone(found.phone || '')
        setClientAddress(found.address || '')
      }
    }
  }, [initialAgreement, lead, selectedLeadId, leads])

  // Auto-fetch deal data when lead is picked
  useEffect(() => {
    if (selectedLeadId && !initialAgreement) {
      fetch(`/api/clients/deal?leadId=${selectedLeadId}`)
        .then(r => r.json())
        .then(data => {
          if (data.deal) {
            const d = data.deal
            if (d.deal_value) setDealVal(Number(d.deal_value))
            if (d.advance_paid) setAdvanceVal(Number(d.advance_paid))
            if (d.service_type) setService(d.service_type)
            if (d.target_deadline) setDeadline(d.target_deadline)
            if (d.features && Array.isArray(d.features) && d.features.length > 0) {
              setScope(`${d.service_type || 'Software Development'}\n\nFeatures Included:\n${d.features.map((f: string) => `• ${f}`).join('\n')}\n\n${d.project_scope || ''}`)
            } else if (d.project_scope) {
              setScope(d.project_scope)
            }
          }
        })
        .catch(() => {})
    }
  }, [selectedLeadId, initialAgreement])

  useEffect(() => {
    if (isOpen) {
      if (initialAgreement) {
        setAgreementText(initialAgreement.content || '')
        setAgreementNumber(initialAgreement.agreement_number)
      } else if (!agreementText) {
        handleGenerateAgreement()
      }
    } else {
      setAgreementText('')
      setAgreementNumber('')
      setIsEditing(false)
      setIsSaved(false)
    }
  }, [isOpen, initialAgreement])

  if (!isOpen) return null

  const balanceVal = Math.max(0, dealVal - advanceVal)

  async function handleGenerateAgreement() {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/agreements/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId || null,
          clientName: clientName || businessName || 'Client Representative',
          businessName: businessName || clientName || 'Client Business',
          phone: clientPhone,
          address: clientAddress,
          dealValue: dealVal,
          advancePaid: advanceVal,
          balanceDue: balanceVal,
          currency: 'INR',
          serviceType: service,
          projectScope: scope,
          targetDeadline: deadline
        })
      })

      const data = await res.json()
      if (data.agreementContent) {
        setAgreementText(data.agreementContent)
        setAgreementNumber(data.agreementNumber || `SYNCH-AGR-${Math.floor(1000 + Math.random() * 9000)}`)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSaveAgreement() {
    if (!agreementText) return
    try {
      const res = await fetch('/api/agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId || null,
          agreementNumber,
          title: `${service} Agreement — ${businessName || clientName}`,
          content: agreementText,
          agencySignatory: `${agency.name} (${agency.representative})`,
          clientSignatory: clientName || businessName,
          client_name: businessName || clientName,
          client_phone: clientPhone,
          dealValue: dealVal,
          status: 'sent'
        })
      })
      const data = await res.json()
      if (res.ok && data.agreement) {
        setIsSaved(true)
        if (onAgreementCreated) {
          onAgreementCreated(data.agreement)
        }
        setTimeout(() => setIsSaved(false), 3000)
      }
    } catch (err) {
      console.error(err)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(agreementText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

    const previewMsg = `Hi ${clientName || businessName}! Please review your official Service Agreement (${agreementNumber}) from ${agency.name}:

📜 Agreement: ${service}
💼 Deal Value: ₹${Number(dealVal).toLocaleString()} (Advance: ₹${Number(advanceVal).toLocaleString()})
📅 Estimated Delivery: ${deadline}

You can review and sign the full agreement text below:
----------------------------------------
${agreementText.slice(0, 700)}...

Please confirm acceptance so we can commence development immediately!`

    const isDesktop = typeof window !== 'undefined' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = isDesktop
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(previewMsg)}`
      : `https://wa.me/${cleanPhone}?text=${encodeURIComponent(previewMsg)}`
    window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fade-in" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer" onClick={onClose} />

      <div className="relative w-full max-w-4xl h-[94vh] max-h-[920px] bg-white dark:bg-[#161B22] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-stone-800 flex flex-col overflow-hidden z-10 print:fixed print:inset-0 print:h-auto print:max-h-none print:w-full print:border-none print:shadow-none print:rounded-none">

        {/* Top Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-stone-800 bg-slate-50/95 dark:bg-[#1C2128] flex items-center justify-between gap-4 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  AI Service Agreement Studio
                </h2>
                {agreementNumber && (
                  <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-bold">
                    {agreementNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Generate, review, and print legally-binding B2B software service contracts with Gemini AI.
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
              onClick={handleGenerateAgreement}
              disabled={isGenerating}
              className="btn btn-secondary py-2 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer text-indigo-700 dark:text-indigo-300"
            >
              <RefreshCw size={13} className={isGenerating ? 'animate-spin' : ''} />
              {isGenerating ? 'Drafting Contract...' : 'Regenerate AI'}
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary py-2 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 size={13} />
              {isEditing ? 'Preview Mode' : 'Edit Clauses'}
            </button>

            <button
              onClick={handleSaveAgreement}
              className="btn btn-secondary py-2 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer text-emerald-700 dark:text-emerald-300"
            >
              <Check size={13} />
              {isSaved ? 'Saved to Records!' : 'Save Contract'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="btn btn-secondary py-2 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>

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
              Send on WhatsApp
            </button>
          </div>
        </div>

        {/* Client Selector (when opened without lead) */}
        {!lead && (
          <div className="p-3 sm:px-6 bg-slate-50 dark:bg-stone-800/40 border-b border-slate-200 dark:border-stone-800 flex flex-wrap items-center gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Client Source:</span>
              <button
                type="button"
                onClick={() => setClientMode('existing')}
                className={`px-2.5 py-1 rounded-lg font-bold ${clientMode === 'existing' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-stone-900 border text-slate-600'}`}
              >
                CRM Lead
              </button>
              <button
                type="button"
                onClick={() => setClientMode('custom')}
                className={`px-2.5 py-1 rounded-lg font-bold ${clientMode === 'custom' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-stone-900 border text-slate-600'}`}
              >
                Custom Client
              </button>
            </div>

            {clientMode === 'existing' ? (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex rounded-lg bg-slate-200 dark:bg-stone-800 p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setClientCategoryTab('won')}
                    className={`px-2 py-0.5 rounded-md cursor-pointer ${
                      clientCategoryTab === 'won' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Won Clients ({leads.filter(l => l.status === 'won').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientCategoryTab('all')}
                    className={`px-2 py-0.5 rounded-md cursor-pointer ${
                      clientCategoryTab === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All Leads ({leads.length})
                  </button>
                </div>

                <select
                  value={selectedLeadId}
                  onChange={e => setSelectedLeadId(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 font-bold cursor-pointer"
                >
                  <option value="">-- Choose {clientCategoryTab === 'won' ? 'Won Client' : 'Lead'} --</option>
                  {(clientCategoryTab === 'won' ? leads.filter(l => l.status === 'won') : leads).map(l => (
                    <option key={l.id} value={l.id}>
                      {l.business_name} ({l.phone}) {l.status === 'won' ? '★ WON' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <input
                  type="text"
                  placeholder="Client / Business Name"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 font-bold text-xs"
                />
                <input
                  type="text"
                  placeholder="WhatsApp Phone"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono text-xs w-36"
                />
              </div>
            )}
          </div>
        )}

        {/* Scrollable Document Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-[#0D1117] print:bg-white print:p-0">
          <div className="max-w-[760px] mx-auto bg-white dark:bg-stone-900 shadow-xl border border-slate-200 dark:border-stone-800 rounded-3xl p-6 sm:p-10 text-slate-900 dark:text-slate-100 print:shadow-none print:border-none print:p-0 space-y-6">

            {/* Letterhead */}
            <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                {agency.logo_url ? (
                  <img
                    src={agency.logo_url}
                    alt={agency.name}
                    className="w-12 h-12 object-contain rounded-xl border border-slate-200 dark:border-stone-700 bg-white"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black flex items-center justify-center text-lg">
                    {agency.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {agency.name}
                  </h1>
                  <span className="text-[11px] text-slate-500 font-semibold block">
                    B2B Technology & Software Services Agreement
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300 block">
                  #{agreementNumber}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Effective Date: {effectiveDate}
                </span>
              </div>
            </div>

            {/* Editor or Markdown View */}
            {isGenerating ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw size={24} className="animate-spin text-purple-600 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Google Gemini AI is drafting your custom agreement clauses...
                </p>
                <p className="text-xs text-slate-500">
                  Formatting IP ownership, warranty, delivery milestones, and payment schedule.
                </p>
              </div>
            ) : isEditing ? (
              <textarea
                value={agreementText}
                onChange={(e) => setAgreementText(e.target.value)}
                rows={22}
                className="w-full p-4 rounded-2xl border border-slate-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none leading-relaxed"
              />
            ) : (
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm font-serif leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                {agreementText || 'No contract text drafted yet. Click Regenerate AI above.'}
              </div>
            )}

            {/* Signature Block for Print */}
            <div className="pt-8 border-t border-slate-200 dark:border-stone-800 flex justify-between items-end text-xs">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Accepted & Signed (Client):</p>
                <div className="mt-8 border-b border-slate-400 w-44"></div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {clientName || businessName || 'Authorized Client Representative'}
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-slate-800 dark:text-slate-200">For {agency.name}:</p>
                <div className="mt-8 border-b border-slate-400 w-44 ml-auto"></div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {agency.representative} (Authorized Signatory)
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
