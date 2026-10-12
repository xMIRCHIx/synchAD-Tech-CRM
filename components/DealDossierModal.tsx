'use client'

import React, { useState, useEffect } from 'react'
import {
  X, DollarSign, Calendar, ShieldCheck, Briefcase, Check,
  CreditCard, Banknote, Sparkles, AlertCircle
} from 'lucide-react'
import type { Lead, ClientDeal, DealStage, PaymentMode } from '@/lib/types'

interface DealDossierModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  onSaved: (deal: ClientDeal) => void
}

export default function DealDossierModal({
  lead,
  isOpen,
  onClose,
  onSaved
}: DealDossierModalProps) {
  const [dealValue, setDealValue] = useState<number>(35000)
  const [advancePaid, setAdvancePaid] = useState<number>(17500)
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi')
  const [serviceType, setServiceType] = useState('Custom Website + WhatsApp Booking Funnel')
  const [projectScope, setProjectScope] = useState('Responsive modern website, mobile speed optimization, and 1-tap WhatsApp booking flow.')
  const [targetDeadline, setTargetDeadline] = useState('')
  const [stage, setStage] = useState<DealStage>('closing')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!targetDeadline) {
      const d = new Date()
      d.setDate(d.getDate() + 14)
      setTargetDeadline(d.toISOString().split('T')[0])
    }
  }, [targetDeadline])

  useEffect(() => {
    if (isOpen && lead) {
      fetchDealDetails()
    }
  }, [isOpen, lead])

  async function fetchDealDetails() {
    if (!lead) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/clients/deal?leadId=${lead.id}`)
      const data = await res.json()
      if (data.deal) {
        setDealValue(Number(data.deal.deal_value) || 35000)
        setAdvancePaid(Number(data.deal.advance_paid) || 17500)
        setCurrency(data.deal.currency || 'INR')
        setPaymentMode(data.deal.payment_mode || 'upi')
        setServiceType(data.deal.service_type || 'Custom Website + WhatsApp Booking Funnel')
        setProjectScope(data.deal.project_scope || '')
        if (data.deal.target_deadline) setTargetDeadline(data.deal.target_deadline)
        if (data.deal.stage) setStage(data.deal.stage)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !lead) return null

  const balanceDue = Math.max(0, dealValue - advancePaid)
  const symbol = currency === 'INR' ? '₹' : '$'

  async function handleSave() {
    if (!lead) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/clients/deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          deal_value: dealValue,
          advance_paid: advancePaid,
          balance_due: balanceDue,
          currency,
          payment_mode: paymentMode,
          service_type: serviceType,
          project_scope: projectScope,
          target_deadline: targetDeadline,
          stage
        })
      })

      const data = await res.json()
      if (res.ok && data.deal) {
        onSaved(data.deal)
        onClose()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fade-in" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#161B22] rounded-3xl shadow-2xl border border-slate-200 dark:border-stone-800 flex flex-col overflow-hidden z-10">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-stone-800 bg-slate-50/95 dark:bg-[#1C2128] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Briefcase size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Client Deal & Project Dossier
              </h2>
              <p className="text-xs text-slate-500">
                Financials, Scope & Milestones for <strong>{lead.business_name}</strong>
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

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Financials Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-900 border border-slate-200 dark:border-stone-800 space-y-1">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 block">
                Total Deal Value ({symbol})
              </label>
              <input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(Number(e.target.value))}
                className="w-full text-base font-black font-mono bg-transparent text-slate-900 dark:text-white outline-none"
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
                className="w-full text-base font-black font-mono bg-transparent text-emerald-700 dark:text-emerald-300 outline-none"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-amber-700 dark:text-amber-300 block">
                Balance Due ({symbol})
              </label>
              <p className="text-base font-black font-mono text-amber-700 dark:text-amber-300">
                {symbol}{balanceDue.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment Mode & Currency Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CreditCard size={14} className="text-indigo-600" />
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="upi">Online UPI (PhonePe / GPay / Paytm)</option>
                <option value="bank_transfer">Direct Bank Transfer (IMPS / NEFT)</option>
                <option value="cash">Cash in Hand (Physical Collection)</option>
                <option value="stripe">Card / International (Stripe / Razorpay)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-600" />
                Target Launch Deadline
              </label>
              <input
                type="date"
                value={targetDeadline}
                onChange={(e) => setTargetDeadline(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Service Deliverable Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Service / Deliverable Type
            </label>
            <input
              type="text"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="e.g. Custom Website + WhatsApp Booking Funnel"
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>

          {/* Project Scope Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Scope of Work & Deliverables
            </label>
            <textarea
              value={projectScope}
              onChange={(e) => setProjectScope(e.target.value)}
              rows={3}
              placeholder="Technical deliverables, pages, integration details..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-slate-900 dark:text-white font-medium leading-relaxed"
            />
          </div>

          {/* Project Stage */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Project Lifecycle Stage
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { key: 'closing', label: '1. Closing Deal' },
                { key: 'in_development', label: '2. In Build' },
                { key: 'review', label: '3. Client Review' },
                { key: 'delivered', label: '4. Delivered 🚀' },
                { key: 'maintenance', label: '5. Retainer' }
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStage(s.key as DealStage)}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    stage === s.key
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-stone-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-stone-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-[#1C2128] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={14} />
            )}
            Save Deal Dossier
          </button>
        </div>

      </div>
    </div>
  )
}
