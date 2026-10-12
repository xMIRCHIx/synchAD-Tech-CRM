'use client'

import React, { useState } from 'react'
import { Save, Key, MessageCircle, User, Shield, CheckCircle2, ShieldCheck, Upload, Building, CreditCard, Banknote } from 'lucide-react'
import Toast, { ToastMessage } from '@/components/Toast'
import type { AgencyProfile } from '@/lib/types'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'whatsapp' | 'security'>('api')
  const [toast, setToast] = useState<ToastMessage | null>(null)
  
  // State for settings
  const [apiKeys, setApiKeys] = useState({
    apify: 'apify_api_************************',
    firecrawl: 'fc-************************',
    gemini: 'AQ.************************'
  })

  const [waSettings, setWaSettings] = useState({
    wabaId: '1114054964346569',
    phoneNumberId: '1268131546394409',
    accessToken: 'EAAa8ZCNHKZAnoB...'
  })

  // Admin PIN Gate State
  const [pinEnabled, setPinEnabled] = useState(false)
  const [adminPin, setAdminPin] = useState('1234')

  // Agency Profile State
  const [agencyProfile, setAgencyProfile] = useState<AgencyProfile>({
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
  })

  React.useEffect(() => {
    setPinEnabled(localStorage.getItem('synchad_admin_pin_enabled') === 'true')
    setAdminPin(localStorage.getItem('synchad_admin_pin') || '1234')
    const saved = localStorage.getItem('synchad_agency_profile')
    if (saved) {
      try {
        setAgencyProfile(prev => ({ ...prev, ...JSON.parse(saved) }))
      } catch {}
    }
  }, [])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setAgencyProfile(prev => ({ ...prev, logo_url: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('synchad_admin_pin_enabled', String(pinEnabled))
    localStorage.setItem('synchad_admin_pin', adminPin)
    localStorage.setItem('synchad_agency_profile', JSON.stringify(agencyProfile))
    setToast({
      id: String(Date.now()),
      title: 'Settings Saved',
      description: 'Your agency profile, logo, and credentials have been updated.',
      type: 'success'
    })
  }

  return (
    <div className="p-5 md:p-8 max-w-[1100px] mx-auto space-y-7 animate-fade-in pb-24">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] flex items-center gap-2">
              System Settings & Integrations
            </h1>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Manage your account credentials, AI API keys (Apify, Firecrawl, Gemini), and WhatsApp Cloud API configuration.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar Tabs */}
        <div className="w-full md:w-60 space-y-1.5 shrink-0">
          {[
            { key: 'api', label: 'API Integrations', icon: Key },
            { key: 'whatsapp', label: 'WhatsApp Config', icon: MessageCircle },
            { key: 'profile', label: 'Agency Profile', icon: User },
            { key: 'security', label: 'Admin Security PIN', icon: Shield },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl transition-all text-left cursor-pointer ${
                activeTab === key
                  ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-l-[3.5px] border-indigo-600 shadow-2xs'
                  : 'text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="hkb-card p-6 md:p-8">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* TAB 1: API INTEGRATIONS */}
              {activeTab === 'api' && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--foreground)]">API Integrations</h3>
                    <p className="text-xs text-[var(--ink-muted)] mt-0.5">Connect third-party scraping and AI intelligence engines.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Apify */}
                    <div className="p-4 bg-[var(--surface-alt)] rounded-2xl border border-[var(--line)] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[var(--foreground)]">Apify API Token</label>
                        <span className="badge badge-good text-[10px]">
                          <CheckCircle2 size={11} /> Connected & Active
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        Used by Actor <code>compass~crawler-google-places</code> to scrape real businesses directly from Google Maps.
                      </p>
                      <input
                        type="password"
                        value={apiKeys.apify}
                        onChange={e => setApiKeys({ ...apiKeys, apify: e.target.value })}
                        className="form-input text-xs font-mono"
                      />
                    </div>

                    {/* Firecrawl */}
                    <div className="p-4 bg-[var(--surface-alt)] rounded-2xl border border-[var(--line)] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[var(--foreground)]">Firecrawl API Key</label>
                        <span className="badge badge-good text-[10px]">
                          <CheckCircle2 size={11} /> Connected & Active
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        Used to scrape lead websites in clean markdown format for fast AI auditing.
                      </p>
                      <input
                        type="password"
                        value={apiKeys.firecrawl}
                        onChange={e => setApiKeys({ ...apiKeys, firecrawl: e.target.value })}
                        className="form-input text-xs font-mono"
                      />
                    </div>

                    {/* Gemini */}
                    <div className="p-4 bg-[var(--surface-alt)] rounded-2xl border border-[var(--line)] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[var(--foreground)]">Google Gemini 2.5 Flash API Key</label>
                        <span className="badge badge-good text-[10px]">
                          <CheckCircle2 size={11} /> Connected & Active
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        Used to identify website conversion bottlenecks and write personalized WhatsApp outreach pitches.
                      </p>
                      <input
                        type="password"
                        value={apiKeys.gemini}
                        onChange={e => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                        className="form-input text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: WHATSAPP CONFIG */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold text-[var(--foreground)]">WhatsApp Cloud API Configuration</h3>
                      <p className="text-xs text-[var(--ink-muted)] mt-0.5">Configure Meta Developer credentials for automated WhatsApp messaging.</p>
                    </div>
                    <a
                      href="/whatsapp-profile"
                      className="btn btn-primary px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-500/20"
                    >
                      <ShieldCheck size={14} />
                      <span>Edit Meta Profile & Logo</span>
                    </a>
                  </div>

                  {/* Profile Quick Card */}
                  <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 rounded-2xl border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Meta Verified Business</span>
                      <h4 className="text-sm font-extrabold text-[var(--foreground)] flex items-center gap-1.5">
                        Synchad (+91 70675 49982)
                        <span className="badge badge-good text-[10px]">Connected</span>
                      </h4>
                      <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                        Category: Professional Services • Website: https://synchad.online
                      </p>
                    </div>
                    <a
                      href="/whatsapp-profile"
                      className="btn btn-secondary text-xs px-3 py-1.5 rounded-xl font-bold shrink-0 flex items-center gap-1"
                    >
                      <span>Customize Public Card</span>
                    </a>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">WhatsApp Business Account ID (WABA ID)</label>
                      <input
                        type="text"
                        placeholder="e.g. 104593829482"
                        value={waSettings.wabaId}
                        onChange={e => setWaSettings({ ...waSettings, wabaId: e.target.value })}
                        className="form-input text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Phone Number ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 109823485723"
                        value={waSettings.phoneNumberId}
                        onChange={e => setWaSettings({ ...waSettings, phoneNumberId: e.target.value })}
                        className="form-input text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">System User Permanent Access Token</label>
                      <input
                        type="password"
                        placeholder="EAAB..."
                        value={waSettings.accessToken}
                        onChange={e => setWaSettings({ ...waSettings, accessToken: e.target.value })}
                        className="form-input text-xs font-mono"
                      />
                    </div>

                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
                      💡 <strong>Note:</strong> You can also use the <strong>"Open WA Web"</strong> button anywhere in the app to directly chat via your native browser or phone with pre-filled AI hooks.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AGENCY PROFILE */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--foreground)]">Agency Branding & Invoice Profile</h3>
                    <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                      Your agency logo, business address, and banking details are automatically rendered on all Invoices & Legal Agreements.
                    </p>
                  </div>

                  {/* Logo Upload Section */}
                  <div className="p-5 bg-[var(--surface-alt)] rounded-2xl border border-[var(--line)] space-y-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] block">
                      Official Agency Logo
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {agencyProfile.logo_url ? (
                        <div className="relative group">
                          <img
                            src={agencyProfile.logo_url}
                            alt="Agency Logo"
                            className="w-20 h-20 object-contain rounded-2xl border border-[var(--line)] bg-white p-2 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setAgencyProfile(prev => ({ ...prev, logo_url: '' }))}
                            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center hover:scale-105"
                            title="Remove logo"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-dashed border-indigo-300 dark:border-indigo-700 flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Upload size={22} />
                          <span className="text-[9px] font-bold mt-1">No Logo</span>
                        </div>
                      )}

                      <div className="space-y-2 flex-1 w-full">
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700 shadow-sm shadow-indigo-500/25">
                          <Upload size={13} /> Upload Image (PNG/JPG/SVG)
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        <p className="text-[11px] text-[var(--ink-muted)]">
                          Recommended format: Square or landscape transparent PNG (min 200x200px).
                        </p>
                        <input
                          type="url"
                          placeholder="Or paste direct image URL (https://...)"
                          value={agencyProfile.logo_url}
                          onChange={e => setAgencyProfile({ ...agencyProfile, logo_url: e.target.value })}
                          className="form-input text-xs font-mono w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* General Agency Info & Partnership Signatories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Agency / Legal Entity Name</label>
                      <input
                        type="text"
                        value={agencyProfile.name}
                        onChange={e => setAgencyProfile({ ...agencyProfile, name: e.target.value })}
                        className="form-input text-xs font-bold"
                      />
                    </div>

                    {/* Partnership Signatory 1 */}
                    <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        Partner 1 (Authorized Signatory)
                      </span>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--ink-muted)]">Full Name</label>
                        <input
                          type="text"
                          value={agencyProfile.representative}
                          onChange={e => setAgencyProfile({ ...agencyProfile, representative: e.target.value })}
                          className="form-input text-xs font-bold"
                          placeholder="e.g. Aryan Gupta"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--ink-muted)]">Designation / Role</label>
                        <input
                          type="text"
                          value={agencyProfile.partner1_role || ''}
                          onChange={e => setAgencyProfile({ ...agencyProfile, partner1_role: e.target.value })}
                          className="form-input text-xs font-medium"
                          placeholder="e.g. Co-Founder & Tech Director"
                        />
                      </div>
                    </div>

                    {/* Partnership Signatory 2 */}
                    <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                          Partner 2 (Authorized Signatory)
                        </span>
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--ink-muted)] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={agencyProfile.has_dual_signatories ?? true}
                            onChange={e => setAgencyProfile({ ...agencyProfile, has_dual_signatories: e.target.checked })}
                            className="rounded accent-purple-600"
                          />
                          Enable Partner 2
                        </label>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--ink-muted)]">Full Name</label>
                        <input
                          type="text"
                          value={agencyProfile.partner2_name || ''}
                          onChange={e => setAgencyProfile({ ...agencyProfile, partner2_name: e.target.value })}
                          className="form-input text-xs font-bold"
                          placeholder="e.g. Co-Founder / Business Lead"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--ink-muted)]">Designation / Role</label>
                        <input
                          type="text"
                          value={agencyProfile.partner2_role || ''}
                          onChange={e => setAgencyProfile({ ...agencyProfile, partner2_role: e.target.value })}
                          className="form-input text-xs font-medium"
                          placeholder="e.g. Co-Founder & Managing Partner"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Official Email</label>
                      <input
                        type="email"
                        value={agencyProfile.email}
                        onChange={e => setAgencyProfile({ ...agencyProfile, email: e.target.value })}
                        className="form-input text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Official Phone / WhatsApp</label>
                      <input
                        type="text"
                        value={agencyProfile.phone}
                        onChange={e => setAgencyProfile({ ...agencyProfile, phone: e.target.value })}
                        className="form-input text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Registered Business Address</label>
                    <textarea
                      rows={2}
                      value={agencyProfile.address}
                      onChange={e => setAgencyProfile({ ...agencyProfile, address: e.target.value })}
                      className="form-input text-xs font-medium resize-none"
                    />
                  </div>

                  {/* Banking & Remittance Details */}
                  <div className="p-5 bg-[var(--surface-alt)] rounded-2xl border border-[var(--line)] space-y-4">
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} className="text-indigo-600" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-[var(--foreground)]">
                        Payment & Banking Details (Appears on Invoices)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[var(--ink-muted)]">UPI ID (e.g. name@bank)</label>
                        <input
                          type="text"
                          value={agencyProfile.upi_id}
                          onChange={e => setAgencyProfile({ ...agencyProfile, upi_id: e.target.value })}
                          className="form-input text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[var(--ink-muted)]">GSTIN / Tax ID (Optional)</label>
                        <input
                          type="text"
                          value={agencyProfile.gstin}
                          onChange={e => setAgencyProfile({ ...agencyProfile, gstin: e.target.value })}
                          className="form-input text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[var(--ink-muted)]">Bank Name</label>
                        <input
                          type="text"
                          value={agencyProfile.bank_name}
                          onChange={e => setAgencyProfile({ ...agencyProfile, bank_name: e.target.value })}
                          className="form-input text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[var(--ink-muted)]">Bank Account Number</label>
                        <input
                          type="text"
                          value={agencyProfile.account_number}
                          onChange={e => setAgencyProfile({ ...agencyProfile, account_number: e.target.value })}
                          className="form-input text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[var(--ink-muted)]">IFSC Code</label>
                        <input
                          type="text"
                          value={agencyProfile.ifsc_code}
                          onChange={e => setAgencyProfile({ ...agencyProfile, ifsc_code: e.target.value })}
                          className="form-input text-xs font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ADMIN SECURITY PIN */}
              {activeTab === 'security' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--foreground)]">Admin Security PIN Gate</h3>
                    <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                      Protect your private client leads, phone numbers, and WhatsApp settings from unauthorized visitors on the public URL.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[var(--surface-alt)] border border-[var(--line)] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-[var(--foreground)] block">
                          Enable Master PIN Protection
                        </span>
                        <span className="text-xs text-[var(--ink-muted)]">
                          When turned on, a 4-digit PIN gate is required to access the CRM on any new device or session.
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pinEnabled}
                          onChange={(e) => setPinEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="pt-3 border-t border-[var(--line)] space-y-2">
                      <label className="text-xs font-bold text-[var(--foreground)] block">
                        Master Security PIN (4 to 8 Digits)
                      </label>
                      <input
                        type="password"
                        maxLength={8}
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        placeholder="1234"
                        className="form-input text-base font-mono tracking-widest font-black max-w-xs"
                      />
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        Default PIN is <code>1234</code>. Make sure to remember your PIN before locking.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-4 border-t border-[var(--line)] flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-500/25"
                >
                  <Save size={14} /> Save Configuration
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
