'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Target, Sparkles, Zap, Clock, Search, MapPin,
  CheckCircle2, AlertCircle, Play, Sliders, ShieldCheck, ChevronRight,
  Globe, Compass, Wand2
} from 'lucide-react'
import Toast, { ToastMessage } from '@/components/Toast'
import CampaignAiCopilot from '@/components/CampaignAiCopilot'

// Curated A-to-Z Niches with icon and default query keywords
const NICHE_DIRECTORY = [
  { letter: 'A', name: 'Accounting & Taxation', query: 'chartered accountants tax consultant' },
  { letter: 'A', name: 'Aesthetic & Skin Clinics', query: 'cosmetic clinic aesthetic dermatology' },
  { letter: 'A', name: 'Architecture Firms', query: 'architects interior architects design firm' },
  { letter: 'A', name: 'Auto Repair & Detailing', query: 'car detailing auto repair workshop' },
  
  { letter: 'B', name: 'Bakeries & Gourmet Cafes', query: 'artisan bakery gourmet cafe coffee shop' },
  { letter: 'B', name: 'Banquet & Event Venues', query: 'banquet hall party lawn marriage hall' },
  { letter: 'B', name: 'Beauty Salons & Hair Spas', query: 'luxury salon hair spa unisex salon' },
  
  { letter: 'C', name: 'Car Dealerships & Showrooms', query: 'car dealership pre-owned luxury cars' },
  { letter: 'C', name: 'Catering Services', query: 'wedding catering corporate food services' },
  { letter: 'C', name: 'Chiropractic & Wellness', query: 'chiropractor spinal health clinic' },
  { letter: 'C', name: 'Coaching Institutes & Tutors', query: 'coaching institute competitive exam classes' },
  { letter: 'C', name: 'Commercial Cleaning', query: 'commercial office cleaning deep cleaning services' },
  { letter: 'C', name: 'Coworking Spaces', query: 'coworking space shared office workspace' },

  { letter: 'D', name: 'Dance & Performing Arts', query: 'dance academy choreography dance class' },
  { letter: 'D', name: 'Dental Clinics', query: 'dental clinic orthodontist teeth whitening' },
  { letter: 'D', name: 'Dermatologists', query: 'dermatology skin care specialist clinic' },
  { letter: 'D', name: 'Dietitians & Nutritionists', query: 'dietitian clinical nutritionist weight loss' },

  { letter: 'E', name: 'Electricians & Contractors', query: 'electrical contractor commercial electrician' },
  { letter: 'E', name: 'Event & Wedding Planners', query: 'wedding planner luxury event management' },

  { letter: 'F', name: 'Financial Advisors', query: 'wealth management financial advisor mutual funds' },
  { letter: 'F', name: 'Fitness Gyms & CrossFit', query: 'fitness gym crossfit health club' },
  { letter: 'F', name: 'Florists & Gift Boutiques', query: 'luxury florist flower delivery boutique' },

  { letter: 'H', name: 'Home Decor & Interior Design', query: 'interior designers modular kitchen architects' },
  { letter: 'H', name: 'Hotels & Boutique Resorts', query: 'boutique hotel resort guest house' },
  { letter: 'H', name: 'HVAC & AC Service', query: 'ac repair hvac installation cooling services' },

  { letter: 'L', name: 'Libraries & Study Rooms', query: 'public library reading room study hall' },
  { letter: 'L', name: 'Law Firms & Advocates', query: 'advocate corporate law firm corporate litigation' },
  { letter: 'L', name: 'Laser Hair Removal', query: 'laser hair removal clinic cosmetic centre' },

  { letter: 'P', name: 'Pet Care & Veterinary Clinics', query: 'veterinary clinic pet hospital pet grooming' },
  { letter: 'P', name: 'Photography & Studios', query: 'wedding photography studio commercial photo' },
  { letter: 'P', name: 'Physiotherapy Clinics', query: 'physiotherapy clinic sports rehab pain relief' },
  { letter: 'P', name: 'Plumbing Contractors', query: 'plumbing services commercial plumber' },

  { letter: 'R', name: 'Real Estate Agencies', query: 'real estate agency luxury property broker' },
  { letter: 'R', name: 'Restaurants & Fine Dining', query: 'fine dining restaurant multi-cuisine restaurant' },
  { letter: 'R', name: 'Roofing & Waterproofing', query: 'waterproofing contractor roofing services' },

  { letter: 'S', name: 'Salons & Day Spas', query: 'day spa massage wellness centre' },
  { letter: 'S', name: 'Solar Energy Installers', query: 'rooftop solar installer solar energy company' },

  { letter: 'Y', name: 'Yoga & Pilates Studios', query: 'yoga studio reformer pilates classes' }
]

const POPULAR_NICHES = [
  'Dental Clinics',
  'Libraries & Study Rooms',
  'Real Estate Agencies',
  'Fitness Gyms & CrossFit',
  'Home Decor & Interior Design',
  'Beauty Salons & Hair Spas',
  'Restaurants & Fine Dining',
  'Law Firms & Advocates',
  'Dermatologists'
]

// Geographic Presets
const GEO_REGIONS = {
  india_top: [
    { label: 'Delhi NCR', value: 'Delhi, India' },
    { label: 'Mumbai', value: 'Mumbai, Maharashtra, India' },
    { label: 'Bengaluru', value: 'Bengaluru, Karnataka, India' },
    { label: 'Hyderabad', value: 'Hyderabad, Telangana, India' },
    { label: 'Pune', value: 'Pune, Maharashtra, India' },
    { label: 'Kolkata', value: 'Kolkata, West Bengal, India' },
    { label: 'Chennai', value: 'Chennai, Tamil Nadu, India' },
    { label: 'Ahmedabad', value: 'Ahmedabad, Gujarat, India' },
    { label: 'Jaipur', value: 'Jaipur, Rajasthan, India' },
    { label: 'Chandigarh', value: 'Chandigarh, India' },
    { label: 'Lucknow', value: 'Lucknow, Uttar Pradesh, India' },
    { label: 'Indore', value: 'Indore, Madhya Pradesh, India' },
    { label: '🇮🇳 All India (Pan-India)', value: 'India' }
  ],
  international: [
    { label: '🇺🇸 USA - New York', value: 'New York, NY, USA' },
    { label: '🇺🇸 USA - California', value: 'Los Angeles, CA, USA' },
    { label: '🇺🇸 USA - Texas', value: 'Houston, TX, USA' },
    { label: '🇬🇧 UK - London', value: 'London, United Kingdom' },
    { label: '🇦🇪 UAE - Dubai', value: 'Dubai, United Arab Emirates' },
    { label: '🇨🇦 Canada - Toronto', value: 'Toronto, Ontario, Canada' },
    { label: '🇦🇺 Australia - Sydney', value: 'Sydney, NSW, Australia' },
    { label: '🇸🇬 Singapore', value: 'Singapore' }
  ]
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stepStatus, setStepStatus] = useState<string>('')

  // Form State
  const [name, setName] = useState('Dental Clinics in Delhi - Blitz')
  const [isCustomName, setIsCustomName] = useState(false)
  const [selectedNiche, setSelectedNiche] = useState('Dental Clinics')
  const [nicheSearch, setNicheSearch] = useState('')
  const [customNiche, setCustomNiche] = useState('')
  const [searchQuery, setSearchQuery] = useState('dental clinic')
  const [location, setLocation] = useState('Delhi, India')
  const [maxLeads, setMaxLeads] = useState<number>(10)
  const [activeGeoTab, setActiveGeoTab] = useState<'india' | 'international'>('india')
  
  // Speed & Schedule
  const [executionMode, setExecutionMode] = useState<'instant' | 'scheduled'>('instant')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [staggerInterval, setStaggerInterval] = useState('15') // minutes

  useEffect(() => {
    setStartDate(new Date().toISOString().split('T')[0])
  }, [])

  // Filtering & Quality
  const [requirePhone, setRequirePhone] = useState(true)
  const [requireWebsite, setRequireWebsite] = useState(false)
  const [autoEnrich, setAutoEnrich] = useState(true)
  const [minRating, setMinRating] = useState('4.0')
  const [targetWebsiteTypes, setTargetWebsiteTypes] = useState<string[]>(['none', 'broken'])
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false)

  const toggleWebsiteType = (val: string) => {
    setTargetWebsiteTypes(prev => {
      if (prev.includes(val)) {
        const next = prev.filter(v => v !== val)
        return next.length === 0 ? ['none'] : next
      } else {
        return [...prev, val]
      }
    })
  }

  // Filtered Niches based on search
  const filteredNiches = useMemo(() => {
    if (!nicheSearch.trim()) return NICHE_DIRECTORY
    const q = nicheSearch.toLowerCase()
    return NICHE_DIRECTORY.filter(
      n => n.name.toLowerCase().includes(q) || n.query.toLowerCase().includes(q)
    )
  }, [nicheSearch])

  // Select Niche handler
  const handleSelectNiche = (nicheName: string, queryStr?: string) => {
    setSelectedNiche(nicheName)
    setCustomNiche('')
    const found = NICHE_DIRECTORY.find(n => n.name === nicheName)
    const effectiveQuery = queryStr || found?.query || nicheName.toLowerCase()
    setSearchQuery(effectiveQuery)
    if (!isCustomName) {
      setName(`${nicheName} in ${location.split(',')[0]} - Blitz`)
    }
  }

  // Smart AI Niche Expansion Handler
  const handleCustomNicheChange = (val: string) => {
    setCustomNiche(val)
    setSelectedNiche(val || 'Custom Niche')
    
    // Smart keyword generator for any arbitrary custom niche (like library, pet care, dance, etc.)
    if (val.trim()) {
      const lower = val.toLowerCase()
      if (lower.includes('library')) {
        setSearchQuery('public library reading room study hall library')
      } else if (lower.includes('coworking') || lower.includes('office')) {
        setSearchQuery('coworking space shared office workspace')
      } else if (lower.includes('gym') || lower.includes('fitness')) {
        setSearchQuery('fitness gym crossfit health club workout')
      } else if (lower.includes('dental') || lower.includes('dentist')) {
        setSearchQuery('dental clinic orthodontist teeth whitening')
      } else if (lower.includes('salon') || lower.includes('spa') || lower.includes('beauty')) {
        setSearchQuery('beauty salon hair spa unisex salon cosmetic')
      } else if (lower.includes('real estate') || lower.includes('property')) {
        setSearchQuery('real estate agency property dealer broker')
      } else if (lower.includes('dance')) {
        setSearchQuery('dance academy choreography dance class studio')
      } else if (lower.includes('cafe') || lower.includes('coffee') || lower.includes('restaurant')) {
        setSearchQuery('cafe restaurant bakery bistro coffee shop')
      } else {
        // Natural Google Maps search keywords
        setSearchQuery(`${val.trim()} service near me`)
      }

      // ONLY auto-update name if user hasn't explicitly typed a custom campaign name!
      if (!isCustomName) {
        setName(`${val.trim()} in ${location.split(',')[0]} - Blitz`)
      }
    }
  }

  // Location select handler
  const handleSelectLocation = (locVal: string) => {
    setLocation(locVal)
    const locPrefix = locVal === 'India' ? 'Pan-India' : locVal.split(',')[0]
    if (!isCustomName) {
      setName(`${selectedNiche || 'Outreach'} in ${locPrefix} - Blitz`)
    }
  }

  // Generate Smart Name
  const handleAutoName = () => {
    const locPrefix = location === 'India' ? 'Pan-India' : location.split(',')[0].trim()
    const month = new Date().toLocaleString('en-US', { month: 'short' })
    const suggested = `${selectedNiche || 'Prospects'} • ${locPrefix} [${month}]`
    setName(suggested)
    setIsCustomName(true)
  }

  // Handle Form Submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !searchQuery.trim() || !location.trim()) {
      setToast({
        id: Date.now().toString(),
        title: 'Missing Details',
        description: 'Please fill in campaign name, search query, and location.',
        type: 'error'
      })
      return
    }

    setIsSubmitting(true)
    setStepStatus('Creating campaign in database...')

    try {
      // 1. Create campaign instantly (instantScrape: false so user NEVER hangs on 60s loader)
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          searchQuery: searchQuery.trim(),
          location: location.trim(),
          niche: customNiche.trim() || selectedNiche,
          maxLeads: Number(maxLeads),
          instantScrape: false, // Background collection: User is not blocked!
          autoEnrich,
          requirePhone,
          requireWebsite,
          targetWebsiteTypes,
          minRating,
          schedule: executionMode === 'scheduled' ? { startDate, startTime, staggerInterval } : null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create campaign')
      }

      setStepStatus('Campaign launched! Redirecting to workspace...')

      setToast({
        id: Date.now().toString(),
        title: 'Campaign Launched!',
        description: executionMode === 'instant'
          ? 'Collecting verified leads in the background...'
          : 'Campaign scheduled successfully.',
        type: 'success'
      })

      const campaignId = data.campaign?.id
      const queryParam = executionMode === 'instant' ? '?bgScrape=true' : ''

      setTimeout(() => {
        if (campaignId) {
          router.push(`/campaigns/${campaignId}${queryParam}`)
        } else {
          router.push('/campaigns')
        }
      }, 400)

    } catch (err: any) {
      console.error(err)
      setToast({
        id: Date.now().toString(),
        title: 'Error Creating Campaign',
        description: err.message,
        type: 'error'
      })
      setIsSubmitting(false)
      setStepStatus('')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-8 animate-fade-in pb-24">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <Link
            href="/campaigns"
            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                Setup Wizard
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Create Outreach Campaign
              </h1>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              Custom niches (Library, Gyms, Salons), manual city or All India & global countries targeting.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAiCopilotOpen(true)}
          className="btn px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md shadow-indigo-500/25 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Sparkles size={14} className="text-pink-200 animate-pulse" />
          <span>Ask AI Copilot</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) - Main Configuration */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section 1: Campaign Target & Category Directory */}
          <div className="card-base p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Target size={16} />
                </div>
                <h2 className="text-base font-bold text-[var(--foreground)]">
                  1. Target Niche & Search Keywords
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAutoName}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Sparkles size={12} /> Auto-suggest name
              </button>
            </div>

            {/* Campaign Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Campaign Name
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Libraries in Delhi - Oct Blitz"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  setIsCustomName(true)
                }}
                className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* CUSTOM NICHE INPUT WITH AI EXPANSION */}
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <Wand2 size={14} /> Custom Niche Input (Type Anything)
                </label>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  Auto-expands Google Maps keywords
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Library, Study Hall, Pet Grooming, Dance Academy..."
                  value={customNiche}
                  onChange={e => handleCustomNicheChange(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                💡 Type any niche (like <em>"Library"</em> or <em>"Coworking"</em>) — our AI will automatically formulate the exact Google Maps keywords.
              </p>
            </div>

            {/* Popular Niches Quick Select */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Or Pick From Popular Niches
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_NICHES.map(pn => (
                  <button
                    key={pn}
                    type="button"
                    onClick={() => handleSelectNiche(pn)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedNiche === pn
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-[var(--card)] hover:bg-[var(--accent)] text-[var(--foreground)] border-[var(--border)]'
                    }`}
                  >
                    {pn}
                  </button>
                ))}
              </div>
            </div>

            {/* A to Z Niche Finder & Search */}
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Browse All Niches (A to Z Directory)
                </label>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {filteredNiches.length} categories available
                </span>
              </div>

              {/* Search Bar for Niches */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Filter 40+ niches (e.g. library, dentists, gym, real estate, salon)..."
                  value={nicheSearch}
                  onChange={e => setNicheSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Scrollable Niches Grid */}
              <div className="max-h-40 overflow-y-auto p-2 border border-[var(--border)] rounded-lg bg-[var(--background)] grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredNiches.map(n => (
                  <button
                    key={n.name}
                    type="button"
                    onClick={() => handleSelectNiche(n.name, n.query)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-left text-xs transition-colors ${
                      selectedNiche === n.name
                        ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-semibold'
                        : 'hover:bg-[var(--accent)] text-[var(--foreground)]'
                    }`}
                  >
                    <span className="truncate">{n.name}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-mono ml-1">{n.letter}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Search Query */}
            <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Google Maps Search Query (Auto-Generated / Editable)
                </label>
                <span className="text-[10px] text-emerald-500 font-medium">Verified for Apify Places</span>
              </div>
              <input
                required
                type="text"
                placeholder="e.g. public library reading room study library"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
              />
            </div>

            {/* Target Location: Manual City, All India, Specific Countries */}
            <div className="space-y-3 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Target Location (Manual City or Global Presets)
                </label>
                {/* Region Switcher */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveGeoTab('india')}
                    className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                      activeGeoTab === 'india'
                        ? 'bg-indigo-600 text-white'
                        : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
                    }`}
                  >
                    🇮🇳 India Cities & All India
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGeoTab('international')}
                    className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                      activeGeoTab === 'international'
                        ? 'bg-indigo-600 text-white'
                        : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
                    }`}
                  >
                    🌍 International Countries
                  </button>
                </div>
              </div>

              {/* Manual Input Box */}
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" />
                <input
                  required
                  type="text"
                  placeholder="Type any manual city, area, or country (e.g. Jaipur, Lucknow, Miami, London, India)..."
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Quick Preset Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(activeGeoTab === 'india' ? GEO_REGIONS.india_top : GEO_REGIONS.international).map(loc => (
                  <button
                    key={loc.label}
                    type="button"
                    onClick={() => handleSelectLocation(loc.value)}
                    className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                      location === loc.value
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-[var(--accent)] hover:bg-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Volume, Speed & Starting Schedule */}
          <div className="card-base p-6 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Sliders size={16} />
              </div>
              <h2 className="text-base font-bold text-[var(--foreground)]">
                2. Volume, Speed & Starting Time
              </h2>
            </div>

            {/* Lead Count Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Kitna Leads Chahiye? (Target Volume)
                </label>
                <span className="text-sm font-bold text-indigo-500">{maxLeads} Leads</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[5, 10, 25, 50, 100].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setMaxLeads(cnt)}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                      maxLeads === cnt
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-[var(--background)] hover:bg-[var(--accent)] text-[var(--foreground)] border-[var(--border)]'
                    }`}
                  >
                    {cnt} {cnt === 5 ? '(Fast)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Execution Mode (Instant vs Scheduled) */}
            <div className="space-y-3 pt-2 border-t border-[var(--border)]">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Scraping Speed & Execution Mode
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Instant Mode */}
                <div
                  onClick={() => setExecutionMode('instant')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    executionMode === 'instant'
                      ? 'border-indigo-500 bg-indigo-500/5 shadow-sm'
                      : 'border-[var(--border)] bg-[var(--background)] opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Zap className={executionMode === 'instant' ? 'text-amber-500' : 'text-[var(--muted-foreground)]'} size={18} />
                    <span className="text-sm font-bold text-[var(--foreground)]">⚡ Instant Scraping</span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    Apify Google Maps starts scraping immediately. Loads verified leads straight into CRM in ~20 seconds.
                  </p>
                </div>

                {/* Scheduled / Paced Mode */}
                <div
                  onClick={() => setExecutionMode('scheduled')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    executionMode === 'scheduled'
                      ? 'border-indigo-500 bg-indigo-500/5 shadow-sm'
                      : 'border-[var(--border)] bg-[var(--background)] opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Clock className={executionMode === 'scheduled' ? 'text-indigo-500' : 'text-[var(--muted-foreground)]'} size={18} />
                    <span className="text-sm font-bold text-[var(--foreground)]">⏱️ Scheduled & Paced</span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    Set a starting date/time and pace (e.g. 5 leads every 15 mins) for gradual WhatsApp warmup.
                  </p>
                </div>
              </div>

              {/* Scheduled Settings */}
              {executionMode === 'scheduled' && (
                <div className="p-4 rounded-lg bg-[var(--accent)] border border-[var(--border)] space-y-3 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-[var(--muted-foreground)] block mb-1">
                        Starting Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded text-[var(--foreground)]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[var(--muted-foreground)] block mb-1">
                        Starting Time
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded text-[var(--foreground)]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[var(--muted-foreground)] block mb-1">
                        Pacing Interval
                      </label>
                      <select
                        value={staggerInterval}
                        onChange={e => setStaggerInterval(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded text-[var(--foreground)]"
                      >
                        <option value="15">5 leads / 15 mins</option>
                        <option value="30">10 leads / 30 mins</option>
                        <option value="60">20 leads / 1 hour</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: AI & Quality Filters */}
          <div className="card-base p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                <ShieldCheck size={16} />
              </div>
              <h2 className="text-base font-bold text-[var(--foreground)]">
                3. Lead Filters & AI Automation
              </h2>
            </div>

            {/* Target Website Presence (Multi-Select Filter) */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
                    <Globe size={14} className="text-indigo-500" /> Target Website Presence (Multi-Select)
                  </span>
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                    Choose which leads to target. Prioritize non-website or broken-link businesses for highest conversion.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTargetWebsiteTypes(['none', 'broken'])}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                      targetWebsiteTypes.includes('none') && targetWebsiteTypes.includes('broken') && !targetWebsiteTypes.includes('exists')
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    Non + Broken (Best)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetWebsiteTypes(['none', 'broken', 'exists'])}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                      targetWebsiteTypes.length === 3
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    All Leads
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* 1. None */}
                <div
                  onClick={() => toggleWebsiteType('none')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    targetWebsiteTypes.includes('none')
                      ? 'border-rose-500 bg-rose-500/10 shadow-sm'
                      : 'border-[var(--border)] bg-[var(--card)] opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                      🚫 Bina Website (None)
                    </span>
                    <input
                      type="checkbox"
                      readOnly
                      checked={targetWebsiteTypes.includes('none')}
                      className="rounded text-rose-500 h-3.5 w-3.5 pointer-events-none"
                    />
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 leading-relaxed">
                    Google Maps businesses with NO website. Best to pitch new website creation.
                  </p>
                </div>

                {/* 2. Broken */}
                <div
                  onClick={() => toggleWebsiteType('broken')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    targetWebsiteTypes.includes('broken')
                      ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                      : 'border-[var(--border)] bg-[var(--card)] opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                      ⚠️ Broken / 404 Site
                    </span>
                    <input
                      type="checkbox"
                      readOnly
                      checked={targetWebsiteTypes.includes('broken')}
                      className="rounded text-amber-500 h-3.5 w-3.5 pointer-events-none"
                    />
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 leading-relaxed">
                    Dead domains, SSL errors, or down websites. High conversion for website redesign.
                  </p>
                </div>

                {/* 3. Exists */}
                <div
                  onClick={() => toggleWebsiteType('exists')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    targetWebsiteTypes.includes('exists')
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                      : 'border-[var(--border)] bg-[var(--card)] opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                      🌐 Live Website
                    </span>
                    <input
                      type="checkbox"
                      readOnly
                      checked={targetWebsiteTypes.includes('exists')}
                      className="rounded text-emerald-500 h-3.5 w-3.5 pointer-events-none"
                    />
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 leading-relaxed">
                    Businesses with active websites. Pitch SEO, speed upgrades, or AI chatbot integration.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] cursor-pointer hover:bg-[var(--accent)] transition-colors">
                <input
                  type="checkbox"
                  checked={requirePhone}
                  onChange={e => setRequirePhone(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <span className="text-sm font-semibold text-[var(--foreground)] block">
                    Phone Numbers Required
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Only import businesses with direct phone numbers for WhatsApp outreach.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] cursor-pointer hover:bg-[var(--accent)] transition-colors">
                <input
                  type="checkbox"
                  checked={autoEnrich}
                  onChange={e => setAutoEnrich(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <span className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                    ⚡ Auto-run Firecrawl + Google Gemini 2.5 Flash AI
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Automatically scans websites and crafts personalized WhatsApp pitches for each lead.
                  </span>
                </div>
              </label>

              <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                <div>
                  <span className="text-sm font-semibold text-[var(--foreground)] block">
                    Minimum Google Rating
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Target reputable businesses with active reviews.
                  </span>
                </div>
                <select
                  value={minRating}
                  onChange={e => setMinRating(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded-md text-[var(--foreground)] font-semibold"
                >
                  <option value="any">Any Rating</option>
                  <option value="3.5">3.5★ and above</option>
                  <option value="4.0">4.0★ and above</option>
                  <option value="4.5">4.5★ and above</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (1 Col) - Live Summary & Actions */}
        <div className="space-y-6">
          <div className="card-base p-6 sticky top-6 space-y-6 border-indigo-200 dark:border-indigo-500/30">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Live Campaign Preview
              </span>
              <h3 className="text-lg font-bold text-[var(--foreground)] mt-1">
                {name || 'Untitled Campaign'}
              </h3>
            </div>

            <div className="space-y-3 text-xs border-y border-[var(--border)] py-4">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Target Niche</span>
                <span className="font-semibold text-[var(--foreground)] truncate max-w-[150px]">{customNiche || selectedNiche}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Location</span>
                <span className="font-semibold text-[var(--foreground)] truncate max-w-[150px]">{location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Lead Goal</span>
                <span className="font-mono font-bold text-emerald-500">{maxLeads} Leads</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Execution Mode</span>
                <span className="font-semibold text-amber-500">{executionMode === 'instant' ? '⚡ Instant' : '⏱️ Scheduled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Scraper Engine</span>
                <span className="font-mono text-[var(--foreground)]">Apify Places</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">AI Engine</span>
                <span className="font-mono text-purple-500">Gemini 2.5 Flash</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--muted-foreground)]">Website Filter</span>
                <span className="font-semibold text-rose-500 dark:text-rose-400">
                  {targetWebsiteTypes.length === 3
                    ? 'All Leads'
                    : targetWebsiteTypes.map(t => t === 'none' ? 'No Site' : t === 'broken' ? 'Broken' : 'Live').join(' + ')}
                </span>
              </div>
            </div>

            {/* Launch Status indicator if submitting */}
            {isSubmitting && (
              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>{stepStatus || 'Processing...'}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-base btn-primary py-3 font-semibold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Launching Campaign...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Launch Campaign Now
                  </>
                )}
              </button>

              <Link
                href="/campaigns"
                className="w-full btn-base btn-outline py-2.5 text-center text-xs block"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>

      {/* AI Campaign Copilot Modal */}
      <CampaignAiCopilot
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
      />
    </div>
  )
}
