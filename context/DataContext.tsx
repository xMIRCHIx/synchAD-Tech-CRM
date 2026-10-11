'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { Lead, Campaign, LeadStatus } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface DataContextType {
  leads: Lead[]
  campaigns: Campaign[]
  stats: any
  initialLoading: boolean
  isRefreshing: boolean
  fetchLeads: (silent?: boolean) => Promise<void>
  fetchCampaigns: (silent?: boolean) => Promise<void>
  fetchStats: (silent?: boolean) => Promise<void>
  refreshAll: (silent?: boolean) => Promise<void>
  updateLeadStatus: (id: string, newStatus: LeadStatus) => Promise<boolean>
  updateLead: (id: string, updates: Partial<Lead>) => Promise<boolean>
  deleteLead: (id: string) => Promise<boolean>
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<any>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Prevent multiple concurrent fetch requests
  const fetchingRef = useRef(false)
  const hasLoadedOnce = useRef(false)

  const fetchLeads = useCallback(async (silent = false) => {
    if (!silent && !hasLoadedOnce.current) setInitialLoading(true)
    try {
      const res = await fetch('/api/leads', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.leads && Array.isArray(data.leads)) {
          setLeads(data.leads)
        }
      }
    } catch (err) {
      console.warn('DataContext: Leads fetch skipped/interrupted:', err)
    } finally {
      if (!silent) setInitialLoading(false)
    }
  }, [])

  const fetchCampaigns = useCallback(async (silent = false) => {
    try {
      const res = await fetch('/api/campaigns', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.campaigns && Array.isArray(data.campaigns)) {
          setCampaigns(data.campaigns)
        }
      }
    } catch (err) {
      console.warn('DataContext: Campaigns fetch skipped/interrupted:', err)
    }
  }, [])

  const fetchStats = useCallback(async (silent = false) => {
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (err) {
      console.warn('DataContext: Stats fetch skipped/interrupted:', err)
    }
  }, [])

  const refreshAll = useCallback(async (silent = false) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    if (!silent && !hasLoadedOnce.current) {
      setInitialLoading(true)
    } else {
      setIsRefreshing(true)
    }

    try {
      await Promise.allSettled([
        fetchLeads(true),
        fetchCampaigns(true),
        fetchStats(true),
      ])
      hasLoadedOnce.current = true
    } finally {
      fetchingRef.current = false
      setInitialLoading(false)
      setIsRefreshing(false)
    }
  }, [fetchLeads, fetchCampaigns, fetchStats])

  // Initial load and Realtime Supabase listener
  useEffect(() => {
    refreshAll()

    let channel: any = null
    let supabaseClient: any = null
    try {
      supabaseClient = createClient()
      channel = supabaseClient
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leads' },
          (payload: any) => {
            console.log('[Realtime] Supabase leads event:', payload.eventType)
            fetchLeads(true)
            fetchStats(true)
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'campaigns' },
          () => {
            fetchCampaigns(true)
            fetchStats(true)
          }
        )
        .subscribe()
    } catch (err) {
      console.warn('Realtime channel could not be initialized:', err)
    }

    // Periodic silent background sync every 20 seconds
    const interval = setInterval(() => {
      refreshAll(true)
    }, 20000)

    return () => {
      if (channel && supabaseClient) {
        try {
          supabaseClient.removeChannel(channel)
        } catch (e) {}
      }
      clearInterval(interval)
    }
  }, [refreshAll, fetchLeads, fetchCampaigns, fetchStats])

  // Optimistic Status Update
  const updateLeadStatus = useCallback(async (id: string, newStatus: LeadStatus): Promise<boolean> => {
    // 1. Optimistic UI update immediately
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    )

    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (!res.ok) {
        // Revert on failure
        fetchLeads(true)
        return false
      }
      // Refresh stats quietly
      fetchStats(true)
      return true
    } catch (err) {
      console.error('Failed to update lead status:', err)
      fetchLeads(true)
      return false
    }
  }, [fetchLeads, fetchStats])

  // Optimistic Lead Update
  const updateLead = useCallback(async (id: string, updates: Partial<Lead>): Promise<boolean> => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    )

    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (!res.ok) {
        fetchLeads(true)
        return false
      }
      return true
    } catch (err) {
      console.error('Failed to update lead:', err)
      fetchLeads(true)
      return false
    }
  }, [fetchLeads])

  // Optimistic Lead Delete
  const deleteLead = useCallback(async (id: string): Promise<boolean> => {
    setLeads((prev) => prev.filter((l) => l.id !== id))

    try {
      const res = await fetch(`/api/leads?id=${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        fetchLeads(true)
        return false
      }
      fetchStats(true)
      return true
    } catch (err) {
      console.error('Failed to delete lead:', err)
      fetchLeads(true)
      return false
    }
  }, [fetchLeads, fetchStats])

  return (
    <DataContext.Provider
      value={{
        leads,
        campaigns,
        stats,
        initialLoading,
        isRefreshing,
        fetchLeads,
        fetchCampaigns,
        fetchStats,
        refreshAll,
        updateLeadStatus,
        updateLead,
        deleteLead,
        setLeads,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
