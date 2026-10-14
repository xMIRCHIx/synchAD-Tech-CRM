import type { LeadStatus } from './types'

export type CanonicalStatus =
  | 'review'
  | 'queued'
  | 'sent'
  | 'replied'
  | 'won'
  | 'not_responded'
  | 'rejected'

/**
 * Normalizes any database / legacy / raw status into a clean canonical CRM stage.
 * - 'new', 'enriched', 'review', null, undefined -> 'review'
 * - 'queued' -> 'queued'
 * - 'sent', 'delivered', 'read' -> 'sent'
 * - 'replied' -> 'replied'
 * - 'won' -> 'won'
 * - 'not_responded', 'skipped' -> 'not_responded'
 * - 'rejected', 'lost' -> 'rejected'
 */
export function normalizeLeadStatus(rawStatus?: string | null): CanonicalStatus {
  if (!rawStatus) return 'review'
  const s = rawStatus.toLowerCase().trim()

  switch (s) {
    case 'won':
      return 'won'
    case 'replied':
      return 'replied'
    case 'sent':
    case 'delivered':
    case 'read':
    case 'pitched':
      return 'sent'
    case 'queued':
      return 'queued'
    case 'not_responded':
    case 'skipped':
      return 'not_responded'
    case 'rejected':
    case 'lost':
      return 'rejected'
    case 'review':
    case 'new':
    case 'enriched':
    default:
      return 'review'
  }
}

/**
 * Returns human-readable label for a status (with optional icon/emoji)
 */
export function getLeadStatusLabel(rawStatus?: string | null, includeEmoji = true): string {
  const norm = normalizeLeadStatus(rawStatus)
  switch (norm) {
    case 'won':
      return includeEmoji ? 'Won 🏆' : 'Won'
    case 'replied':
      return includeEmoji ? 'Replied 💬' : 'Replied'
    case 'sent':
      return includeEmoji ? 'Pitched / Sent 📤' : 'Pitched / Sent'
    case 'queued':
      return includeEmoji ? 'Queued ⏳' : 'Queued'
    case 'not_responded':
      return includeEmoji ? 'Not Responded 📵' : 'Not Responded'
    case 'rejected':
      return includeEmoji ? 'Rejected ❌' : 'Rejected'
    case 'review':
    default:
      return includeEmoji ? 'Review 🔍' : 'Review'
  }
}

/**
 * Standardized, high-contrast, visually stunning badge styles for CRM statuses.
 * Guaranteed to look identical across all pages and modals.
 */
export function getLeadStatusBadgeStyle(rawStatus?: string | null): string {
  const norm = normalizeLeadStatus(rawStatus)
  switch (norm) {
    case 'won':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
    case 'replied':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-700'
    case 'sent':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700'
    case 'queued':
      return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-700'
    case 'not_responded':
      return 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-700'
    case 'rejected':
      return 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700'
    case 'review':
    default:
      return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700'
  }
}

/**
 * Checks whether a lead's status matches a given filter key.
 * Always normalizes both sides so 'lost' matches 'rejected', 'skipped' matches 'not_responded', etc.
 */
export function matchesStatusFilter(leadStatus?: string | null, filterKey?: string | null): boolean {
  if (!filterKey || filterKey === 'all') return true
  const normLead = normalizeLeadStatus(leadStatus)
  const normFilter = normalizeLeadStatus(filterKey)
  return normLead === normFilter
}

/**
 * Canonical options for interactive status select dropdowns in tables and modals.
 */
export const CANONICAL_STATUS_OPTIONS: { value: CanonicalStatus; label: string }[] = [
  { value: 'review', label: 'Review' },
  { value: 'queued', label: 'Queued' },
  { value: 'sent', label: 'Pitched / Sent' },
  { value: 'replied', label: 'Replied' },
  { value: 'won', label: 'Won 🏆' },
  { value: 'not_responded', label: 'Not Responded 📵' },
  { value: 'rejected', label: 'Rejected ❌' },
]

/**
 * Filter toolbar options
 */
export const STATUS_FILTER_OPTIONS: { key: CanonicalStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All Leads' },
  { key: 'review', label: 'Review' },
  { key: 'queued', label: 'Queued' },
  { key: 'sent', label: 'Pitched / Sent' },
  { key: 'replied', label: 'Replied' },
  { key: 'won', label: 'Won 🏆' },
  { key: 'not_responded', label: 'Not Responded 📵' },
  { key: 'rejected', label: 'Rejected ❌' },
]
