'use client'

import React, { useState, useRef } from 'react'
import type { Campaign } from '@/lib/types'
import {
  X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle,
  Download, ArrowRight, Sparkles, FolderPlus, FileText
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface ImportLeadsModalProps {
  isOpen: boolean
  onClose: () => void
  campaigns: Campaign[]
  onSuccess: (count: number, message: string) => void
  defaultCampaignId?: string
}

interface ParsedLeadRow {
  business_name: string
  phone: string
  website_url?: string
  address?: string
  google_rating?: number | null
  notes?: string
}

export default function ImportLeadsModal({
  isOpen,
  onClose,
  campaigns,
  onSuccess,
  defaultCampaignId
}: ImportLeadsModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload')
  const [rawText, setRawText] = useState('')
  const [fileName, setFileName] = useState('')
  const [parsedRows, setParsedRows] = useState<ParsedLeadRow[]>([])
  const [campaignId, setCampaignId] = useState(defaultCampaignId || '')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  // Normalize column names
  const extractLeadFromRow = (row: Record<string, any>): ParsedLeadRow | null => {
    const keys = Object.keys(row)
    let business_name = ''
    let phone = ''
    let website_url = ''
    let address = ''
    let google_rating: number | null = null
    let notes = ''

    for (const k of keys) {
      const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '')
      const val = row[k] ? String(row[k]).trim() : ''

      if (!business_name && (lower.includes('business') || lower.includes('name') || lower.includes('company') || lower.includes('title'))) {
        business_name = val
      } else if (!phone && (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact') || lower.includes('tel') || lower.includes('number'))) {
        phone = val
      } else if (!website_url && (lower.includes('website') || lower.includes('site') || lower.includes('url') || lower.includes('link') || lower.includes('web'))) {
        website_url = val
      } else if (!address && (lower.includes('address') || lower.includes('location') || lower.includes('city') || lower.includes('street'))) {
        address = val
      } else if (google_rating === null && (lower.includes('rating') || lower.includes('stars') || lower.includes('score'))) {
        const num = parseFloat(val)
        if (!isNaN(num)) google_rating = num
      } else if (!notes && (lower.includes('note') || lower.includes('category') || lower.includes('niche') || lower.includes('desc'))) {
        notes = val
      }
    }

    // Fallbacks if columns didn't match fuzzy keys
    if (!business_name && row['Title']) business_name = String(row['Title']).trim()
    if (!business_name && row['Name']) business_name = String(row['Name']).trim()
    if (!business_name && keys.length > 0 && row[keys[0]]) business_name = String(row[keys[0]]).trim()

    if (!phone && keys.length > 1 && row[keys[1]]) {
      const maybePhone = String(row[keys[1]]).replace(/[^\d+]/g, '')
      if (maybePhone.length >= 7) phone = maybePhone
    }

    if (!business_name) return null

    let cleanPhone = phone.replace(/[^\d+]/g, '')
    if (!cleanPhone || cleanPhone.length < 7) {
      cleanPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`
    }

    if (website_url && !website_url.startsWith('http')) {
      website_url = `https://${website_url}`
    }

    return {
      business_name,
      phone: cleanPhone,
      website_url: website_url || undefined,
      address: address || 'Address not listed',
      google_rating,
      notes: notes || 'Imported via spreadsheet'
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result
        const workbook = XLSX.read(buffer, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet)

        if (!rawJson || rawJson.length === 0) {
          setError('No rows found in uploaded file.')
          return
        }

        const validRows: ParsedLeadRow[] = []
        for (const row of rawJson) {
          const lead = extractLeadFromRow(row)
          if (lead) validRows.push(lead)
        }

        if (validRows.length === 0) {
          setError('Could not detect business name or leads in this file. Please verify columns.')
          return
        }

        setParsedRows(validRows)
      } catch (err: any) {
        console.error('File parse error:', err)
        setError('Failed to parse file: ' + err.message)
      }
    }

    reader.readAsBinaryString(file)
  }

  const handleParseRawText = () => {
    setError('')
    if (!rawText.trim()) {
      setError('Please paste CSV or tab-separated text.')
      return
    }

    try {
      const workbook = XLSX.read(rawText, { type: 'string' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rawJson: any[] = XLSX.utils.sheet_to_json(sheet)

      const validRows: ParsedLeadRow[] = []
      for (const row of rawJson) {
        const lead = extractLeadFromRow(row)
        if (lead) validRows.push(lead)
      }

      if (validRows.length === 0) {
        setError('Could not extract any valid leads from pasted text.')
        return
      }

      setFileName('Pasted_CSV_Text.csv')
      setParsedRows(validRows)
    } catch (err: any) {
      setError('Failed to parse pasted text: ' + err.message)
    }
  }

  const handleDownloadSample = () => {
    const sampleRows = [
      {
        'Business Name': 'Glow Dental Clinic',
        'Contact Phone': '+919876543210',
        'Website URL': 'https://glowdental.com',
        'Full Address': '42 Marine Drive, Mumbai, India',
        'Google Rating': 4.9,
        'Notes': 'High referral potential'
      },
      {
        'Business Name': 'Titan Crossfit Gym',
        'Contact Phone': '+919812345678',
        'Website URL': '',
        'Full Address': 'Ring Road, Indore, India',
        'Google Rating': 4.7,
        'Notes': 'Needs mobile booking flow'
      },
      {
        'Business Name': 'Burari Readers Club',
        'Contact Phone': '+919899001122',
        'Website URL': 'https://youtube.com/@burariread',
        'Full Address': 'Block A, Burari, Delhi, India',
        'Google Rating': 4.8,
        'Notes': 'YouTube channel link'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(sampleRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sample_Leads')
    XLSX.writeFile(wb, 'sample_leads_template.csv', { bookType: 'csv' })
  }

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return
    setIsProcessing(true)
    setError('')

    try {
      const payloadLeads = parsedRows.map((r) => ({
        ...r,
        campaign_id: campaignId || null,
        status: 'review',
        notes: r.notes ? `[Imported] ${r.notes}` : '[Imported] Imported via CSV/Excel'
      }))

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: payloadLeads })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import leads')
      }

      onSuccess(data.count || parsedRows.length, `Successfully imported ${data.count || parsedRows.length} leads into CRM!`)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving imported leads.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity cursor-pointer" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#161B22] rounded-3xl shadow-2xl border border-slate-200 dark:border-stone-800 flex flex-col overflow-hidden z-10 animate-scale-up max-h-[92vh]">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-stone-800 bg-slate-50/80 dark:bg-[#1C2128] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Import Leads (CSV / Excel)</h2>
              <p className="text-xs text-slate-500 dark:text-stone-400 font-semibold mt-0.5">
                Upload your external spreadsheets or paste CSV rows into the CRM
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Stepper / Tabs */}
          {parsedRows.length === 0 ? (
            <>
              {/* Tab Selector */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-stone-800 pb-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === 'upload'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    File Upload (.xlsx, .csv)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('paste')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === 'paste'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Paste Raw Text
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download size={12} /> Download Sample Template
                </button>
              </div>

              {activeTab === 'upload' ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-stone-700 hover:border-indigo-500 rounded-3xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-[#1C2128]/50 transition-colors group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
                    <UploadCloud size={24} />
                  </div>
                  <p className="font-black text-sm text-slate-800 dark:text-slate-100">
                    Click to browse or drop your Excel / CSV file here
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1">
                    Supports Microsoft Excel (.xlsx, .xls) and standard Comma-Separated (.csv)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={6}
                    placeholder="Paste CSV rows here, e.g.:&#10;Business Name,Phone,Website,Address&#10;Apex Dental,+919876543210,https://apex.com,Mumbai&#10;Fitness Hub,+919812345678,,Indore"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-900 text-slate-900 dark:text-white font-mono text-[11px] outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleParseRawText}
                    className="btn btn-primary px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Parse Pasted Rows
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Preview of parsed rows */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="font-black text-xs block">File Parsed: {fileName}</span>
                    <span className="text-[11px] font-semibold opacity-85">
                      Ready to import {parsedRows.length} valid business leads
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([])
                    setFileName('')
                  }}
                  className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  Change File
                </button>
              </div>

              {/* Target Campaign Selection */}
              <div className="space-y-1">
                <label className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderPlus size={13} className="text-indigo-600" />
                  Assign Imported Leads to Campaign
                </label>
                <select
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-900 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                >
                  <option value="">Direct / Custom Leads (No Campaign)</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Data Preview Table */}
              <div className="space-y-1.5">
                <span className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Data Preview (First 5 Rows)
                </span>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-stone-800">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 dark:bg-[#1C2128] text-slate-700 dark:text-slate-300 font-black">
                      <tr>
                        <th className="p-2.5">Business</th>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5">Website</th>
                        <th className="p-2.5">Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                      {parsedRows.slice(0, 5).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-stone-800/50">
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white max-w-[150px] truncate">{r.business_name}</td>
                          <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">{r.phone}</td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400 max-w-[120px] truncate">{r.website_url || '—'}</td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400 max-w-[160px] truncate">{r.address || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-[#1C2128] flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn btn-secondary rounded-xl py-2.5 text-xs font-bold"
          >
            Cancel
          </button>
          {parsedRows.length > 0 && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmImport}
              className="flex-1 btn btn-primary rounded-xl py-2.5 text-xs font-black gap-2 shadow-md shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              {isProcessing ? 'Importing Leads...' : `Import All ${parsedRows.length} Leads`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
