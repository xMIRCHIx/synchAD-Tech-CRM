'use client'

import React, { useEffect, useState, useRef } from 'react'
import { CheckCircle2, AlertCircle, Info, X, Send } from 'lucide-react'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  type?: 'success' | 'info' | 'error'
}

interface ToastProps {
  toast: ToastMessage | null
  onDismiss: () => void
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  const [progress, setProgress] = useState(100)
  const onDismissRef = useRef(onDismiss)

  useEffect(() => {
    onDismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    if (!toast) return

    setProgress(100)
    const duration = 4000
    const intervalTime = 50
    const decrement = (intervalTime / duration) * 100

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - decrement))
    }, intervalTime)

    const dismissTimer = setTimeout(() => {
      onDismissRef.current()
    }, duration)

    return () => {
      clearInterval(progressTimer)
      clearTimeout(dismissTimer)
    }
  }, [toast?.id])

  if (!toast) return null

  const isError = toast.type === 'error'
  const isSuccess = toast.type === 'success' || !toast.type

  return (
    <div className="fixed bottom-6 right-6 z-[999999] animate-fade-in pointer-events-auto">
      <div className="relative overflow-hidden flex items-start gap-3 p-4 pr-10 rounded-2xl min-w-[320px] max-w-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--line)] shadow-2xl backdrop-blur-md">
        {/* Progress Bar */}
        <div
          className={`absolute bottom-0 left-0 h-1 transition-all duration-75 ${
            isError ? 'bg-rose-500' : isSuccess ? 'bg-emerald-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${progress}%` }}
        />

        {/* Icon */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
            isError
              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
              : isSuccess
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
              : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
          }`}
        >
          {isError ? (
            <AlertCircle size={16} />
          ) : isSuccess ? (
            <CheckCircle2 size={16} />
          ) : (
            <Send size={16} />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 mt-0.5">
          <h4 className="text-sm font-bold text-[var(--foreground)]">
            {toast.title}
          </h4>
          {toast.description && (
            <p className="text-xs text-[var(--ink-muted)] mt-0.5 leading-relaxed">
              {toast.description}
            </p>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => onDismissRef.current()}
          className="absolute top-3.5 right-3 p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
