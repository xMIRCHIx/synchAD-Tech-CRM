'use client'

import React, { useState } from 'react'
import { Save, Key, MessageCircle, User, Shield, CheckCircle2, ShieldCheck } from 'lucide-react'
import Toast, { ToastMessage } from '@/components/Toast'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'whatsapp'>('api')
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setToast({
      id: String(Date.now()),
      title: 'Settings Saved',
      description: 'Your configuration has been updated successfully.',
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
                        <label className="text-xs font-bold text-[var(--foreground)]">Gemini 3.8 Flash API Key</label>
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
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--foreground)]">Agency Profile</h3>
                    <p className="text-xs text-[var(--ink-muted)] mt-0.5">Configure your outreach sender persona.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Agency / Company Name</label>
                      <input
                        type="text"
                        defaultValue="Autonomous AI Outreach Partner"
                        className="form-input text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Sender Representative Name</label>
                      <input
                        type="text"
                        defaultValue="Aryan Gupta"
                        className="form-input text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Primary Notification Email</label>
                      <input
                        type="email"
                        defaultValue="admin@leadgencrm.io"
                        className="form-input text-xs"
                      />
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
