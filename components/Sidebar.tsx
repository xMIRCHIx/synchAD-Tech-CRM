'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Sparkles,
  Target,
  ShieldCheck,
  Menu,
  X,
  Moon,
  Sun,
  LayoutDashboard,
  PartyPopper,
  Compass,
  UserPlus,
  Receipt,
  FileText
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Overview' },
  { href: '/leads', icon: Users, label: 'Leads Pipeline' },
  { href: '/custom-leads', icon: UserPlus, label: 'Custom Leads' },
  { href: '/clients', icon: PartyPopper, label: 'Won Clients' },
  { href: '/invoices', icon: Receipt, label: 'Invoices' },
  { href: '/agreements', icon: FileText, label: 'Agreements' },
  { href: '/inbox', icon: MessageSquare, label: 'WhatsApp Inbox' },
  { href: '/campaigns', icon: Target, label: 'Campaigns' },
  { href: '/whatsapp-profile', icon: ShieldCheck, label: 'WhatsApp Profile' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const rawPathname = usePathname()
  const pathname = rawPathname || ''
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className="lg:hidden fixed top-3.5 right-4 z-50 p-2 rounded-xl bg-[var(--surface)] shadow-md border border-[var(--line)] transition-transform active:scale-95"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={18} className="text-[var(--foreground)]" /> : <Menu size={18} className="text-[var(--foreground)]" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] flex flex-col z-40 transition-transform duration-300 ease-in-out shadow-[2px_0_12px_-2px_rgba(15,23,42,0.03)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-18 border-b border-[var(--sidebar-border)]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25">
            <Sparkles size={17} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-sm tracking-tight text-[var(--foreground)] truncate">
              LeadGen CRM
            </p>
            <p className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider font-semibold">
              Autonomous AI Engine
            </p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3.5 py-5 space-y-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  active
                    ? 'bg-[#F5F3FF] dark:bg-indigo-500/15 text-[#7C3AED] dark:text-indigo-400 border-l-[3.5px] border-[#7C3AED] shadow-xs translate-x-0.5'
                    : 'text-[var(--ink-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)] hover:translate-x-1'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  active ? 'bg-[#7C3AED]/10 text-[#7C3AED] dark:text-indigo-400' : 'text-[var(--ink-muted)] group-hover:text-[var(--foreground)]'
                }`}>
                  <Icon size={16} />
                </div>
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* WhatsApp Gate Status Pill */}
        <Link
          href="/whatsapp-profile"
          onClick={() => setIsOpen(false)}
          className="p-3.5 mx-3.5 mb-3 bg-[var(--surface-alt)] hover:bg-[var(--sidebar-hover)] rounded-2xl border border-[var(--line)] block transition-colors group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-[var(--foreground)] group-hover:text-emerald-600 transition-colors">Synchad WhatsApp</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={11} /> Meta Verified
            </span>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] leading-tight">
            +91 70675 49982 • Cloud API
          </p>
        </Link>

        {/* Bottom Theme & Settings */}
        <div className="p-3.5 border-t border-[var(--sidebar-border)] space-y-1">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={15} className="text-amber-400" />
                  <span>Warm Cream Mode</span>
                </>
              ) : (
                <>
                  <Moon size={15} className="text-indigo-500" />
                  <span>Espresso Dark Mode</span>
                </>
              )}
            </button>
          )}

          <Link
            href="/settings"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)] transition-colors"
          >
            <Settings size={15} />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
      
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
