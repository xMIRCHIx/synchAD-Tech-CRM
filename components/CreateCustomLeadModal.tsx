'use client'

import React, { useState } from 'react'
import type { LeadStatus, Campaign } from '@/lib/types'
import { X, UserPlus, Building, Phone, Globe, MapPin, Star, Sparkles, FolderPlus } from 'lucide-react'

interface CreateCustomLeadModalProps {
  isOpen: boolean
  onClose: () => void
  campaigns: Campaign[]
  onSuccess: (message: string) => void
  defaultCampaignId?: string
}

export default function CreateCustomLeadModal({
  isOpen,
  onClose,
  campaigns,
  onSuccess,
  defaultCampaignId
}: CreateCustomLeadModalProps) {
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [address, setAddress] = useState('')
  const [googleRating, setGoogleRating] = useState('')
  const [campaignId, setCampaignId] = useState(defaultCampaignId || '')
  const [status, setStatus] = useState<LeadStatus>('review')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanName = businessName.trim()
    const cleanPhone = phone.replace(/[^\d+]/g, '').trim()

    if (!cleanName) {
      setError('Business Name is required.')
      return
    }

    if (!cleanPhone || cleanPhone.length < 7) {
      setError('Please provide a valid phone number (at least 7 digits).')
      return
    }

    setIsSubmitting(true)

    try {
      let finalWebsite = websiteUrl.trim()
      if (finalWebsite && !finalWebsite.startsWith('http')) {
        finalWebsite = `https://${finalWebsite}`
      }

      const ratingNum = googleRating ? parseFloat(googleRating) : null

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: cleanName,
          phone: cleanPhone,
          website_url: finalWebsite || null,
          address: address.trim() || 'Address not listed',
          google_rating: ratingNum && !isNaN(ratingNum) ? ratingNum : null,
          campaign_id: campaignId || null,
          status,
          notes: notes.trim() ? `[Custom Lead] ${notes.trim()}` : '[Custom Lead] Manually added custom lead',
          is_custom: true
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create custom lead')
      }

      onSuccess(`Custom Lead "${cleanName}" added to CRM!`)
      // Reset form
      setBusinessName('')
      setPhone('')
      setWebsiteUrl('')
      setAddress('')
      setGoogleRating('')
      setNotes('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Something went wrong while saving lead.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity cursor-pointer" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#161B22] rounded-3xl shadow-2xl border border-slate-200 dark:border-stone-800 flex flex-col overflow-hidden z-10 animate-scale-up max-h-[92vh]">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-stone-800 bg-slate-50/80 dark:bg-[#1C2128] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Create Custom Lead</h2>
              <p className="text-xs text-slate-500 dark:text-stone-400 font-semibold mt-0.5">
                Add a private, custom lead directly into your pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-stone-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold">
              {error}
            </div>
          )}

          {/* Business Name */}
          <div className="space-y-1">
            <label className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building size={13} className="text-indigo-600" />
              Business / Client Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Dental Studio, FitZone Gym..."
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-900 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Phone & Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Phone size={13} className="text-emerald-600" />
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-900 text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Star size={13} className="text-amber-500" />
                Google Rating (0 to 5)
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                placeholder="4.8"
                value={googleRating}
                onChange={(e) => setGoogleRating(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-900 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Website URL */}
          <div className="space-y-1">
            <label className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={13} className="text-indigo-600" />
              Website URL (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. https://apexstudio.com or leave empty if none"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-900 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={13} className="text-indigo-600" />
              Location Address
            </label>
            <input
              type="text"
              placeholder="e.g. MG Road, Indore or Connaught Place, Delhi"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-900 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Campaign & Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FolderPlus size={13} className="text-indigo-600" />
                Assign to Campaign
              </label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-900 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
              >
                <option value="">Direct / Custom Lead (No Campaign)</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-purple-600" />
                Initial CRM Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-900 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
              >
                <option value="review">Review Queue</option>
                <option value="queued">Queued for Send</option>
                <option value="sent">Already Pitched (Sent)</option>
                <option value="replied">Replied (Active Talk)</option>
                <option value="won">Won Client</option>
              </select>
            </div>
          </div>

          {/* Notes / Custom Pitch Angle */}
          <div className="space-y-1">
            <label className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Lead Notes / Custom Sales Angle
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Met at trade show, requested quick WhatsApp website demo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-900 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary rounded-xl py-2.5 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn btn-primary rounded-xl py-2.5 text-xs font-black gap-2 shadow-md shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
            >
              <UserPlus size={14} />
              {isSubmitting ? 'Saving Lead...' : 'Save Custom Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
