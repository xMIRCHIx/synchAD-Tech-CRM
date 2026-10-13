'use client'

import React, { useState, useEffect } from 'react'
import {
  X, Printer, Check, MessageSquare, ShieldCheck,
  Building, Phone, MapPin, Sparkles, Upload, Users, Edit3, Plus, Trash2
} from 'lucide-react'
import type { Lead, ClientAgreement, AgencyProfile } from '@/lib/types'
import { useData } from '@/context/DataContext'
import { numberToWordsINR } from '@/lib/numberToWords'
import '@/app/invoice-templates.css'

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

interface DeliverableItem {
  id: string
  title: string
  description: string
  included: boolean
}

interface TimelineItem {
  week: string
  dates: string
  description: string
  paymentLink: string
}

const DEFAULT_AGENCY: AgencyProfile & { pan?: string; city?: string; state?: string } = {
  name: 'SynchAD Tech',
  representative: 'Aryan Gupta',
  partner1_role: 'Co-Founder & Technical Director',
  partner2_name: 'Harsh Vardhan',
  partner2_role: 'Co-Founder & Managing Partner',
  has_dual_signatories: true,
  email: 'hello@synchadtech.com',
  phone: '+91 70675 49982',
  address: 'Shop/Office No. 04, Commercial Complex, Sector 62, Noida, UP 201309, India',
  city: 'Noida',
  state: 'Uttar Pradesh',
  logo_url: '',
  gstin: '07AAACS1429B1Z8',
  pan: 'AAACS1429B',
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
  const [agency, setAgency] = useState<any>(DEFAULT_AGENCY)

  // Client Selection
  const [clientMode, setClientMode] = useState<'existing' | 'custom'>(lead ? 'existing' : 'custom')
  const [clientCategoryTab, setClientCategoryTab] = useState<'won' | 'all'>('won')
  const [selectedLeadId, setSelectedLeadId] = useState<string>(lead?.id || '')
  const [clientName, setClientName] = useState('Smile Care Dental Clinic')
  const [clientSignatory, setClientSignatory] = useState('Dr. Client Name, Owner')
  const [clientEmail, setClientEmail] = useState('client@smilecare.in')
  const [clientPhone, setClientPhone] = useState('+91 91234 56789')
  const [clientAddress, setClientAddress] = useState('Plot 12, Main Road, Raipur, Chhattisgarh 492001, India')
  const [clientGstin, setClientGstin] = useState('22BBBBB1111B1Z5')
  const [clientPan, setClientPan] = useState('BBBBB1111B')

  // Agreement Meta
  const [agreementNumber, setAgreementNumber] = useState('AGR-2026-001')
  const [effectiveDate, setEffectiveDate] = useState('13 October 2026')
  const [agreementPlace, setAgreementPlace] = useState('Ambikapur, Chhattisgarh')
  const [agreementVersion, setAgreementVersion] = useState('1.0')

  // Contract Parameters
  const [projectName, setProjectName] = useState('Website and local SEO set-up for Smile Care Dental Clinic')
  const [startDateStr, setStartDateStr] = useState('20 October 2026, after the first instalment is received')
  const [estimatedCompletion, setEstimatedCompletion] = useState('17 November 2026 (4 weeks from the start date)')
  const [dealVal, setDealVal] = useState<number>(48000)
  const [gstPercent, setGstPercent] = useState<number>(18)

  // Scope Deliverables
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([
    {
      id: 'd-1',
      title: 'Website design',
      description: 'Custom design for 5 pages: Home, About, Services, Gallery, Contact. Desktop, tablet and mobile.',
      included: true
    },
    {
      id: 'd-2',
      title: 'Website development',
      description: 'Fast, mobile friendly build. SSL set-up. Basic speed optimisation. Cross-browser testing.',
      included: true
    },
    {
      id: 'd-3',
      title: 'Contact and booking form',
      description: 'Appointment request form with email and WhatsApp alerts. Click-to-call and WhatsApp buttons.',
      included: true
    },
    {
      id: 'd-4',
      title: 'Google Business Profile',
      description: 'Create or fix the profile, add services, hours, photos and categories.',
      included: true
    },
    {
      id: 'd-5',
      title: 'Basic on-page SEO',
      description: 'Page titles, descriptions, headings, sitemap, Google Search Console and Analytics set-up. 10 target keywords.',
      included: true
    },
    {
      id: 'd-6',
      title: 'Training and handover',
      description: 'One 30 minute video call on how to update the site. Admin access after final payment.',
      included: true
    },
    {
      id: 'd-7',
      title: 'Revisions',
      description: '2 rounds on design, 1 round on the finished website.',
      included: true
    },
    {
      id: 'd-8',
      title: 'Free bug-fix support',
      description: '30 days after go-live.',
      included: true
    }
  ])

  // Timeline Schedule
  const [timelineWeeks, setTimelineWeeks] = useState<TimelineItem[]>([
    {
      week: '1',
      dates: '20 to 26 Oct 2026',
      description: 'Kick-off call. Client sends content and brand files. Provider plans pages.',
      paymentLink: 'Instalment 1 received'
    },
    {
      week: '2',
      dates: '27 Oct to 2 Nov 2026',
      description: 'Design draft shared. Client reviews and approves.',
      paymentLink: 'Instalment 2 on design approval'
    },
    {
      week: '3',
      dates: '3 to 9 Nov 2026',
      description: 'Development, forms and Google Business Profile.',
      paymentLink: 'None'
    },
    {
      week: '4',
      dates: '10 to 17 Nov 2026',
      description: 'Testing, fixes, final review, go-live and training.',
      paymentLink: 'Instalment 3 before go-live'
    }
  ])

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
      setEffectiveDate(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))
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
    if (selectedLeadId && !initialAgreement) {
      fetch(`/api/clients/deal?leadId=${selectedLeadId}`)
        .then(r => r.json())
        .then(data => {
          if (data.deal) {
            const d = data.deal
            if (d.deal_value) setDealVal(Number(d.deal_value))
            if (d.service_type) setProjectName(`${d.service_type} for ${clientName || 'Client'}`)
            if (d.target_deadline) setEstimatedCompletion(d.target_deadline)
          }
        })
        .catch(() => {})
    }
  }, [selectedLeadId, initialAgreement])

  if (!isOpen) return null

  // Financial calculations
  const gstAmount = Math.round((dealVal * gstPercent) / 100)
  const totalPayable = dealVal + gstAmount
  const amountInWords = numberToWordsINR(totalPayable)

  // 3 Instalments: 40% (Advance), 30% (Design Approval), 30% (Before Go-Live)
  const inst1Share = 40
  const inst2Share = 30
  const inst3Share = 30

  const inst1Fee = Math.round((dealVal * inst1Share) / 100)
  const inst1Gst = Math.round((gstAmount * inst1Share) / 100)
  const inst1Tot = inst1Fee + inst1Gst

  const inst2Fee = Math.round((dealVal * inst2Share) / 100)
  const inst2Gst = Math.round((gstAmount * inst2Share) / 100)
  const inst2Tot = inst2Fee + inst2Gst

  const inst3Fee = Math.round((dealVal * inst3Share) / 100)
  const inst3Gst = Math.round((gstAmount * inst3Share) / 100)
  const inst3Tot = inst3Fee + inst3Gst

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

  function handlePrint() {
    window.print()
  }

  function handleSendWhatsApp() {
    const cleanPhone = clientPhone.replace(/[^\d]/g, '')
    if (!cleanPhone) {
      alert('Please enter a valid client phone number for WhatsApp dispatch.')
      return
    }

    const msg = `Hi ${clientName}! Please review your official Services Agreement (${agreementNumber}) from ${agency.name}:

📜 Agreement: ${projectName}
📅 Date: ${effectiveDate}
💵 Total Value: ₹${totalPayable.toLocaleString()} (Including GST)
💼 Advance Required: ₹${inst1Tot.toLocaleString()}

Authorized Signatories:
• ${agency.representative} (${agency.partner1_role || 'Director'})
${(agency.has_dual_signatories ?? true) ? `• ${agency.partner2_name} (${agency.partner2_role || 'Managing Partner'})\n` : ''}
Thank you for choosing ${agency.name}!`

    const isDesktop = typeof window !== 'undefined' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = isDesktop
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  async function handleSaveAgreement() {
    try {
      const agencySig = (agency.has_dual_signatories ?? true) && agency.partner2_name
        ? `${agency.representative} & ${agency.partner2_name} (${agency.name})`
        : `${agency.representative} (${agency.name})`

      const res = await fetch('/api/agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId || null,
          agreementNumber,
          title: projectName,
          content: `Website & Digital Services Agreement: Total Value ₹${totalPayable}`,
          agencySignatory: agencySig,
          clientSignatory: clientName,
          client_name: clientName,
          client_phone: clientPhone,
          dealValue: totalPayable,
          status: 'sent'
        })
      })

      const data = await res.json()
      if (res.ok && data.agreement) {
        setIsSaved(true)
        if (onAgreementCreated) onAgreementCreated(data.agreement)
        setTimeout(() => setIsSaved(false), 3000)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative w-full h-full max-w-[1600px] max-h-[96vh] m-2 bg-stone-900 border border-stone-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:m-0 print:rounded-none print:max-w-none print:max-h-none print:h-auto print:w-auto">

        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-3 sm:px-6 border-b border-stone-800 flex items-center justify-between bg-stone-950 text-white shrink-0 print:hidden BLzxva_noPrint">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  Services Agreement Studio
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                  {agreementNumber}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Formal legal contract with structured clauses, payment schedule, dual signatures, and annexures.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAgreement}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Check size={14} />
              {isSaved ? 'Saved!' : 'Save Contract'}
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
                <Building size={13} className="text-purple-400" /> 1. Client Party Details
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
                  placeholder="Represented by (Name & Role)"
                  value={clientSignatory}
                  onChange={e => setClientSignatory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 text-white text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Phone"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 text-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 text-white text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Client GSTIN"
                    value={clientGstin}
                    onChange={e => setClientGstin(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 text-white text-xs font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Client PAN"
                    value={clientPan}
                    onChange={e => setClientPan(e.target.value)}
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

            {/* 2. Agreement Meta & Project */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
              <span className="font-extrabold text-stone-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-purple-400" /> 2. Contract Terms & Pricing
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Agreement No.</label>
                  <input
                    type="text"
                    value={agreementNumber}
                    onChange={e => setAgreementNumber(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-stone-700 bg-stone-900 text-white font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Execution Place</label>
                  <input
                    type="text"
                    value={agreementPlace}
                    onChange={e => setAgreementPlace(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-stone-700 bg-stone-900 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">Project Scope Title</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 text-white text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Project Fee (₹, Excl. GST)</label>
                  <input
                    type="number"
                    value={dealVal}
                    onChange={e => setDealVal(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded-lg border border-stone-700 bg-stone-900 text-white font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">GST Rate (%)</label>
                  <input
                    type="number"
                    value={gstPercent}
                    onChange={e => setGstPercent(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded-lg border border-stone-700 bg-stone-900 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">Estimated Completion</label>
                <input
                  type="text"
                  value={estimatedCompletion}
                  onChange={e => setEstimatedCompletion(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 text-white text-xs"
                />
              </div>
            </div>

            {/* 3. Dual Signatories */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-stone-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={13} className="text-purple-400" /> 3. Dual Partners (Signatories)
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

          {/* RIGHT: High-Fidelity Printable Services Agreement (Exact Template Design) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-950/60 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
            
            <div className="BLzxva_doc Uvh_Ra_sheet BLzxva_printable">

              {/* HEAD: Logo, Seller Info & Metadata */}
              <div className="Uvh_Ra_head">
                <div>
                  {agency.logo_url ? (
                    <img src={agency.logo_url} alt={agency.name} className="BLzxva_logoImg" />
                  ) : (
                    <div className="BLzxva_logo">
                      <span>{agency.name}</span>
                      <small>PNG or SVG, about 60 x 20 mm</small>
                    </div>
                  )}

                  <div className="Uvh_Ra_sellerLine">
                    <b>{agency.name}</b><br />
                    {agency.address}<br />
                    GSTIN {agency.gstin || '22AAAAA0000A1Z5'}
                  </div>
                </div>

                <div className="Uvh_Ra_agmeta">
                  <b>Agreement no.</b> {agreementNumber}<br />
                  <b>Date</b> {effectiveDate}<br />
                  <b>Place</b> {agreementPlace}<br />
                  <b>Version</b> {agreementVersion}
                </div>
              </div>

              {/* Gradient Divider */}
              <div className="BLzxva_rule Uvh_Ra_ruleGap"></div>

              {/* TITLE & LEAD */}
              <h1 className="Uvh_Ra_titleH">Website and Digital Services Agreement</h1>
              <p className="Uvh_Ra_lead">
                This agreement is made on {effectiveDate} at {agreementPlace}, between the two parties below.
              </p>

              {/* PARTIES CARDS */}
              <div className="Uvh_Ra_parties">
                {/* Service Provider */}
                <div className="Uvh_Ra_party">
                  <div className="Uvh_Ra_role">Service provider (&quot;Provider&quot;)</div>
                  <div className="Uvh_Ra_partyName">{agency.name}</div>
                  {agency.address}<br />
                  GSTIN {agency.gstin || '22AAAAA0000A1Z5'}, PAN {agency.pan || 'AAAAA0000A'}<br />
                  Represented by {agency.representative}, {agency.partner1_role || 'Director'}
                  {(agency.has_dual_signatories ?? true) && agency.partner2_name ? ` and ${agency.partner2_name}, ${agency.partner2_role || 'Managing Partner'}` : ''}<br />
                  {agency.email}, {agency.phone}
                </div>

                {/* Client */}
                <div className="Uvh_Ra_party">
                  <div className="Uvh_Ra_role">Client (&quot;Client&quot;)</div>
                  <div className="Uvh_Ra_partyName">{clientName}</div>
                  {clientAddress}<br />
                  GSTIN {clientGstin}, PAN {clientPan}<br />
                  Represented by {clientSignatory}<br />
                  {clientEmail}, {clientPhone}
                </div>
              </div>

              {/* AT A GLANCE TABLE */}
              <div className="Uvh_Ra_glance">
                <table>
                  <tbody>
                    <tr><td>Project</td><td><b>{projectName}</b></td></tr>
                    <tr><td>Start date</td><td>{startDateStr}</td></tr>
                    <tr><td>Estimated completion</td><td>{estimatedCompletion}</td></tr>
                    <tr><td>Provider contact</td><td>{agency.representative}, {agency.phone}, {agency.email}</td></tr>
                    <tr><td>Client contact</td><td>{clientSignatory}, {clientPhone}, {clientEmail}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* PRICE AND PAYMENT BOX */}
              <div className="Uvh_Ra_pricebox">
                <div className="Uvh_Ra_ph">
                  <b>Price and payment</b>
                  <span>All amounts in Indian Rupees</span>
                </div>

                <div className="Uvh_Ra_pgrid">
                  <div>
                    <table className="Uvh_Ra_pt">
                      <tbody>
                        <tr><td>Project fee (before GST)</td><td className="Uvh_Ra_num">₹{dealVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                        <tr><td>GST @ {gstPercent}%</td><td className="Uvh_Ra_num">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                        <tr className="Uvh_Ra_totRow"><td>Total payable</td><td className="Uvh_Ra_num">₹{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                      </tbody>
                    </table>
                    <div className="Uvh_Ra_inwords">
                      In words: <b>{amountInWords}</b>
                    </div>
                  </div>

                  <div className="Uvh_Ra_extras">
                    <b>Not included in this price</b><br />
                    Domain name and hosting (paid by the Client at actual cost), paid advertising spend, stock photos or paid plugins, content writing and photography, and any work outside the scope in Annexure A. Extra work is quoted in writing before it starts.
                  </div>
                </div>

                {/* INSTALMENTS TABLE */}
                <table className="Uvh_Ra_inst">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th>Instalment</th>
                      <th className="Uvh_Ra_num" style={{ width: '8%' }}>Share</th>
                      <th className="Uvh_Ra_num" style={{ width: '14%' }}>Fee (₹)</th>
                      <th className="Uvh_Ra_num" style={{ width: '12%' }}>GST (₹)</th>
                      <th className="Uvh_Ra_num" style={{ width: '15%' }}>Payable (₹)</th>
                      <th style={{ width: '20%' }}>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>On signing this agreement (advance)</td>
                      <td className="Uvh_Ra_num">{inst1Share}%</td>
                      <td className="Uvh_Ra_num">{inst1Fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="Uvh_Ra_num">{inst1Gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="Uvh_Ra_num"><b>{inst1Tot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></td>
                      <td>On signing</td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td>On approval of the website design</td>
                      <td className="Uvh_Ra_num">{inst2Share}%</td>
                      <td className="Uvh_Ra_num">{inst2Fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="Uvh_Ra_num">{inst2Gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="Uvh_Ra_num"><b>{inst2Tot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></td>
                      <td>Within 3 days of approval</td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td>Before go-live, after final testing</td>
                      <td className="Uvh_Ra_num">{inst3Share}%</td>
                      <td className="Uvh_Ra_num">{inst3Fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="Uvh_Ra_num">{inst3Gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="Uvh_Ra_num"><b>{inst3Tot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></td>
                      <td>Before go-live</td>
                    </tr>
                    <tr className="Uvh_Ra_sumRow">
                      <td></td>
                      <td>Total</td>
                      <td className="Uvh_Ra_num">100%</td>
                      <td className="Uvh_Ra_num">{dealVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="Uvh_Ra_num">{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="Uvh_Ra_num">{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>

                <div className="Uvh_Ra_extras">
                  Payment is made by bank transfer or UPI to the account named on each invoice. The Provider issues a GST invoice for each instalment.
                </div>
              </div>

              {/* SECTIONS 1 TO 16 (CLEAN, PROFESSIONAL LEGAL CLAUSES - NO RAW ##) */}
              <section>
                <h2 className="Uvh_Ra_sec">1. What this agreement covers</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">1.1</span>
                  <span>The Provider will design, build and launch the website and related services described in Annexure A (the &quot;Work&quot;) for the Client.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">1.2</span>
                  <span>Annexure A (scope) and Annexure B (timeline) are part of this agreement. If they conflict with the clauses, the clauses apply.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">2. Timeline and delivery</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">2.1</span>
                  <span>The Provider will follow the timeline in Annexure B. The dates assume the Client gives content, approvals and access on time (see clause 5).</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">2.2</span>
                  <span>If the Client is late, the dates move by the same number of days. The Provider is not in breach for delay caused by the Client.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">2.3</span>
                  <span>The Work is delivered when the website is live on the Client’s domain, or when the Provider hands over the final files, whichever is agreed in Annexure A.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">3. Fees, taxes and payment</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">3.1</span>
                  <span>The Client will pay the total price and instalments shown in the Price and payment box on page 1.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">3.2</span>
                  <span>Work on each stage starts when the matching instalment is received in full. The Provider may pause the Work if an instalment is more than 7 days late.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">3.3</span>
                  <span>GST at the rate in force is added to the fee. If the rate changes, the new rate applies from the date of change. Taxes withheld by the Client (TDS) must be deposited and a certificate shared.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">3.4</span>
                  <span>Late payment attracts a charge of 1.5% per month on the overdue amount, counted per day.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">3.5</span>
                  <span>Final handover, admin access and source files are released only after the last instalment is received.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">4. Provider responsibilities</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">4.1</span>
                  <span>The Provider will carry out the Work with reasonable skill and care, using suitably skilled people.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">4.2</span>
                  <span>The Provider will keep the Client informed on progress and share drafts for approval at the stages in Annexure B.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">4.3</span>
                  <span>The Provider may use freelancers or subcontractors and remains responsible for their work.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">5. Client responsibilities</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">5.1</span>
                  <span>The Client will give text, logos, photos, service details and other material in a usable form within 5 working days of the start date.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">5.2</span>
                  <span>The Client will review drafts and reply within 3 working days. Silence for 7 days after a draft is shared counts as approval of that stage.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">5.3</span>
                  <span>The Client confirms that it owns, or has the right to use, all material it supplies, and that the material does not break any law or third-party right.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">5.4</span>
                  <span>The Client will arrange its own accounts for the domain, hosting and third-party tools, and give the Provider the access it needs.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">6. Revisions and change requests</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">6.1</span>
                  <span>The price includes 2 rounds of revisions on the design and 1 round on the finished website. A round means one consolidated list of changes.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">6.2</span>
                  <span>Anything beyond the scope or the included rounds is a change request. The Provider will quote its cost and time in writing. Work starts only after the Client agrees. Rate for extra work: ₹1,000 per hour.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">7. Ownership and use of the Work</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">7.1</span>
                  <span>After the Client pays all amounts due, the Client owns the final website design, text and images made specifically for it.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">7.2</span>
                  <span>The Provider keeps ownership of its pre-existing tools, code libraries, templates and know-how. The Client gets a non-exclusive licence to use them as part of the website.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">7.3</span>
                  <span>Third-party items (fonts, plugins, themes, stock images) stay under their own licences. Their licence fees are the Client’s cost.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">7.4</span>
                  <span>The Provider may show the finished website in its portfolio and case studies, unless the Client objects in writing.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">8. Confidentiality</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">8.1</span>
                  <span>Each party will keep the other’s non-public business, pricing, customer and technical information confidential. It will use it only for this project.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">8.2</span>
                  <span>This does not apply to information that is public, already known, or must be disclosed by law. This clause continues for 2 years after the agreement ends.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">9. Hosting, domain and third-party services</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">9.1</span>
                  <span>Hosting, domain, email, SMS, payment gateway, WhatsApp and similar services are provided by third parties. Their fees and terms are separate from this agreement.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">9.2</span>
                  <span>The Provider is not responsible for outages, price changes or policy changes of third-party services.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">10. Support and warranty</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">10.1</span>
                  <span>For 30 days after go-live, the Provider will fix bugs in the delivered Work free of charge. This does not cover new features, content changes or problems caused by the Client or third parties.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">10.2</span>
                  <span>Support after 30 days is available under a separate written plan or at the rate in clause 6.2.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">10.3</span>
                  <span>The Provider does not promise search rankings, traffic, leads or sales. These depend on many things outside its control.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">11. Limit of liability</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">11.1</span>
                  <span>Neither party is liable for indirect or consequential loss, including lost profit or lost business.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">11.2</span>
                  <span>The total liability of the Provider under this agreement is limited to the fees the Client has actually paid for the Work.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">11.3</span>
                  <span>Nothing here limits liability that cannot be limited by law, such as fraud.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">12. Term and ending the agreement</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">12.1</span>
                  <span>This agreement starts on the date above and runs until the Work is delivered and all payments are made.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">12.2</span>
                  <span>Either party may end it with 7 days’ written notice. Either party may end it at once if the other breaks a material term and does not fix it within 7 days of written notice.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">12.3</span>
                  <span>On ending, the Client pays for all Work done up to the end date. Any advance paid is first set against this amount. The Provider refunds the unused balance within 15 days. Completed work and files are handed over once all dues are paid.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">12.4</span>
                  <span>Clauses on payment, ownership, confidentiality, liability and disputes continue after the agreement ends.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">13. Events beyond control</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">13.1</span>
                  <span>Neither party is liable for delay caused by events beyond its reasonable control, such as natural disasters, power or internet failure, government orders, strikes or war. The affected party will tell the other promptly and resume as soon as it can.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">14. Disputes and governing law</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">14.1</span>
                  <span>The parties will first try to settle any dispute by talking, within 15 days of written notice of the dispute.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">14.2</span>
                  <span>If it is not settled, the dispute goes to arbitration by a sole arbitrator under the Arbitration and Conciliation Act, 1996. The seat and venue is {agreementPlace}. The language is English.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">14.3</span>
                  <span>This agreement is governed by the laws of India. Subject to clause 14.2, the courts at {agreementPlace} have exclusive jurisdiction.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">15. Notices</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">15.1</span>
                  <span>Notices must be in writing and sent to the email or address on page 1. An email is treated as received on the next working day. A letter by courier is treated as received after 3 working days.</span>
                </div>
              </section>

              <section>
                <h2 className="Uvh_Ra_sec">16. General</h2>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">16.1</span>
                  <span>This agreement is the full agreement between the parties on this project. It replaces earlier talks and messages.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">16.2</span>
                  <span>Changes must be in writing and signed (or accepted by email) by both parties.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">16.3</span>
                  <span>If a clause is found invalid, the rest of the agreement still applies.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">16.4</span>
                  <span>Neither party may transfer its rights or duties without the other’s written consent.</span>
                </div>
                <div className="Uvh_Ra_clause">
                  <span className="Uvh_Ra_clauseNo">16.5</span>
                  <span>The parties may sign in counterparts and by electronic signature. Each is valid as an original.</span>
                </div>
              </section>

              {/* SIGNATURES: DUAL PARTNERS + CLIENT */}
              <h2 className="Uvh_Ra_sec">Signatures</h2>
              <p className="Uvh_Ra_p">
                The parties have read and understood this agreement and sign it on the date written on page 1.
              </p>

              <div className="Uvh_Ra_sigs">
                {/* Partner 1 */}
                <div className="Uvh_Ra_sig">
                  <div className="Uvh_Ra_who">For the Provider (Partner 1)</div>
                  <div>{agency.name}</div>
                  <div className="Uvh_Ra_space"><span>Signature</span><span>Company stamp</span></div>
                  <div className="Uvh_Ra_ln"><span>Name</span><span>{agency.representative || 'Aryan Gupta'}</span></div>
                  <div className="Uvh_Ra_ln"><span>Title</span><span>{agency.partner1_role || 'Director'}</span></div>
                  <div className="Uvh_Ra_ln"><span>Date</span><span>&nbsp;</span></div>
                  <div className="Uvh_Ra_ln"><span>Place</span><span>{agreementPlace}</span></div>
                </div>

                {/* Partner 2 (If Dual Signatories) */}
                {(agency.has_dual_signatories ?? true) && (
                  <div className="Uvh_Ra_sig">
                    <div className="Uvh_Ra_who">For the Provider (Partner 2)</div>
                    <div>{agency.name}</div>
                    <div className="Uvh_Ra_space"><span>Signature</span><span>Company stamp</span></div>
                    <div className="Uvh_Ra_ln"><span>Name</span><span>{agency.partner2_name || 'Harsh Vardhan'}</span></div>
                    <div className="Uvh_Ra_ln"><span>Title</span><span>{agency.partner2_role || 'Managing Partner'}</span></div>
                    <div className="Uvh_Ra_ln"><span>Date</span><span>&nbsp;</span></div>
                    <div className="Uvh_Ra_ln"><span>Place</span><span>{agreementPlace}</span></div>
                  </div>
                )}

                {/* Client */}
                <div className="Uvh_Ra_sig">
                  <div className="Uvh_Ra_who">For the Client</div>
                  <div>{clientName}</div>
                  <div className="Uvh_Ra_space"><span>Signature</span><span>Company stamp</span></div>
                  <div className="Uvh_Ra_ln"><span>Name</span><span>{clientSignatory.split(',')[0]}</span></div>
                  <div className="Uvh_Ra_ln"><span>Title</span><span>Owner</span></div>
                  <div className="Uvh_Ra_ln"><span>Date</span><span>&nbsp;</span></div>
                  <div className="Uvh_Ra_ln"><span>Place</span><span>{clientAddress.split(',').pop()?.trim() || agreementPlace}</span></div>
                </div>
              </div>

              {/* WITNESSES */}
              <div className="Uvh_Ra_wit">
                <div>Witness 1: name, address and signature</div>
                <div>Witness 2: name, address and signature</div>
              </div>

              {/* ANNEXURE A: SCOPE OF WORK */}
              <div className="Uvh_Ra_annex">
                <h2 className="Uvh_Ra_annexTitle">Annexure A: Scope of work</h2>
                <p className="Uvh_Ra_p BLzxva_muted">The Work includes only the items marked below.</p>

                <table className="Uvh_Ra_sc">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th>Deliverable</th>
                      <th style={{ width: '17%' }}>Included</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliverables.map((d, idx) => (
                      <tr key={d.id}>
                        <td>{idx + 1}</td>
                        <td>
                          <b>{d.title}</b>
                          <small>{d.description}</small>
                        </td>
                        <td>
                          <span className="Uvh_Ra_chk"></span>Yes
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="Uvh_Ra_two">
                  <div className="Uvh_Ra_listbox">
                    <b>What the Client provides</b>
                    <ul>
                      <li>Logo, brand colours and photos</li>
                      <li>Text for each page, or notes for the Provider to draft</li>
                      <li>Domain and hosting access</li>
                      <li>Google account access for the profile</li>
                      <li>One person who can approve work</li>
                    </ul>
                  </div>

                  <div className="Uvh_Ra_listbox">
                    <b>Not included</b>
                    <ul>
                      <li>Content writing, photography, video</li>
                      <li>Paid ads and ad management</li>
                      <li>Domain, hosting and paid plugin fees</li>
                      <li>Online payments or e-commerce</li>
                      <li>Monthly maintenance after 30 days</li>
                    </ul>
                  </div>
                </div>

                {/* ANNEXURE B: TIMELINE */}
                <h2 className="Uvh_Ra_annexTitle Uvh_Ra_annexTitleGap">Annexure B: Timeline</h2>
                <p className="Uvh_Ra_p BLzxva_muted">
                  Dates start when the first instalment is received and the Client has shared the material in clause 5.1.
                </p>

                <table className="Uvh_Ra_sc">
                  <thead>
                    <tr>
                      <th style={{ width: '12%' }}>Week</th>
                      <th style={{ width: '22%' }}>Dates</th>
                      <th>What happens</th>
                      <th style={{ width: '24%' }}>Payment link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timelineWeeks.map(tw => (
                      <tr key={tw.week}>
                        <td>Week {tw.week}</td>
                        <td>{tw.dates}</td>
                        <td>{tw.description}</td>
                        <td>{tw.paymentLink}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
