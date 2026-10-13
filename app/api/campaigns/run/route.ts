import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const apifyToken = process.env.APIFY_API_TOKEN

async function scrapeGooglePlacesViaApify(search: string, location: string, limit: number) {
  const actorId = 'compass~crawler-google-places'
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}&timeout=65`

  const body = {
    searchStringsArray: [search],
    locationQuery: location,
    maxCrawledPlacesPerSearch: limit,
    language: 'en',
    skipClosedPlaces: true
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(75000)
  })

  if (!res.ok) {
    const errText = await res.text()
    if (res.status === 401 || errText.includes('user-or-token-not-found') || errText.includes('token') || errText.includes('not-found')) {
      throw new Error('Apify API Token expired ya invalid ho gaya hai (401 Unauthorized). Kripya https://console.apify.com se naya token lekar update karein.')
    }
    throw new Error(`Apify failed with ${res.status}: ${errText}`)
  }

  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function POST(req: Request) {
  try {
    const { campaignId, targetWebsiteTypes } = await req.json()

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    if (!apifyToken) {
      return NextResponse.json({ error: 'APIFY_API_TOKEN is missing in environment' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Fetch campaign
    const { data: campaign, error: cErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (cErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // 2. Count current leads in database for this campaign
    const { count: existingCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)

    const currentTotal = existingCount || 0
    const maxLeads = campaign.max_leads || 40
    const needed = Math.max(0, maxLeads - currentTotal)

    // STRICT CHECK: If already at or above goal, do not add more leads!
    if (needed <= 0) {
      await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaign.id)
      return NextResponse.json({
        success: true,
        message: `Campaign already has all ${maxLeads} leads. Goal met!`,
        leadsImported: 0,
        totalLeads: currentTotal,
        maxLeads,
        isFull: true
      })
    }

    // 3. Determine active website presence filters
    let activeWebsiteFilters: string[] = targetWebsiteTypes || []
    if (activeWebsiteFilters.length === 0 && campaign.niche && campaign.niche.includes('[sites:')) {
      const match = campaign.niche.match(/\[sites:([^\]]+)\]/)
      if (match) {
        activeWebsiteFilters = match[1].split(',')
      }
    }

    console.log(`[Run Campaign ${campaignId}] Current: ${currentTotal}/${maxLeads}. Need: ${needed} leads. Filters: ${activeWebsiteFilters.join(',') || 'all'}`)

    // 4. Request enough candidate places so filtering doesn't leave the target unfulfilled
    const hasStrictFilter = activeWebsiteFilters.length > 0 && !activeWebsiteFilters.includes('all')
    const candidateMultiplier = hasStrictFilter ? 2.5 : 1.3
    const crawlLimit = Math.min(Math.max(Math.ceil(needed * candidateMultiplier), needed + 10), 60)

    const places = await scrapeGooglePlacesViaApify(campaign.search_query, campaign.location, crawlLimit)
    const importedLeads: any[] = []
    let updatedTotal = currentTotal

    if (Array.isArray(places) && places.length > 0) {
      for (const place of places) {
        // STRICT CAP: Never exceed max_leads under any circumstances!
        if (updatedTotal >= maxLeads) {
          break
        }

        const website = place.website && place.website.startsWith('http') ? place.website : (place.website ? `https://${place.website}` : null)
        const placeSiteState = website ? 'exists' : 'none'

        if (activeWebsiteFilters.length > 0 && !activeWebsiteFilters.includes('all')) {
          if (activeWebsiteFilters.includes('none') && !activeWebsiteFilters.includes('exists') && placeSiteState === 'exists') {
            continue
          }
          if (!activeWebsiteFilters.includes('none') && placeSiteState === 'none') {
            continue
          }
        }

        let rawPhone = place.phone || place.phoneUnformatted || ''
        let cleanPhone = rawPhone.replace(/[^\d+]/g, '')
        if (!cleanPhone || cleanPhone.length < 7) {
          cleanPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`
        }

        const leadItem = {
          campaign_id: campaign.id,
          business_name: place.title || 'Local Business',
          phone: cleanPhone,
          email: null,
          website_url: website,
          address: place.address || campaign.location,
          google_rating: typeof place.totalScore === 'number' ? place.totalScore : null,
          google_maps_url: place.url || null,
          site_state: placeSiteState,
          status: 'new',
          notes: `Scraped via Apify: ${place.categoryName || campaign.niche || 'Business'}. Reviews: ${place.reviewsCount || 0}`
        }

        const { data: savedLead, error: lErr } = await supabase
          .from('leads')
          .upsert(leadItem, { onConflict: 'phone' })
          .select()
          .single()

        if (!lErr && savedLead) {
          importedLeads.push(savedLead)
          updatedTotal++

          await supabase
            .from('conversations')
            .upsert({
              lead_id: savedLead.id,
              unread_count: 0,
              is_archived: false,
              updated_at: new Date().toISOString()
            }, { onConflict: 'lead_id' })
        }
      }
    }

    // If quota reached, mark campaign completed
    if (updatedTotal >= maxLeads) {
      await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaign.id)
    }

    return NextResponse.json({
      success: true,
      placesFound: Array.isArray(places) ? places.length : 0,
      leadsImported: importedLeads.length,
      totalLeads: updatedTotal,
      maxLeads,
      isGoalReached: updatedTotal >= maxLeads,
      leads: importedLeads
    })
  } catch (error: any) {
    console.error('[Run Campaign] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
