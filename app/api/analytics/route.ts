import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // 1. Fetch all leads
    const { data: leads, error: lErr } = await supabase
      .from('leads')
      .select('id, campaign_id, status, site_state, google_rating, created_at, business_name, phone, address')
      .order('created_at', { ascending: false })

    if (lErr) throw lErr

    // 2. Fetch all campaigns
    const { data: campaigns, error: cErr } = await supabase
      .from('campaigns')
      .select('id, name, niche, location, status, max_leads, created_at')

    if (cErr) throw cErr

    const totalLeads = leads?.length || 0
    const wonClients = leads?.filter(l => l.status === 'won').length || 0
    const repliedLeads = leads?.filter(l => l.status === 'replied').length || 0
    const sentLeads = leads?.filter(l => l.status === 'sent' || l.status === 'delivered' || l.status === 'read').length || 0
    const queuedLeads = leads?.filter(l => l.status === 'queued').length || 0
    const reviewLeads = leads?.filter(l => l.status === 'review' || l.status === 'new' || l.status === 'enriched').length || 0
    const notRespondedLeads = leads?.filter(l => l.status === 'not_responded' || l.status === 'skipped').length || 0
    const rejectedLeads = leads?.filter(l => l.status === 'rejected' || l.status === 'lost').length || 0

    const conversionRate = totalLeads > 0 ? ((wonClients / totalLeads) * 100).toFixed(1) : '0'

    const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0

    // Status distribution
    const statusData = [
      { name: 'Review', count: reviewLeads, value: reviewLeads },
      { name: 'Queued', count: queuedLeads, value: queuedLeads },
      { name: 'Sent', count: sentLeads, value: sentLeads },
      { name: 'Replied', count: repliedLeads, value: repliedLeads },
      { name: 'Won', count: wonClients, value: wonClients },
      { name: 'Not Responded', count: notRespondedLeads, value: notRespondedLeads },
      { name: 'Rejected', count: rejectedLeads, value: rejectedLeads }
    ]

    // Site state distribution
    const activeSiteCount = leads?.filter(l => l.site_state === 'exists').length || 0
    const noSiteCount = leads?.filter(l => l.site_state === 'none').length || 0
    const brokenSiteCount = leads?.filter(l => l.site_state === 'broken').length || 0

    const siteStateData = [
      { name: 'Active Website', count: activeSiteCount, value: activeSiteCount },
      { name: 'No Website', count: noSiteCount, value: noSiteCount },
      { name: 'Broken Site', count: brokenSiteCount, value: brokenSiteCount }
    ]

    // Campaign performance breakdown
    const campaignStats = (campaigns || []).map(c => {
      const cLeads = (leads || []).filter(l => l.campaign_id === c.id)
      const cWon = cLeads.filter(l => l.status === 'won').length
      return {
        id: c.id,
        name: c.name,
        niche: c.niche || 'General',
        location: c.location,
        totalLeads: cLeads.length,
        wonCount: cWon,
        conversionRate: cLeads.length > 0 ? ((cWon / cLeads.length) * 100).toFixed(1) : '0'
      }
    })

    // Recent 7 days timeline
    const daysMap: Record<string, { date: string; leads: number; won: number }> = {}
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      daysMap[key] = { date: key, leads: 0, won: 0 }
    }

    if (leads) {
      for (const l of leads) {
        const d = new Date(l.created_at)
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (daysMap[key]) {
          daysMap[key].leads++
          if (l.status === 'won') daysMap[key].won++
        }
      }
    }

    const timelineData = Object.values(daysMap)

    return NextResponse.json({
      stats: {
        total: totalLeads,
        won: wonClients,
        conversionRate,
        activeCampaigns,
        totalCampaigns: campaigns?.length || 0
      },
      statusData,
      siteStateData,
      campaignStats,
      timelineData,
      leads: leads || []
    })

  } catch (err: any) {
    console.error('Analytics API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
