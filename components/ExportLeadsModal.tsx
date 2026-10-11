'use client'

import React, { useState } from 'react'
import type { Lead } from '@/lib/types'
import { X, Download, FileSpreadsheet, FileText, Check, Sparkles } from 'lucide-react'
import * as XLSX from 'xlsx'

interface ExportLeadsModalProps {
  isOpen: boolean
  onClose: () => void
  filteredLeads: Lead[]
  allLeads: Lead[]
  campaignName?: string
}

export default function ExportLeadsModal({
  isOpen,
  onClose,
  filteredLeads,
  allLeads,
  campaignName
}: ExportLeadsModalProps) {
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx')
  const [scope, setScope] = useState<'filtered' | 'all'>('filtered')
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  const targetLeads = scope === 'filtered' ? filteredLeads : allLeads

  const handleExport = () => {
    setIsExporting(true)
    try {
      const rows = targetLeads.map((l, index) => {
        let siteStatus = 'No Website'
        if (l.site_state === 'broken') siteStatus = 'Broken Link'
        else if (l.site_state === 'exists' || l.website_url) siteStatus = 'Active Website'

        return {
          '#': index + 1,
          'Business Name': l.business_name || '',
          'Contact Phone': l.phone || '',
          'Website URL': l.website_url || 'N/A',
          'Website Status': siteStatus,
          'Google Rating': l.google_rating != null ? l.google_rating : 'N/A',
          'Opportunity Score': l.score != null ? `${l.score}/100` : 'N/A',
          'CRM Stage': (l.status || 'review').toUpperCase(),
          'Full Address': l.address || 'N/A',
          'Campaign / Origin': l.campaigns?.name || (l.campaign_id ? 'Campaign Lead' : 'Direct / Custom Lead'),
          'Notes': l.notes || '',
          'Date Added': l.created_at ? new Date(l.created_at).toLocaleDateString() : 'N/A'
        }
      })

      const ws = XLSX.utils.json_to_sheet(rows)

      // Auto-fit column widths
      const colWidths = [
        { wch: 4 },   // #
        { wch: 32 },  // Business Name
        { wch: 18 },  // Phone
        { wch: 30 },  // Website URL
        { wch: 16 },  // Website Status
        { wch: 14 },  // Rating
        { wch: 18 },  // Score
        { wch: 12 },  // Stage
        { wch: 38 },  // Address
        { wch: 24 },  // Campaign
        { wch: 28 },  // Notes
        { wch: 14 }   // Date
      ]
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Leads')

      const dateStr = new Date().toISOString().slice(0, 10)
      const sanitizedName = (campaignName || 'LeadGen_CRM').replace(/[^a-zA-Z0-9_-]/g, '_')
      const fileName = `${sanitizedName}_Leads_${dateStr}.${format}`

      if (format === 'xlsx') {
        XLSX.writeFile(wb, fileName)
      } else {
        XLSX.writeFile(wb, fileName, { bookType: 'csv' })
      }

      setTimeout(() => {
        setIsExporting(false)
        onClose()
      }, 500)
    } catch (err) {
      console.error('Export failed:', err)
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity cursor-pointer" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#161B22] rounded-3xl shadow-2xl border border-slate-200 dark:border-stone-800 flex flex-col overflow-hidden z-10 animate-scale-up">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-stone-800 bg-slate-50/80 dark:bg-[#1C2128] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Export Leads File</h2>
              <p className="text-xs text-slate-500 dark:text-stone-400 font-semibold mt-0.5">
                Download structured data to Excel (.xlsx) or CSV
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

        {/* Body */}
        <div className="p-5 md:p-6 space-y-5">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              1. Choose File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between ${
                  format === 'xlsx'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-stone-800 bg-slate-50/50 dark:bg-[#1C2128]/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <FileSpreadsheet size={20} className={format === 'xlsx' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                  <div>
                    <span className="text-xs font-black block">Excel Workbook</span>
                    <span className="text-[10.5px] opacity-75 font-semibold">.xlsx (Formatted Columns)</span>
                  </div>
                </div>
                {format === 'xlsx' && <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between ${
                  format === 'csv'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-stone-800 bg-slate-50/50 dark:bg-[#1C2128]/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <FileText size={20} className={format === 'csv' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                  <div>
                    <span className="text-xs font-black block">CSV Text</span>
                    <span className="text-[10.5px] opacity-75 font-semibold">.csv (Universal comma-separated)</span>
                  </div>
                </div>
                {format === 'csv' && <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              2. Select Leads to Export
            </label>
            <div className="space-y-2">
              <label
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  scope === 'filtered'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-stone-800 bg-slate-50/50 dark:bg-[#1C2128]/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === 'filtered'}
                    onChange={() => setScope('filtered')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-black block">Currently Filtered Leads</span>
                    <span className="text-[11px] opacity-75 font-semibold">
                      Exports only the {filteredLeads.length} leads matching current search/stage filters
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700">
                  {filteredLeads.length}
                </span>
              </label>

              <label
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  scope === 'all'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-stone-800 bg-slate-50/50 dark:bg-[#1C2128]/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-black block">All Leads in Database</span>
                    <span className="text-[11px] opacity-75 font-semibold">
                      Full CRM backup with all {allLeads.length} leads across all stages
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700">
                  {allLeads.length}
                </span>
              </label>
            </div>
          </div>

          {/* Quick Preview summary */}
          <div className="p-3.5 bg-slate-100 dark:bg-[#1C2128] rounded-2xl border border-slate-200 dark:border-stone-800 text-xs flex items-center justify-between font-semibold">
            <span className="text-slate-600 dark:text-slate-400">Total Rows to Export:</span>
            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
              {targetLeads.length} Leads
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-[#1C2128] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn btn-secondary rounded-xl py-2.5 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExporting || targetLeads.length === 0}
            onClick={handleExport}
            className="flex-1 btn btn-primary rounded-xl py-2.5 text-xs font-black gap-2 shadow-md shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            {isExporting ? 'Generating File...' : `Download .${format.toUpperCase()} (${targetLeads.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
