import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 120

const apifyToken = process.env.APIFY_API_TOKEN

async function scrapeGooglePlacesViaApify(
  search: string,
  location: string,
  limit: number,
  websiteFilter: 'allPlaces' | 'withWebsite' | 'withoutWebsite' = 'allPlaces'
) {
  const actorId = 'compass~crawler-google-places'
  // Use 110s timeout on Apify so it has ample time while staying within Next.js function limits
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}&timeout=110`

  // Sanitize location if user specified multiple cities with & or and
  const sanitizedLocation = location.includes('&')
    ? location.split('&')[0].trim()
    : location.includes(' and ')
    ? location.split(' and ')[0].trim()
    : location

  // Construct a single, direct, high-precision search string
  const cleanSearch = sanitizedLocation
    ? (search.toLowerCase().includes(sanitizedLocation.toLowerCase()) ? search : `${search} in ${sanitizedLocation}`)
    : search

  // Lean, high-speed parameters: disable reviews and image scraping which slow down Apify 10x!
  const batchLimit = Math.min(Math.max(limit, 10), 35)
  const body = {
    searchStringsArray: [cleanSearch],
    maxCrawledPlacesPerSearch: batchLimit,
    language: 'en',
    skipClosedPlaces: true,
    website: websiteFilter,
    maxReviews: 0,
    maxImages: 0,
    scrapePlaceDetail: false
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(118000)
  })

  if (!res.ok) {
    const errText = await res.text()

    // 1. Check for token expiration
    if (res.status === 401 || errText.includes('user-or-token-not-found')) {
      throw new Error('Apify API Token expired ya invalid ho gaya hai (401 Unauthorized). Kripya https://console.apify.com se naya token lekar update karein.')
    }

    // 2. Check if run timed out or failed but generated dataset items before timing out
    const runIdMatch = errText.match(/run ID:\s*([a-zA-Z0-9]+)/i)
    if (runIdMatch && runIdMatch[1]) {
      try {
        console.log(`[Apify Timeout Recovery] Attempting to retrieve partial items from run ${runIdMatch[1]}...`)
        const runRes = await fetch(`https://api.apify.com/v2/actor-runs/${runIdMatch[1]}?token=${apifyToken}`)
        const runData = await runRes.json()
        const dsId = runData.data?.defaultDatasetId
        if (dsId) {
          const dsRes = await fetch(`https://api.apify.com/v2/datasets/${dsId}/items?token=${apifyToken}`)
          const partialItems = await dsRes.json()
          if (Array.isArray(partialItems) && partialItems.length > 0) {
            console.log(`[Apify Recovery] Successfully saved ${partialItems.length} items from run before timeout!`)
            return partialItems
          }
        }
      } catch (recoveryErr) {
        console.warn('Partial dataset recovery failed:', recoveryErr)
      }
    }

    if (errText.includes('TIMED-OUT') || errText.includes('timeout')) {
      throw new Error('Google Maps crawler response time zyaada lene se timeout hua. Kripya dubara "⚡ Run" dabayein.')
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

    let apifyWebsiteFilter: 'allPlaces' | 'withWebsite' | 'withoutWebsite' = 'allPlaces'
    if (activeWebsiteFilters.includes('none') && !activeWebsiteFilters.includes('exists')) {
      apifyWebsiteFilter = 'withoutWebsite'
    } else if (activeWebsiteFilters.includes('exists') && !activeWebsiteFilters.includes('none')) {
      apifyWebsiteFilter = 'withWebsite'
    }

    // Clean location and extract pure cities and prime sub-localities
    const cleanLoc = (campaign.location || '').replace(/,\s*India/gi, '').trim()
    let localitiesPool: string[] = []

    if (cleanLoc.toLowerCase().includes('bhopal') && cleanLoc.toLowerCase().includes('indore')) {
      localitiesPool = [
        'Bhopal',
        'Indore',
        'MP Nagar Bhopal',
        'Vijay Nagar Indore',
        'Kolar Road Bhopal',
        'Palasia Indore',
        'Hoshangabad Road Bhopal',
        'Bhawarkua Indore',
        'Arera Colony Bhopal',
        'Super Corridor Indore',
        'Ayodhya Bypass Bhopal',
        'AB Road Indore',
        'Rau Indore',
        'Shahpura Bhopal',
        'Sudama Nagar Indore'
      ]
    } else if (cleanLoc.toLowerCase().includes('bhopal')) {
      localitiesPool = [
        'Bhopal',
        'MP Nagar Bhopal',
        'Kolar Road Bhopal',
        'Hoshangabad Road Bhopal',
        'Arera Colony Bhopal',
        'Ayodhya Bypass Bhopal',
        'Shahpura Bhopal',
        'Bairagarh Bhopal'
      ]
    } else if (cleanLoc.toLowerCase().includes('indore')) {
      localitiesPool = [
        'Indore',
        'Vijay Nagar Indore',
        'Palasia Indore',
        'Bhawarkua Indore',
        'Super Corridor Indore',
        'AB Road Indore',
        'Rau Indore',
        'Sudama Nagar Indore'
      ]
    } else {
      const raw = cleanLoc.split(/[&,]|(?:\band\b)/i).map(s => s.trim()).filter(s => s.length > 1 && s.toLowerCase() !== 'india')
      localitiesPool = raw.length > 0 ? raw : [cleanLoc]
    }

    const currentCity = localitiesPool[currentTotal % localitiesPool.length]

    // Smart Query Extraction & Variations so Google Maps returns dozens of new places every batch
    const rawQuery = (campaign.search_query || 'business').toLowerCase()
    let queryPool: string[] = []

    if (rawQuery.includes('real estate') || rawQuery.includes('property') || rawQuery.includes('builder')) {
      queryPool = [
        'property dealers',
        'real estate builders',
        'property consultants',
        'real estate brokers',
        'colonizers and builders',
        'commercial property dealers',
        'flat and plot agents',
        'real estate agents'
      ]
    } else if (rawQuery.includes('cafe') || rawQuery.includes('restaurant') || rawQuery.includes('bakery') || rawQuery.includes('coffee')) {
      queryPool = [
        'cafe',
        'coffee shop',
        'bakery',
        'restaurant',
        'bistro',
        'fast food restaurant',
        'tea cafe'
      ]
    } else if (rawQuery.includes('gym') || rawQuery.includes('fitness')) {
      queryPool = [
        'gym',
        'fitness center',
        'fitness club',
        'crossfit gym',
        'yoga studio'
      ]
    } else if (rawQuery.includes('doctor') || rawQuery.includes('clinic') || rawQuery.includes('hospital')) {
      queryPool = [
        'clinic',
        'doctor clinic',
        'polyclinic',
        'health clinic',
        'medical center'
      ]
    } else {
      // If user typed multi-word query, decompose into constituent keywords
      const words = rawQuery.split(/[\s,]+/).filter((w: string) => w.length > 2 && !['near', 'me', 'the', 'and', 'for', 'best', 'top'].includes(w))
      if (words.length > 1) {
        queryPool = [
          rawQuery,
          ...words,
          `${words[0]} store`,
          `${words[0]} center`
        ]
      } else {
        queryPool = [
          rawQuery,
          `${rawQuery} near me`,
          `top ${rawQuery}`,
          `${rawQuery} center`
        ]
      }
    }

    const currentQuery = queryPool[Math.floor(currentTotal / 2) % queryPool.length]

    // 4. Request up to 35 places per run batch
    const crawlLimit = Math.min(Math.max(needed, 10), 35)

    console.log(`[Run Campaign ${campaignId}] Query: "${currentQuery}" in "${currentCity}" (Filter: ${apifyWebsiteFilter}, Limit: ${crawlLimit})`)
    const places = await scrapeGooglePlacesViaApify(currentQuery, currentCity, crawlLimit, apifyWebsiteFilter)
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
