'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  Search, Sparkles, Bell, Sun, Moon, Zap,
  CheckCircle2, ShieldCheck, Database
} from 'lucide-react'
import Link from 'next/link'

export default function TopHeader() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-30 w-full bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] px-5 md:px-8 py-3.5 flex items-center justify-between gap-4 transition-colors">
      {/* Search Input Bar (Curved Pill) */}
      <div className="flex items-center gap-2.5 max-w-md w-full">
        <div className="relative w-full flex items-center">
          <Search size={14} className="absolute left-3.5 text-[var(--ink-faint)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search leads, campaigns, or phones... (Press /)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-[var(--surface-alt)] border border-[var(--line)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--ink-faint)] outline-none focus:bg-[var(--surface)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all font-medium"
          />
          <span className="absolute right-3 text-[10px] font-bold text-[var(--ink-faint)] bg-[var(--surface)] border border-[var(--line)] px-1.5 py-0.5 rounded-md shadow-2xs">
            /
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Live Engine Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Autonomous AI Engine Active</span>
        </div>

        {/* Quick Launch Button */}
        <Link
          href="/campaigns/new"
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs hover:shadow-md hover:from-indigo-500 hover:to-purple-500 transition-all active:scale-95"
        >
          <Zap size={13} />
          <span>New Scrape</span>
        </Link>

        {/* Theme Toggle Pill */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Cream / Dark mode"
            className="w-8 h-8 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-muted)] hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun size={15} className="text-amber-400" />
            ) : (
              <Moon size={15} className="text-indigo-500" />
            )}
          </button>
        )}

        {/* Notifications Icon Pill */}
        <button
          title="Engine notifications"
          className="relative w-8 h-8 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-muted)] hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-[var(--surface)]" />
        </button>
      </div>
    </header>
  )
}
