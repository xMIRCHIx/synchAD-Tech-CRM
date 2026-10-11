'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Sparkles, Send, Bot, User, X, Check, Globe, AlertTriangle,
  ArrowRight, RefreshCw, Zap, CheckCircle2, Sliders, ShieldAlert,
  ChevronRight, Compass, MessageSquare, HelpCircle, Layers, Lightbulb
} from 'lucide-react'
import { useData } from '@/context/DataContext'
import Toast, { ToastMessage } from '@/components/Toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  proposal?: CampaignProposal | null
  createdCampaignId?: string | null
}

interface CampaignProposal {
  name: string
  niche: string
  searchQuery: string
  location: string
  maxLeads: number
  targetWebsiteTypes?: ('none' | 'broken' | 'exists')[]
}

interface CampaignAiCopilotProps {
  isOpen: boolean
  onClose: () => void
  onCampaignCreated?: (campaign: any) => void
}

const PRESET_CAMPAIGNS = [
  { label: '🏥 Mumbai Dentists (No Website)', query: 'Mumbai me dentists ke bina website wale campaign bana do' },
  { label: '☕ Bangalore Cafes (Broken Sites)', query: 'Bangalore cafes with broken websites' },
  { label: '🏋️ Delhi Gyms (40 Leads)', query: 'Delhi gyms outreach campaign for 40 leads' },
  { label: '🏢 Pune Real Estate (No Site)', query: 'Pune real estate agencies bina website wale' },
  { label: '💇 Jaipur Salons & Spas', query: 'Jaipur luxury salons and beauty spas outreach' },
]

const PRESET_QUESTIONS = [
  { label: '🎯 Bina Website Pitch Hook', query: 'Bina website wale leads ko WhatsApp par kya pitch karein ki wo turant reply karein?' },
  { label: '🔥 Top 3 Niches in India', query: 'India me sabse zyada convert hone wale top 3 local niches kaunse hain?' },
  { label: '⚠️ Broken Website Pitch', query: 'Broken website wale clients ko kaise approach karein?' },
  { label: '📈 30%+ WhatsApp Reply Rate', query: 'Cold WhatsApp outreach me high reply rate pane ke 3 best golden rules kya hain?' },
]

export default function CampaignAiCopilot({
  isOpen,
  onClose,
  onCampaignCreated,
}: CampaignAiCopilotProps) {
  const { refreshAll } = useData()
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Namaste! Main aapka **Gemini AI Campaign Copilot** hoon.\n\nAap mujhse **koi bhi B2B lead generation & outreach strategy** pooch sakte hain, ya fir **seedha command dekar nayi campaign banwa sakte hain**!\n\n👇 **Neeche diye gaye quick buttons par click karke turant try karein!**`,
    },
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [launchingId, setLaunchingId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [activeSuggestionTab, setActiveSuggestionTab] = useState<'campaigns' | 'strategy'>('campaigns')

  // Multi-select Website Filter Preferences
  const [selectedWebFilters, setSelectedWebFilters] = useState<string[]>(['none', 'broken'])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock background scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return

    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (!isOpen || !mounted) return null

  const toggleWebFilter = (key: string) => {
    if (key === 'all') {
      setSelectedWebFilters(['none', 'broken', 'exists'])
      return
    }

    setSelectedWebFilters((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev
        return prev.filter((k) => k !== key)
      } else {
        return [...prev, key]
      }
    })
  }

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim()
    if (!textToSend || loading) return

    const userMessage: Message = {
      id: String(Date.now()),
      role: 'user',
      content: textToSend,
    }

    setMessages((prev) => [...prev, userMessage])
    if (!customPrompt) setInput('')
    setLoading(true)

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/campaigns/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          targetWebsiteTypes: selectedWebFilters,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response from Gemini AI')
      }

      const botMessage: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: data.text || 'Campaign generated.',
        proposal: data.proposal || null,
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (err: any) {
      console.error('AI chat error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: `⚠️ Error: ${err.message}. Please check your connection or GEMINI_API_KEY in .env.local.`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Launch proposed campaign directly into database & Apify
  const handleLaunchCampaign = async (proposal: CampaignProposal, msgId: string) => {
    setLaunchingId(msgId)
    try {
      const filtersToUse = proposal.targetWebsiteTypes && proposal.targetWebsiteTypes.length > 0
        ? proposal.targetWebsiteTypes
        : selectedWebFilters

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: proposal.name,
          searchQuery: proposal.searchQuery,
          location: proposal.location,
          niche: proposal.niche,
          maxLeads: proposal.maxLeads || 40,
          targetWebsiteTypes: filtersToUse,
          instantScrape: true,
          requirePhone: true,
          autoEnrich: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create campaign')
      }

      // Refresh global DataContext
      await refreshAll(true)

      // Mark message as launched
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, createdCampaignId: data.campaign?.id || 'created' } : m
        )
      )

      setToast({
        id: String(Date.now()),
        title: 'Campaign Launched!',
        description: `"${proposal.name}" is now live in CRM with ${data.leadsImported || 0} scraped leads.`,
        type: 'success',
      })

      if (onCampaignCreated) {
        onCampaignCreated(data.campaign)
      }
    } catch (err: any) {
      console.error('Failed to launch campaign from AI proposal:', err)
      setToast({
        id: String(Date.now()),
        title: 'Launch Failed',
        description: err.message,
        type: 'error',
      })
    } finally {
      setLaunchingId(null)
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Dimmed Focus Backdrop with Glass Blur */}
      <div
        className="fixed inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Main Centered Floating Popup Window */}
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[820px] bg-white dark:bg-[#161B22] rounded-3xl shadow-2xl border border-slate-200 dark:border-stone-800 flex flex-col overflow-hidden z-10 animate-fade-in">
        
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-[#1C2128] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Campaign AI Copilot
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Gemini AI Online
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                Strategy advice ya natural language command dekar instant campaign banwayein.
              </p>
            </div>
          </div>

          {/* High Visibility Close Button */}
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-200/80 dark:bg-stone-800 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
            title="Close Chat (Escape)"
          >
            <X size={16} />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>

        {/* Website Presence Multi-Select Filter Bar */}
        <div className="px-4 py-2.5 bg-indigo-50/70 dark:bg-[#0D1117] border-b border-indigo-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <Sliders size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span>Target Website Presence:</span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">(Multi-Select)</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'none', label: '🚫 Bina Website', desc: 'No website on Google Maps' },
              { key: 'broken', label: '⚠️ Broken Website', desc: '404 or down websites' },
              { key: 'exists', label: '🌐 Live Website', desc: 'Already live active website' },
            ].map((filter) => {
              const isChecked = selectedWebFilters.includes(filter.key)
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => toggleWebFilter(filter.key)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/25 ring-1 ring-indigo-400'
                      : 'bg-white dark:bg-stone-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-stone-700 hover:bg-slate-100'
                  }`}
                  title={filter.desc}
                >
                  <span>{isChecked ? '✓' : '+'}</span>
                  <span>{filter.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Scrollable Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-[#0B0E14]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white dark:bg-stone-700'
                    : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
                }`}
              >
                {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-3 flex-1 min-w-0">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white font-medium rounded-tr-none shadow-md'
                      : 'bg-white dark:bg-[#161B22] border border-slate-200 dark:border-stone-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-xs'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Interactive Campaign Proposal Blueprint Card */}
                {msg.proposal && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C2128] border-2 border-indigo-500/40 dark:border-indigo-500/30 shadow-lg space-y-3.5 animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-stone-800">
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider">
                        <Sparkles size={14} />
                        <span>AI Proposed Campaign Blueprint</span>
                      </div>
                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                        {msg.proposal.maxLeads || 40} Leads Goal
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-black text-base text-slate-900 dark:text-white">
                        {msg.proposal.name}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-stone-900/60 border border-slate-200 dark:border-stone-800">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">Query:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            "{msg.proposal.searchQuery}"
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-stone-900/60 border border-slate-200 dark:border-stone-800">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">Target Location:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            📍 {msg.proposal.location}
                          </span>
                        </div>
                      </div>

                      {/* Filter Badges Display */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          Targeting:
                        </span>
                        {(msg.proposal.targetWebsiteTypes || selectedWebFilters).map((filterKey) => (
                          <span
                            key={filterKey}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                              filterKey === 'none'
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300'
                                : filterKey === 'broken'
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-300'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                            }`}
                          >
                            {filterKey === 'none'
                              ? '🚫 No Website Only'
                              : filterKey === 'broken'
                              ? '⚠️ Broken Sites'
                              : '🌐 Live Website'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-3">
                      {msg.createdCampaignId ? (
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 size={15} />
                          <span>Campaign Successfully Created & Scraping Leads!</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleLaunchCampaign(msg.proposal!, msg.id)}
                          disabled={launchingId === msg.id}
                          className="btn btn-primary rounded-xl px-4 py-2 text-xs font-black flex items-center gap-2 cursor-pointer shadow-md hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto"
                        >
                          {launchingId === msg.id ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              <span>Launching via Apify & Gemini...</span>
                            </>
                          ) : (
                            <>
                              <Zap size={14} />
                              <span>Launch This Campaign Now</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-lg items-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0">
                <Bot size={15} />
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-stone-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-indigo-600" />
                <span>Gemini is generating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question / Prompt Shelf at the bottom */}
        <div className="border-t border-slate-200 dark:border-stone-800 bg-white dark:bg-[#161B22] p-2.5 sm:px-4 space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveSuggestionTab('campaigns')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeSuggestionTab === 'campaigns'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap size={11} />
                <span>Campaign Commands</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSuggestionTab('strategy')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeSuggestionTab === 'strategy'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Lightbulb size={11} />
                <span>Strategy Questions</span>
              </button>
            </div>

            <span className="text-[10px] font-semibold text-slate-500 hidden sm:inline">
              Tap any chip to ask instant question 👇
            </span>
          </div>

          {/* Preset Buttons Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(activeSuggestionTab === 'campaigns' ? PRESET_CAMPAIGNS : PRESET_QUESTIONS).map((item) => (
              <button
                key={item.label}
                onClick={() => handleSendMessage(item.query)}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-stone-800/80 dark:hover:bg-indigo-950/60 text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200/80 dark:border-stone-700/80 font-bold text-xs whitespace-nowrap cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shrink-0 shadow-2xs"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-[#1C2128] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Type your question or command (e.g. 'Mumbai me dentists ke bina website wale campaign bana do')..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="w-full pl-4 pr-10 py-3 text-xs sm:text-sm bg-white dark:bg-[#161B22] border border-slate-300 dark:border-stone-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-stone-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn btn-primary rounded-2xl px-5 py-3 text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shrink-0 shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-95"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
