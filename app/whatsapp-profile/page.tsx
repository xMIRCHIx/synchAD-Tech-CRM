'use client'

import React, { useEffect, useState } from 'react'
import {
  MessageCircle, ShieldCheck, CheckCircle2, AlertCircle, Save,
  RefreshCw, Globe, Mail, MapPin, Sparkles, Building2,
  ExternalLink, Info, Key, Check, Copy, ArrowUpRight, Phone,
  Camera, Eye, Smartphone, Zap
} from 'lucide-react'
import Toast, { ToastMessage } from '@/components/Toast'

interface ProfileData {
  display_name: string
  phone_number: string
  phone_number_id: string
  waba_id: string
  vertical: string
  about: string
  description: string
  email: string
  address: string
  websites: string[]
  profile_picture_url?: string
  quality_rating?: string
  verified?: boolean
}

export default function WhatsAppProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    display_name: 'Synchad',
    phone_number: '+91 70675 49982',
    phone_number_id: '1268131546394409',
    waba_id: '1114054964346569',
    vertical: 'PROF_SERVICES',
    about: 'Autonomous B2B Growth Engine • WhatsApp CRM',
    description: 'Synchad delivers autonomous B2B lead generation, website conversion audits, and 1-tap WhatsApp booking pipelines for modern businesses.',
    email: 'contact@synchad.online',
    address: 'India',
    websites: ['https://synchad.online/'],
    profile_picture_url: '',
    quality_rating: 'HIGH',
    verified: true,
  })

  const [categories, setCategories] = useState<{ value: string; label: string }[]>([])
  const [metaStatus, setMetaStatus] = useState<any>({ connected: false, status: 'loading' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [newTokenInput, setNewTokenInput] = useState('')
  const [showTokenInput, setShowTokenInput] = useState(false)

  // Fetch initial profile
  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/profile', { cache: 'no-store' })
      const data = await res.json()
      if (data.profile) {
        setProfile(data.profile)
      }
      if (data.categories) {
        setCategories(data.categories)
      }
      if (data.metaStatus) {
        setMetaStatus(data.metaStatus)
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: any = { ...profile }
      if (newTokenInput.trim()) {
        payload.accessToken = newTokenInput.trim()
      }

      const res = await fetch('/api/whatsapp/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()

      if (result.success) {
        setToast({
          id: String(Date.now()),
          title: 'Profile Updated',
          description: result.message || 'Saved successfully.',
          type: result.metaUpdated ? 'success' : 'info',
        })
        if (result.profile) {
          setProfile(result.profile)
        }
        if (newTokenInput.trim()) {
          setNewTokenInput('')
          setShowTokenInput(false)
          fetchProfile()
        }
      } else {
        setToast({
          id: String(Date.now()),
          title: 'Update Notice',
          description: result.error || 'Failed to update profile.',
          type: 'error',
        })
      }
    } catch (err: any) {
      setToast({
        id: String(Date.now()),
        title: 'Error',
        description: err.message,
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const categoryLabel =
    categories.find((c) => c.value === profile.vertical)?.label ||
    (profile.vertical === 'PROF_SERVICES' ? 'Professional Services' : profile.vertical)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1240px] mx-auto space-y-7 animate-fade-in pb-28">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <MessageCircle size={18} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--foreground)] flex items-center gap-2">
              Official WhatsApp Business Profile
            </h1>
            <span className="badge badge-good text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
              <ShieldCheck size={12} className="text-emerald-500" /> Meta Verified
            </span>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-1.5 max-w-2xl">
            Customize how your brand appears to leads and clients on WhatsApp. Updates are synced directly with Meta Cloud API and displayed in official customer chats.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchProfile}
            disabled={loading}
            className="btn btn-secondary px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Sync from Meta</span>
          </button>
          <a
            href="https://business.facebook.com/latest/whatsapp_manager/phone_numbers"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2"
          >
            <span>Meta Manager</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Meta API Connection Alert */}
      <div className={`p-4 rounded-2xl border transition-all ${
        metaStatus.status === 'live'
          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300'
          : metaStatus.status === 'token_expired'
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
          : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-900 dark:text-indigo-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {metaStatus.status === 'live' ? (
                <CheckCircle2 size={18} className="text-emerald-500" />
              ) : metaStatus.status === 'token_expired' ? (
                <AlertCircle size={18} className="text-amber-500" />
              ) : (
                <Info size={18} className="text-indigo-500" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold flex items-center gap-2">
                <span>
                  {metaStatus.status === 'live'
                    ? '✅ Connected to Live Meta Cloud API'
                    : metaStatus.status === 'token_expired'
                    ? '⚠️ Meta Access Token Expired — WhatsApp Messages NOT Delivering!'
                    : 'Meta WhatsApp Status'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                  Phone ID: {profile.phone_number_id}
                </span>
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {metaStatus.status === 'token_expired'
                  ? 'Your 24-hour temporary token has expired. Messages are being saved to CRM but NOT reaching WhatsApp. Paste a fresh token below (24h or Permanent) to restore delivery.'
                  : metaStatus.message}
              </p>
            </div>
          </div>

          {metaStatus.status !== 'live' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowTokenInput(!showTokenInput)}
                className={`text-xs font-black px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                  metaStatus.status === 'token_expired'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                    : 'underline hover:opacity-80'
                }`}
              >
                {showTokenInput ? 'Hide' : '🔑 Update Token'}
              </button>
            </div>
          )}
          {metaStatus.status === 'live' && (
            <button
              type="button"
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="text-xs font-bold underline cursor-pointer hover:opacity-80 shrink-0"
            >
              {showTokenInput ? 'Hide Token Field' : 'Rotate Token'}
            </button>
          )}
        </div>

        {/* Token Input — auto-show when expired */}
        {(showTokenInput || metaStatus.status === 'token_expired') && (
          <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 space-y-4 animate-fade-in">
            
            {/* How to get permanent token guide */}
            <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wider">📋 How to get a Permanent Token (Never Expires)</p>
              <ol className="text-[11px] space-y-1.5 list-decimal list-inside opacity-90">
                <li>Go to <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noreferrer" className="underline font-bold">Meta Business Settings → System Users</a></li>
                <li>Click <strong>Add</strong> → Create a System User (Admin role)</li>
                <li>Click your new System User → <strong>Generate New Token</strong></li>
                <li>Select your App → Enable <strong>whatsapp_business_messaging</strong> permission</li>
                <li>Set token expiry to <strong>Never</strong> → Copy the token below</li>
              </ol>
              <p className="text-[10px] opacity-70 pt-1 border-t border-black/10 dark:border-white/10">
                Or for a quick 24h token: <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="underline font-bold">Meta Developer Portal</a> → WhatsApp → API Setup → Generate Token
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5">
                Paste Your Fresh Meta Access Token
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="EAAa8Z... (paste full token here)"
                  value={newTokenInput}
                  onChange={(e) => setNewTokenInput(e.target.value)}
                  className="form-input text-xs font-mono flex-1 bg-white/70 dark:bg-black/40"
                />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!newTokenInput.trim() || saving}
                  className="btn btn-primary px-4 py-1.5 text-xs rounded-xl font-black shrink-0 shadow-md"
                >
                  {saving ? 'Verifying...' : '✅ Verify & Save'}
                </button>
              </div>
              <p className="text-[10px] opacity-70 mt-1.5">
                Token is verified against Meta API before saving. If valid, it's permanently written to <code className="font-mono bg-black/10 dark:bg-white/10 px-1 rounded">.env.local</code> and all future messages will use it automatically.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Column Grid: Left Mockup Preview, Right Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        
        {/* LEFT COLUMN: LIVE OFFICIAL WHATSAPP PREVIEW CARD (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Smartphone size={15} className="text-emerald-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                Live Customer WhatsApp Preview
              </h2>
            </div>
            <span className="badge badge-good text-[10px]">
              <Sparkles size={10} /> Real-time
            </span>
          </div>

          {/* Phone Frame / WhatsApp Profile Card */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-6">
            {/* Top decorative banner */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 opacity-90" />

            {/* Profile Avatar / Logo */}
            <div className="relative pt-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-[var(--surface)] p-1.5 shadow-xl ring-4 ring-emerald-500/20 relative group">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-[var(--line)] flex items-center justify-center overflow-hidden">
                  {profile.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <span className="font-black text-2xl tracking-tighter">Syn</span>
                      <span className="text-[10px] font-bold text-amber-500 -mt-1">chad</span>
                    </div>
                  )}
                </div>
                {/* Meta Verified badge */}
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-2 ring-[var(--surface)]" title="Meta Official Business Account">
                  <Check size={13} strokeWidth={3} />
                </div>
              </div>

              {/* Business Name & Number */}
              <div className="mt-3">
                <h3 className="text-xl font-black text-[var(--foreground)] flex items-center justify-center gap-1.5">
                  <span>{profile.display_name || 'Synchad'}</span>
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                </h3>
                <p className="text-xs font-semibold text-[var(--ink-muted)] mt-0.5">
                  {profile.phone_number || '+91 70675 49982'}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                  <Building2 size={12} />
                  <span>{categoryLabel}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Mock Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-b border-[var(--line)] py-3">
              <div className="flex flex-col items-center gap-1 text-[var(--ink-muted)] hover:text-emerald-600 transition-colors cursor-default">
                <div className="w-9 h-9 rounded-full bg-[var(--surface-alt)] flex items-center justify-center">
                  <MessageCircle size={16} className="text-emerald-600" />
                </div>
                <span className="text-[10px] font-bold">Message</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-[var(--ink-muted)] opacity-60 cursor-default">
                <div className="w-9 h-9 rounded-full bg-[var(--surface-alt)] flex items-center justify-center">
                  <Phone size={16} />
                </div>
                <span className="text-[10px] font-bold">Audio</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-[var(--ink-muted)] opacity-60 cursor-default">
                <div className="w-9 h-9 rounded-full bg-[var(--surface-alt)] flex items-center justify-center">
                  <ArrowUpRight size={16} />
                </div>
                <span className="text-[10px] font-bold">Share</span>
              </div>
            </div>

            {/* Business Bio / Description */}
            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1">
                  Business Description
                </p>
                <p className="text-[var(--foreground)] text-xs leading-relaxed bg-[var(--surface-alt)] p-3 rounded-xl border border-[var(--line)]">
                  {profile.description || 'No description provided.'}
                </p>
              </div>

              {/* Status / About */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1">
                  About / Status
                </p>
                <div className="flex items-center gap-2 p-2.5 bg-[var(--surface-alt)] rounded-xl border border-[var(--line)] text-xs font-medium text-[var(--foreground)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="truncate">{profile.about || 'Available'}</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 pt-2 border-t border-[var(--line)]">
                {profile.websites && profile.websites.length > 0 && profile.websites[0] && (
                  <div className="flex items-center gap-2.5 text-xs text-[var(--foreground)]">
                    <Globe size={14} className="text-indigo-500 shrink-0" />
                    <a
                      href={profile.websites[0]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline truncate font-semibold"
                    >
                      {profile.websites[0]}
                    </a>
                  </div>
                )}

                {profile.email && (
                  <div className="flex items-center gap-2.5 text-xs text-[var(--foreground)]">
                    <Mail size={14} className="text-amber-500 shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                )}

                {profile.address && (
                  <div className="flex items-center gap-2.5 text-xs text-[var(--foreground)]">
                    <MapPin size={14} className="text-rose-500 shrink-0" />
                    <span className="truncate">{profile.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Official Meta Badges Footer */}
            <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/15 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Quality Rating: High</span>
              </div>
              <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                Tier: Cloud API
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PROFILE CUSTOMIZER FORM (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="hkb-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
              <div>
                <h2 className="text-base font-extrabold text-[var(--foreground)]">
                  Edit WhatsApp Business Details
                </h2>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                  Update your official Meta profile details and sync in one click.
                </p>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-1 rounded-xl">
                Cloud API v21.0
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              
              {/* Row 1: Display Name & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profile.display_name}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    placeholder="e.g. Synchad"
                    className="form-input text-xs font-semibold"
                    required
                  />
                  <p className="text-[10px] text-[var(--ink-muted)]">
                    Name approved on Meta for WhatsApp outreach.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                    Registered Phone Number
                  </label>
                  <input
                    type="text"
                    value={profile.phone_number}
                    onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                    placeholder="+91..."
                    className="form-input text-xs font-mono"
                    readOnly
                  />
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Verified Meta WhatsApp sender
                  </p>
                </div>
              </div>

              {/* Row 2: Category (Meta Official Vertical) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                    Meta Business Category (Vertical)
                  </label>
                  <span className="text-[10px] font-bold text-indigo-500">
                    Official Meta Suggestions
                  </span>
                </div>
                <select
                  value={profile.vertical}
                  onChange={(e) => setProfile({ ...profile, vertical: e.target.value })}
                  className="form-input text-xs font-semibold cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[var(--ink-muted)]">
                  Specifies your official business category on WhatsApp.
                </p>
              </div>

              {/* Row 3: Logo / Profile Picture URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  Profile Thumbnail / Logo Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={profile.profile_picture_url || ''}
                    onChange={(e) => setProfile({ ...profile, profile_picture_url: e.target.value })}
                    placeholder="https://.../synchad-logo.png"
                    className="form-input text-xs flex-1 font-mono"
                  />
                  {profile.profile_picture_url && (
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, profile_picture_url: '' })}
                      className="btn btn-secondary px-3 py-1.5 text-xs rounded-xl"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[var(--ink-muted)]">
                  Square image (minimum 640x640px) shown as your WhatsApp avatar.
                </p>
              </div>

              {/* Row 4: Status / About (Max 139 characters) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                    WhatsApp About / Status
                  </label>
                  <span className={`text-[10px] font-mono ${
                    (profile.about?.length || 0) > 139 ? 'text-rose-500 font-bold' : 'text-[var(--ink-muted)]'
                  }`}>
                    {profile.about?.length || 0} / 139
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={139}
                  value={profile.about}
                  onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                  placeholder="e.g. Autonomous B2B Growth Engine • WhatsApp CRM"
                  className="form-input text-xs"
                />
              </div>

              {/* Row 5: Business Description (Max 512 characters) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                    Business Description (Bio)
                  </label>
                  <span className={`text-[10px] font-mono ${
                    (profile.description?.length || 0) > 512 ? 'text-rose-500 font-bold' : 'text-[var(--ink-muted)]'
                  }`}>
                    {profile.description?.length || 0} / 512
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={512}
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder="Describe your agency or business services..."
                  className="form-input text-xs leading-relaxed resize-none"
                />
              </div>

              {/* Row 6: Contact details (Email, Website, Address) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="contact@synchad.online"
                    className="form-input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={profile.websites?.[0] || ''}
                    onChange={(e) => setProfile({ ...profile, websites: [e.target.value] })}
                    placeholder="https://synchad.online"
                    className="form-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  Operating Address / Region
                </label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="e.g. India"
                  className="form-input text-xs"
                />
              </div>

              {/* Meta Credentials Summary Pills */}
              <div className="p-4 bg-[var(--surface-alt)] rounded-2xl border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <Key size={14} className="text-indigo-500" /> Meta Credentials Linked
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Active in .env.local
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-[var(--ink-muted)]">
                  <div className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--line)]">
                    <span className="block text-[9px] uppercase font-bold text-[var(--ink-muted)]">Phone Number ID</span>
                    <span className="text-[var(--foreground)] font-bold">{profile.phone_number_id}</span>
                  </div>
                  <div className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--line)]">
                    <span className="block text-[9px] uppercase font-bold text-[var(--ink-muted)]">WABA ID</span>
                    <span className="text-[var(--foreground)] font-bold">{profile.waba_id}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button Bar */}
              <div className="pt-4 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Saves immediately and pushes changes to Meta Graph API.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary rounded-xl px-6 py-2.5 text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Save size={15} />
                  <span>{saving ? 'Saving & Pushing to Meta...' : 'Save & Push to WhatsApp'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
