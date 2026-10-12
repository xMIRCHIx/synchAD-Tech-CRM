'use client'

import React, { useState, useEffect } from 'react'
import {
  X, DollarSign, Calendar, ShieldCheck, Briefcase, Check,
  CreditCard, Banknote, Sparkles, AlertCircle, Plus, Trash2, Tag, Layers
} from 'lucide-react'
import type { Lead, ClientDeal, DealStage, PaymentMode, DealInstallment } from '@/lib/types'

interface DealDossierModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  onSaved: (deal: ClientDeal) => void
}

const PRESET_FEATURES = [
  '⚡ Next.js Ultra-Fast Architecture',
  '📱 100% Mobile Responsive Layout',
  '💬 1-Tap WhatsApp Booking Engine',
  '📍 Google Maps & Local SEO Setup',
  '🔒 SSL Certificate & Domain Linking',
  '💳 UPI & Online Payment Gateway',
  '🛡️ 30-Day Tech Support & Bug Warranty',
  '📊 Admin Analytics CRM'
]

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

  // Features checklist
  const [features, setFeatures] = useState<string[]>([
    '⚡ Next.js Ultra-Fast Architecture',
    '📱 100% Mobile Responsive Layout',
    '💬 1-Tap WhatsApp Booking Engine',
    '📍 Google Maps & Local SEO Setup'
  ])
  const [customFeatureInput, setCustomFeatureInput] = useState('')

  // Installments list
  const [installments, setInstallments] = useState<DealInstallment[]>([
    { id: 'inst-1', label: '50% Advance Booking', amount: 17500, due_date: '', status: 'paid' },
    { id: 'inst-2', label: '50% Final Launch & Handover', amount: 17500, due_date: '', status: 'pending' }
  ])

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
        const val = Number(data.deal.deal_value) || 35000
        const adv = Number(data.deal.advance_paid) || 17500
        setDealValue(val)
        setAdvancePaid(adv)
        setCurrency(data.deal.currency || 'INR')
        setPaymentMode(data.deal.payment_mode || 'upi')
        setServiceType(data.deal.service_type || 'Custom Website + WhatsApp Booking Funnel')
        setProjectScope(data.deal.project_scope || '')
        if (data.deal.target_deadline) setTargetDeadline(data.deal.target_deadline)
        if (data.deal.stage) setStage(data.deal.stage)

        if (Array.isArray(data.deal.features) && data.deal.features.length > 0) {
          setFeatures(data.deal.features)
        }
        if (Array.isArray(data.deal.installments) && data.deal.installments.length > 0) {
          setInstallments(data.deal.installments)
        } else {
          // Default 2 installments
          const bal = Math.max(0, val - adv)
          setInstallments([
            { id: 'inst-1', label: 'Advance Booking', amount: adv, due_date: new Date().toISOString().split('T')[0], status: 'paid' },
            { id: 'inst-2', label: 'Final Milestone Handover', amount: bal, due_date: data.deal.target_deadline || '', status: 'pending' }
          ])
        }
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

  async function handleSave() {
    if (!lead) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/clients/deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          client_name: lead.business_name || lead.owner_name,
          client_phone: lead.phone,
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
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#161B22] rounded-3xl shadow-2xl border border-slate-200 dark:border-stone-800 flex flex-col overflow-hidden z-10 max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-stone-800 bg-slate-50/95 dark:bg-[#1C2128] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Briefcase size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Client Deal & Project Scope Studio
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-md font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-black">
                  WON CLIENT
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Configure pricing, installments, and feature checklist for <strong>{lead.business_name}</strong>
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

        {/* Form Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
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
              <div className="text-base font-black font-mono text-amber-700 dark:text-amber-300">
                {symbol}{balanceDue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Payment & Currency Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Preferred Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
              >
                <option value="upi">UPI / Instant QR</option>
                <option value="bank_transfer">Net Banking / NEFT / IMPS</option>
                <option value="cash">Cash / Cheque</option>
                <option value="stripe">Stripe / Card Payment</option>
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

          {/* Feature Deliverables Checklist */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-stone-900/60 border border-slate-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-600" />
                Project Features & Deliverables Checklist ({features.length} selected)
              </label>
              <span className="text-[11px] text-slate-500 font-semibold">
                Auto-fetches into Invoice & Agreement
              </span>
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
                placeholder="+ Add custom deliverable / feature..."
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

          {/* Installment Milestones */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-stone-900/60 border border-slate-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CreditCard size={14} className="text-emerald-600" />
                  Installment Milestones & Payment Schedule
                </h4>
                <p className="text-[11px] text-slate-500">
                  Kab kitna amount release hoga client se
                </p>
              </div>
              <button
                type="button"
                onClick={addInstallment}
                className="btn btn-secondary px-2.5 py-1 text-xs font-bold rounded-xl text-indigo-600 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add Installment
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
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
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

          {/* Project Scope Description */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Detailed Scope & Client Requirements Notes
            </label>
            <textarea
              rows={3}
              value={projectScope}
              onChange={(e) => setProjectScope(e.target.value)}
              placeholder="Detailed tech requirements, references, revisions policy, or handover notes..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-slate-900 dark:text-white outline-none leading-relaxed"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-stone-800 bg-slate-50/95 dark:bg-[#1C2128] flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-bold">
            Total Contracted: <span className="font-mono text-slate-900 dark:text-white font-black">{symbol}{dealValue.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary px-4 py-2 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary px-5 py-2 text-xs font-black rounded-xl cursor-pointer shadow-md shadow-indigo-500/25 flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
            >
              <Check size={14} />
              {isSaving ? 'Saving Deal...' : 'Save Deal & Scope'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
