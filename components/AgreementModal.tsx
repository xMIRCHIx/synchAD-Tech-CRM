'use client'

import React, { useState, useEffect } from 'react'
import {
  X, Sparkles, Printer, Copy, Check, MessageSquare, ShieldCheck,
  FileText, Download, Edit3, ArrowRight, RefreshCw
} from 'lucide-react'
import type { Lead } from '@/lib/types'

interface AgreementModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  dealData?: {
    deal_value: number
    advance_paid: number
    balance_due: number
    currency: string
    service_type: string
    project_scope: string
    target_deadline?: string | null
  }
}

export default function AgreementModal({
  lead,
  isOpen,
  onClose,
  dealData
}: AgreementModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [agreementText, setAgreementText] = useState('')
  const [agreementNumber, setAgreementNumber] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen && lead) {
      handleGenerateAgreement()
    } else {
      setAgreementText('')
      setAgreementNumber('')
      setIsEditing(false)
    }
  }, [isOpen, lead])

  if (!isOpen || !lead) return null

  const clientName = lead.owner_name || lead.business_name
  const dealVal = dealData?.deal_value || 35000
  const advanceVal = dealData?.advance_paid || 17500
  const balanceVal = dealData?.balance_due || (dealVal - advanceVal)
  const currency = dealData?.currency || 'INR'
  const service = dealData?.service_type || 'Custom Website + WhatsApp Booking Funnel'
  const scope = dealData?.project_scope || 'Responsive website design, mobile speed optimization, and 1-tap WhatsApp booking flow.'
  const deadline = dealData?.target_deadline || ''

  async function handleGenerateAgreement() {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/agreements/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead?.id,
          clientName,
          businessName: lead?.business_name,
          phone: lead?.phone,
          address: lead?.address,
          dealValue: dealVal,
          advancePaid: advanceVal,
          balanceDue: balanceVal,
          currency,
          serviceType: service,
          projectScope: scope,
          targetDeadline: deadline
        })
      })

      const data = await res.json()
      if (res.ok && data.agreementContent) {
        setAgreementText(data.agreementContent)
        setAgreementNumber(data.agreementNumber)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
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
    const cleanPhone = (lead?.phone || '').replace(/[^\d]/g, '')
    const symbol = currency === 'INR' ? '₹' : '$'
    const summaryMsg = `Hi ${clientName}! Please find your official SynchAD Tech Service Agreement (${agreementNumber}) details below:

📄 Project: ${service}
💰 Total Investment: ${symbol}${dealVal.toLocaleString()}
💵 Advance Deposit: ${symbol}${advanceVal.toLocaleString()}
📅 Target Delivery: ${deadline || '14 Business Days'}

We are preparing the formal legal copy for your records. Looking forward to launching your new digital platform!`

    const isDesktop = typeof window !== 'undefined' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = isDesktop
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(summaryMsg)}`
      : `https://wa.me/${cleanPhone}?text=${encodeURIComponent(summaryMsg)}`
    window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fade-in" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[850px] bg-white dark:bg-[#161B22] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-stone-800 flex flex-col overflow-hidden z-10 print:fixed print:inset-0 print:h-auto print:max-h-none print:w-full print:border-none print:shadow-none print:rounded-none">

        {/* Header Bar */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-stone-800 bg-slate-50/95 dark:bg-[#1C2128] flex items-center justify-between gap-4 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  AI Legal Service Agreement Studio
                </h2>
                {agreementNumber && (
                  <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-bold">
                    {agreementNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official B2B Contract for <strong>{lead.business_name}</strong> • Powered by Google Gemini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-stone-800 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-3 sm:px-6 border-b border-slate-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#161B22] shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAgreement}
              disabled={isGenerating}
              className="btn btn-secondary py-2 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer text-purple-700 dark:text-purple-300 disabled:opacity-50"
            >
              <RefreshCw size={13} className={isGenerating ? 'animate-spin' : ''} />
              {isGenerating ? 'Drafting via AI...' : 'Re-Draft Contract'}
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary py-2 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 size={13} />
              {isEditing ? 'Preview Mode' : 'Edit Clauses'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="btn btn-secondary py-2 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy Text'}
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
              Send to Client WA
            </button>
          </div>
        </div>

        {/* Document Content Viewport */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 md:p-10 bg-slate-100 dark:bg-[#0D1117] print:bg-white print:p-0">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 py-16">
              <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Formulating Legal Terms with Google Gemini AI...
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Drafting customized scope, IP ownership, milestone payments, and confidentiality clauses.
                </p>
              </div>
            </div>
          ) : isEditing ? (
            <div className="h-full flex flex-col">
              <textarea
                value={agreementText}
                onChange={(e) => setAgreementText(e.target.value)}
                className="w-full flex-1 p-5 rounded-2xl bg-white dark:bg-stone-900 border-2 border-purple-300 dark:border-purple-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed resize-none"
              />
            </div>
          ) : (
            <div className="max-w-[760px] mx-auto bg-white dark:bg-stone-900 shadow-lg border border-slate-200 dark:border-stone-800 rounded-2xl p-6 sm:p-10 text-slate-900 dark:text-slate-100 print:shadow-none print:border-none print:p-0">
              {/* Official Document Letterhead */}
              <div className="pb-6 border-b border-slate-200 dark:border-stone-700 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight text-indigo-700 dark:text-indigo-400">
                      SynchAD Tech
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Agency OS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Digital Product Engineering & Automated Growth Systems
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 block">
                    {agreementNumber || 'CONTRACT'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Formatted Contract Text */}
              <div className="prose prose-sm dark:prose-invert max-w-none pt-6 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {agreementText}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
