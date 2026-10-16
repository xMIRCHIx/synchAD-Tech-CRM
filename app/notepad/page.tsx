'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  StickyNote,
  Search,
  Plus,
  Trash2,
  Pin,
  Calendar,
  User,
  Clock,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  Folder,
  Tag,
  Sparkles,
  ChevronDown,
  List,
  CheckSquare,
  Heading,
  Bold,
  X,
  FileText,
  AlertCircle
} from 'lucide-react'
import { useData } from '@/context/DataContext'
import { normalizeLeadStatus } from '@/lib/statusHelper'
import type { AgencyNote, Lead } from '@/lib/types'
import Toast, { ToastMessage } from '@/components/Toast'

const STORAGE_KEY = 'synchad_notepad_notes_v2'

const CATEGORIES: Array<{ id: AgencyNote['category']; label: string; icon: string; color: string }> = [
  { id: 'general', label: 'General / Scratchpad', icon: '📝', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  { id: 'client', label: 'Client Requirement', icon: '👤', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'call', label: 'Call & Meeting Notes', icon: '📞', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'deal', label: 'Scope & Deal Discussion', icon: '💼', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'todo', label: 'To-Do / Action Items', icon: '✅', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  { id: 'idea', label: 'Ideas & Strategy', icon: '💡', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
]

export default function NotepadPage() {
  const { leads } = useData()
  const [notes, setNotes] = useState<AgencyNote[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')
  const [onlyPinned, setOnlyPinned] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [copied, setCopied] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')

  // Form states for active note
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [clientId, setClientId] = useState<string>('')
  const [clientName, setClientName] = useState<string>('')
  const [customClientMode, setCustomClientMode] = useState(false)
  const [category, setCategory] = useState<AgencyNote['category']>('general')
  const [noteDate, setNoteDate] = useState<string>('') // Optional date
  const [isPinned, setIsPinned] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load notes on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AgencyNote[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotes(parsed)
          setActiveNoteId(parsed[0].id)
          loadNoteIntoEditor(parsed[0])
          return
        }
      }
      
      // Default welcome note if no notes exist
      const initialNote: AgencyNote = {
        id: `note-${Date.now()}`,
        title: 'Welcome to SynchAD Agency Notepad',
        content: `Hi Aryan & Dewansh,\n\nYeh aapka dedicated Notepad hai jisme aap:\n- Apne client ke requirement, meeting notes, deals & scope sab likh ke save kr skte ho.\n- Kisi specific client ka naam select kr skte ho ya koi bhi custom naam de skte ho.\n- Date optional hai (jab man ho dalo, ya khali chhod do).\n- Auto-save hota rehta hai, aur 1-tap Copy ya Download kr skte ho.\n\nHappy Closings! 🚀`,
        client_name: 'SynchAD Tech',
        category: 'general',
        date: new Date().toISOString().split('T')[0],
        is_pinned: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setNotes([initialNote])
      setActiveNoteId(initialNote.id)
      loadNoteIntoEditor(initialNote)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([initialNote]))
    } catch (e) {
      console.error('Error loading notes:', e)
    }
  }, [])

  const loadNoteIntoEditor = (n: AgencyNote) => {
    setTitle(n.title || '')
    setContent(n.content || '')
    setClientId(n.client_id || '')
    setClientName(n.client_name || '')
    setCustomClientMode(!n.client_id && !!n.client_name)
    setCategory(n.category || 'general')
    setNoteDate(n.date || '')
    setIsPinned(!!n.is_pinned)
    setSaveStatus('saved')
  }

  // Active note instance
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null
  }, [notes, activeNoteId])

  // Select a note from sidebar
  const handleSelectNote = (note: AgencyNote) => {
    // Save current before switching if modified
    if (activeNoteId && activeNoteId !== note.id) {
      flushSaveCurrent()
    }
    setActiveNoteId(note.id)
    loadNoteIntoEditor(note)
  }

  // Create a brand new note
  const handleCreateNewNote = () => {
    flushSaveCurrent()
    const newId = `note-${Date.now()}`
    const newNote: AgencyNote = {
      id: newId,
      title: '',
      content: '',
      client_name: '',
      client_id: '',
      category: 'general',
      date: '', // optional date
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const updated = [newNote, ...notes]
    setNotes(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setActiveNoteId(newId)
    loadNoteIntoEditor(newNote)

    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)

    setToast({
      id: Date.now().toString(),
      title: 'New note created',
      description: 'Start typing your thoughts or select a client.',
      type: 'info'
    })
  }

  // Delete note
  const handleDeleteNote = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const remaining = notes.filter((n) => n.id !== noteId)
    setNotes(remaining)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining))

    if (activeNoteId === noteId) {
      if (remaining.length > 0) {
        setActiveNoteId(remaining[0].id)
        loadNoteIntoEditor(remaining[0])
      } else {
        // Create an empty one
        const freshId = `note-${Date.now()}`
        const freshNote: AgencyNote = {
          id: freshId,
          title: '',
          content: '',
          client_name: '',
          category: 'general',
          date: '',
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setNotes([freshNote])
        setActiveNoteId(freshId)
        loadNoteIntoEditor(freshNote)
      }
    }

    setToast({
      id: Date.now().toString(),
      title: 'Note deleted',
      type: 'error'
    })
  }

  // Toggle Pin on active or clicked note
  const handleTogglePin = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const updated = notes.map((n) => {
      if (n.id === noteId) {
        const nextPin = !n.is_pinned
        if (n.id === activeNoteId) setIsPinned(nextPin)
        return { ...n, is_pinned: nextPin, updated_at: new Date().toISOString() }
      }
      return n
    })
    setNotes(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // Auto-save logic with debounce
  const triggerAutoSave = (updatedFields: Partial<AgencyNote>) => {
    if (!activeNoteId) return
    setSaveStatus('unsaved')

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saving')
      setNotes((prevNotes) => {
        const updated = prevNotes.map((n) => {
          if (n.id === activeNoteId) {
            return {
              ...n,
              ...updatedFields,
              updated_at: new Date().toISOString()
            }
          }
          return n
        })
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return updated
      })
      setTimeout(() => setSaveStatus('saved'), 300)
    }, 600)
  }

  const flushSaveCurrent = () => {
    if (!activeNoteId) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    setNotes((prevNotes) => {
      const updated = prevNotes.map((n) => {
        if (n.id === activeNoteId) {
          return {
            ...n,
            title: title || 'Untitled Note',
            content,
            client_id: clientId || null,
            client_name: clientName || null,
            category,
            date: noteDate || null,
            is_pinned: isPinned,
            updated_at: new Date().toISOString()
          }
        }
        return n
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    setSaveStatus('saved')
  }

  // Manual save
  const handleManualSave = () => {
    flushSaveCurrent()
    setToast({
      id: Date.now().toString(),
      title: 'Note saved successfully',
      description: clientName ? `Linked to ${clientName}` : 'Saved in agency notepad',
      type: 'success'
    })
  }

  // Copy full note text
  const handleCopyNote = async () => {
    const textToCopy = `${title ? `${title}\n\n` : ''}${clientName ? `Client: ${clientName}\n` : ''}${noteDate ? `Date: ${noteDate}\n` : ''}${content}`
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      setToast({
        id: Date.now().toString(),
        title: 'Copied to clipboard',
        type: 'success'
      })
    } catch {
      // Fallback
    }
  }

  // Download note as Markdown / Text file
  const handleDownload = () => {
    const safeTitle = (title || 'untitled-note').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const textToDownload = `# ${title || 'Untitled Note'}\n\n${clientName ? `**Client:** ${clientName}\n` : ''}${noteDate ? `**Date:** ${noteDate}\n` : ''}**Category:** ${category}\n\n---\n\n${content}`
    const blob = new Blob([textToDownload], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeTitle}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Text formatting inserts
  const insertText = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = textarea.value
    const selected = current.substring(start, end)
    const replacement = prefix + selected + suffix
    const nextVal = current.substring(0, start) + replacement + current.substring(end)

    setContent(nextVal)
    triggerAutoSave({ content: nextVal })

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    }, 10)
  }

  const insertTimestamp = () => {
    const now = new Date()
    const stamp = `\n[${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}] - `
    insertText(stamp)
  }

  // Unique list of clients for filtering and selection
  const clientsList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; isWon: boolean }>()
    leads.forEach((l) => {
      const name = l.business_name || l.owner_name
      if (name) {
        map.set(name.toLowerCase(), {
          id: l.id,
          name,
          isWon: normalizeLeadStatus(l.status) === 'won'
        })
      }
    })
    return Array.from(map.values())
  }, [leads])

  // All distinct client tags currently saved in notes
  const savedClientTags = useMemo(() => {
    const set = new Set<string>()
    notes.forEach((n) => {
      if (n.client_name?.trim()) set.add(n.client_name.trim())
    })
    return Array.from(set)
  }, [notes])

  // Filtered notes list
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        if (onlyPinned && !n.is_pinned) return false
        if (selectedCategoryFilter !== 'all' && n.category !== selectedCategoryFilter) return false
        if (selectedClientFilter !== 'all') {
          if (selectedClientFilter === '__no_client__') {
            if (n.client_name) return false
          } else if (n.client_name?.toLowerCase() !== selectedClientFilter.toLowerCase()) {
            return false
          }
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const inTitle = (n.title || '').toLowerCase().includes(q)
          const inContent = (n.content || '').toLowerCase().includes(q)
          const inClient = (n.client_name || '').toLowerCase().includes(q)
          if (!inTitle && !inContent && !inClient) return false
        }
        return true
      })
      .sort((a, b) => {
        // Pinned notes always on top
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
  }, [notes, onlyPinned, selectedCategoryFilter, selectedClientFilter, searchQuery])

  // Word count & Char count
  const stats = useMemo(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0
    const chars = content.length
    return { words, chars }
  }, [content])

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
      {/* Top Banner / Breadcrumb */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <StickyNote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Agency Notepad</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-muted)] text-[var(--foreground-muted)] border border-[var(--line)]">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </span>
            </div>
            <p className="text-xs text-[var(--foreground-muted)]">
              Write, draft client requirements, save calls, ideas & deals with spacious comfort.
            </p>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFocusMode(!focusMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] transition-colors"
            title={focusMode ? 'Exit Full Writing Space' : 'Full Writing Space (Hide List)'}
          >
            {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
          </button>

          <button
            onClick={handleCreateNewNote}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: 2-Column or Focused View */}
      <div className="flex-1 flex gap-4 pt-3 overflow-hidden">
        {/* Left Notes List (Hidden in Focus Mode) */}
        {!focusMode && (
          <aside className="w-full md:w-80 lg:w-96 flex flex-col bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden shrink-0 shadow-sm">
            {/* Search Bar */}
            <div className="p-3 border-b border-[var(--line)] bg-[var(--surface-muted)]/40 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  placeholder="Search notes, clients, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-purple-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Client & Pinned Filter row */}
              <div className="flex items-center gap-1.5">
                {/* Client filter dropdown */}
                <select
                  value={selectedClientFilter}
                  onChange={(e) => setSelectedClientFilter(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs rounded-md bg-[var(--surface)] border border-[var(--line)] text-[var(--foreground)] focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Clients ({notes.length})</option>
                  <option value="__no_client__">No Client Tagged</option>
                  {savedClientTags.map((name) => (
                    <option key={name} value={name}>
                      👤 {name}
                    </option>
                  ))}
                </select>

                {/* Pinned toggle */}
                <button
                  onClick={() => setOnlyPinned(!onlyPinned)}
                  className={`p-1.5 rounded-md border text-xs transition-colors ${
                    onlyPinned
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'border-[var(--line)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                  title={onlyPinned ? 'Showing only pinned' : 'Filter pinned notes'}
                >
                  <Pin className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>

              {/* Category Pills */}
              <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-2 py-0.5 text-[10px] rounded-full whitespace-nowrap transition-colors ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-purple-600 text-white font-medium'
                      : 'bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--line)]'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategoryFilter(c.id)}
                    className={`px-2 py-0.5 text-[10px] rounded-full whitespace-nowrap transition-colors ${
                      selectedCategoryFilter === c.id
                        ? 'bg-purple-600 text-white font-medium'
                        : 'bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--line)]'
                    }`}
                  >
                    {c.icon} {c.label.split('/')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Cards List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--line)]">
              {filteredNotes.length === 0 ? (
                <div className="p-8 text-center text-[var(--foreground-muted)] space-y-2">
                  <StickyNote className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs">No notes found</p>
                  <button
                    onClick={handleCreateNewNote}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                  >
                    + Create a new note
                  </button>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isActive = note.id === activeNoteId
                  const catMeta = CATEGORIES.find((c) => c.id === note.category) || CATEGORIES[0]
                  return (
                    <div
                      key={note.id}
                      onClick={() => handleSelectNote(note)}
                      className={`group relative p-3 cursor-pointer transition-all border-l-2 ${
                        isActive
                          ? 'bg-purple-500/10 border-purple-500'
                          : 'border-transparent hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-xs font-semibold line-clamp-1 ${isActive ? 'text-purple-400' : 'text-[var(--foreground)]'}`}>
                          {note.title || 'Untitled Note'}
                        </h3>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleTogglePin(note.id, e)}
                            className={`p-1 rounded hover:bg-[var(--surface-muted)] ${note.is_pinned ? 'text-amber-400' : 'text-[var(--foreground-muted)]'}`}
                            title={note.is_pinned ? 'Unpin' : 'Pin note'}
                          >
                            <Pin className={`w-3 h-3 ${note.is_pinned ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteNote(note.id, e)}
                            className="p-1 rounded text-red-400 hover:bg-red-500/10"
                            title="Delete note"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Snippet */}
                      <p className="text-[11px] text-[var(--foreground-muted)] line-clamp-2 mt-1 whitespace-pre-wrap font-sans">
                        {note.content ? note.content.replace(/^#+\s+/gm, '') : 'Empty note...'}
                      </p>

                      {/* Badges / Meta */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {note.client_name && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 font-medium">
                            <User className="w-2.5 h-2.5" />
                            {note.client_name}
                          </span>
                        )}

                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${catMeta.color}`}>
                          {catMeta.icon} {catMeta.label.split('/')[0]}
                        </span>

                        {note.date && (
                          <span className="text-[10px] text-[var(--foreground-muted)] inline-flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {note.date}
                          </span>
                        )}

                        {note.is_pinned && (
                          <span className="text-[10px] text-amber-400 ml-auto flex items-center gap-0.5">
                            📌
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </aside>
        )}

        {/* Right Large Writing Canvas */}
        <main className="flex-1 flex flex-col bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden shadow-sm">
          {/* Editor Header Bar (Client Link, Optional Date, Category, Actions) */}
          <div className="p-3 border-b border-[var(--line)] bg-[var(--surface-muted)]/30 flex flex-wrap items-center justify-between gap-3">
            {/* Left Controls: Client & Date */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Client Tagging Dropdown / Custom Input */}
              <div className="flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--line)] rounded-lg px-2 py-1 shadow-xs">
                <User className="w-3.5 h-3.5 text-purple-400" />
                {!customClientMode ? (
                  <select
                    value={clientId ? clientId : clientName ? '__custom__' : ''}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '__custom__') {
                        setCustomClientMode(true)
                        setClientId('')
                        setClientName('')
                        triggerAutoSave({ client_id: null, client_name: '' })
                      } else if (!val) {
                        setClientId('')
                        setClientName('')
                        triggerAutoSave({ client_id: null, client_name: '' })
                      } else {
                        const matched = clientsList.find((c) => c.id === val)
                        const name = matched ? matched.name : ''
                        setClientId(val)
                        setClientName(name)
                        triggerAutoSave({ client_id: val, client_name: name })
                      }
                    }}
                    className="text-xs bg-transparent text-[var(--foreground)] focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[220px]"
                  >
                    <option value="">No Client (General Note)</option>
                    <optgroup label="CRM Won & Leads">
                      {clientsList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.isWon ? '⭐ ' : ''}{c.name}
                        </option>
                      ))}
                    </optgroup>
                    <option value="__custom__">➕ Custom Client Name...</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Type custom client name..."
                      value={clientName}
                      onChange={(e) => {
                        const val = e.target.value
                        setClientName(val)
                        setClientId('')
                        triggerAutoSave({ client_id: null, client_name: val })
                      }}
                      className="text-xs bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none w-36 sm:w-48"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        setCustomClientMode(false)
                        setClientId('')
                        setClientName('')
                        triggerAutoSave({ client_id: null, client_name: '' })
                      }}
                      className="text-xs text-[var(--foreground-muted)] hover:text-red-400 p-0.5"
                      title="Clear custom client"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Category Picker */}
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value as AgencyNote['category']
                  setCategory(val)
                  triggerAutoSave({ category: val })
                }}
                className="text-xs bg-[var(--surface)] border border-[var(--line)] rounded-lg px-2.5 py-1 text-[var(--foreground)] focus:outline-none cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>

              {/* Optional Date Picker with Clear Button */}
              <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--line)] rounded-lg px-2 py-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="date"
                  value={noteDate}
                  onChange={(e) => {
                    const val = e.target.value
                    setNoteDate(val)
                    triggerAutoSave({ date: val })
                  }}
                  className="text-xs bg-transparent text-[var(--foreground)] focus:outline-none cursor-pointer"
                  title="Optional: Set date"
                />
                {noteDate ? (
                  <button
                    onClick={() => {
                      setNoteDate('')
                      triggerAutoSave({ date: null })
                    }}
                    className="text-[10px] text-[var(--foreground-muted)] hover:text-red-400 px-1"
                    title="Clear date (make optional)"
                  >
                    Clear
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0]
                      setNoteDate(today)
                      triggerAutoSave({ date: today })
                    }}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-medium px-1"
                  >
                    + Today
                  </button>
                )}
              </div>
            </div>

            {/* Right Quick Actions: Copy, Save, Download, Pin */}
            <div className="flex items-center gap-1.5 ml-auto">
              {/* Auto-save status indicator */}
              <span className="text-[11px] text-[var(--foreground-muted)] mr-2 hidden sm:inline-flex items-center gap-1">
                {saveStatus === 'saving' && <span className="animate-spin text-purple-400">⏳</span>}
                {saveStatus === 'saved' && <span className="text-emerald-400">✓</span>}
                {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved changes'}
              </span>

              {/* Pin button */}
              <button
                onClick={() => {
                  const next = !isPinned
                  setIsPinned(next)
                  triggerAutoSave({ is_pinned: next })
                  if (activeNoteId) {
                    setNotes((prev) =>
                      prev.map((n) => (n.id === activeNoteId ? { ...n, is_pinned: next } : n))
                    )
                  }
                }}
                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                  isPinned
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'border-[var(--line)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
                title={isPinned ? 'Unpin Note' : 'Pin Note to Top'}
              >
                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
              </button>

              {/* Copy button */}
              <button
                onClick={handleCopyNote}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] transition-colors"
                title="Copy note content"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                title="Download as Markdown file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {/* Delete button */}
              {activeNoteId && (
                <button
                  onClick={() => handleDeleteNote(activeNoteId)}
                  className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-red-500/10 text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
                  title="Delete this note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Manual Save Button */}
              <button
                onClick={handleManualSave}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition-all active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Clean Markdown Formatting Quick Toolbar */}
          <div className="px-4 py-1.5 border-b border-[var(--line)] bg-[var(--surface)]/50 flex items-center gap-1 flex-wrap text-xs text-[var(--foreground-muted)]">
            <button
              onClick={() => insertText('**', '**')}
              className="p-1 hover:text-[var(--foreground)] rounded hover:bg-[var(--surface-muted)]"
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertText('### ')}
              className="p-1 hover:text-[var(--foreground)] rounded hover:bg-[var(--surface-muted)]"
              title="Heading 3"
            >
              <Heading className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertText('\n- ')}
              className="p-1 hover:text-[var(--foreground)] rounded hover:bg-[var(--surface-muted)]"
              title="Bullet point"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertText('\n- [ ] ')}
              className="p-1 hover:text-[var(--foreground)] rounded hover:bg-[var(--surface-muted)]"
              title="Checklist item"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={insertTimestamp}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[var(--surface-muted)] hover:text-purple-400 text-[11px]"
              title="Insert current date & time"
            >
              <Clock className="w-3 h-3" />
              <span>Timestamp</span>
            </button>

            <div className="ml-auto flex items-center gap-3 text-[11px] text-[var(--foreground-muted)]">
              <span>{stats.words} words</span>
              <span>{stats.chars} chars</span>
            </div>
          </div>

          {/* Note Canvas Area (Spacious & Clean) */}
          <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-4">
            {/* Note Title Input */}
            <input
              type="text"
              placeholder="Note title (e.g. Dental Clinic Redesign Scope, Dewansh Follow-up...)"
              value={title}
              onChange={(e) => {
                const val = e.target.value
                setTitle(val)
                triggerAutoSave({ title: val })
              }}
              className="w-full text-xl sm:text-2xl font-bold bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/50 border-0 focus:outline-none focus:ring-0 px-0"
            />

            {/* Note Body Textarea */}
            <textarea
              ref={textareaRef}
              placeholder="Write anything here... Client notes, price discussed, deliverables, call bullet points, ideas or quick scratchpad..."
              value={content}
              onChange={(e) => {
                const val = e.target.value
                setContent(val)
                triggerAutoSave({ content: val })
              }}
              className="flex-1 w-full bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/40 border-0 focus:outline-none focus:ring-0 resize-none font-sans text-sm sm:text-base leading-relaxed p-0 min-h-[420px]"
            />
          </div>
        </main>
      </div>

      {/* Global Toast */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
