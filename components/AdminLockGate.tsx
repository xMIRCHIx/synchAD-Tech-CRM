'use client'

import React, { useState, useEffect } from 'react'
import { ShieldCheck, Lock, KeyRound, Sparkles, ArrowRight } from 'lucide-react'

export default function AdminLockGate() {
  const [isLocked, setIsLocked] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isSecurityEnabled = localStorage.getItem('synchad_admin_pin_enabled') === 'true'
    const isUnlockedSession = sessionStorage.getItem('synchad_admin_unlocked') === 'true'

    if (isSecurityEnabled && !isUnlockedSession) {
      setIsLocked(true)
    }
  }, [])

  if (!mounted || !isLocked) return null

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    const storedPin = localStorage.getItem('synchad_admin_pin') || '1234'
    if (pin.trim() === storedPin) {
      sessionStorage.setItem('synchad_admin_unlocked', 'true')
      setIsLocked(false)
      setError(false)
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#161B22] border-2 border-slate-200 dark:border-stone-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
          <Lock size={26} />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            SynchAD Tech Admin Gate
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your 4-digit Master Security PIN to access the Agency OS & CRM.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-2">
            <input
              type="password"
              maxLength={8}
              autoFocus
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value)
                setError(false)
              }}
              className={`w-full py-3 text-center text-2xl font-mono tracking-widest font-black rounded-2xl border-2 outline-none transition-all ${
                error
                  ? 'border-rose-500 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
              }`}
            />
            {error && (
              <p className="text-xs font-bold text-rose-500 animate-fade-in">
                Incorrect PIN. Please try again.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full btn btn-primary py-3 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25"
          >
            <span>Unlock Agency Workspace</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <p className="text-[10px] text-slate-400">
          Default Master PIN: <strong>1234</strong> (Customizable in Settings)
        </p>
      </div>
    </div>
  )
}
