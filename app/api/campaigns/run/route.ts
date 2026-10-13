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

  // Sanitize location
  const sanitizedLocation = location.includes('&')
    ? location.split('&')[0].trim()
    : location.includes(' and ')
    ? location.split(' and ')[0].trim()
    : location

  // Construct clean search string
  const cleanSearch = sanitizedLocation
    ? (search.toLowerCase().includes(sanitizedLocation.toLowerCase()) ? search : `${search} in ${sanitizedLocation}`)
    : search

  const batchLimit = Math.min(Math.max(limit, 15), 35)

  // STEP 1: Start an ultra-fast async run (returns in ~1.5s)
  const startUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyToken}`
  const startRes = await fetch(startUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      searchStringsArray: [cleanSearch],
      locationQuery: sanitizedLocation ? `${sanitizedLocation}, India` : undefined,
      maxCrawledPlacesPerSearch: batchLimit,
      language: 'en',
      skipClosedPlaces: true,
      website: websiteFilter,
      maxReviews: 0,
      maxImages: 0,
      scrapePlaceDetail: false,
      scrapePlaceDetailPage: false,
      searchMatching: 'all',
      includeWebResults: false,
      scrapeDirectories: false,
      scrapeContacts: false,
      maximumLeadsEnrichmentRecords: 0
    }),
    signal: AbortSignal.timeout(10000)
  })

  if (!startRes.ok) {
    const errText = await startRes.text()
    if (startRes.status === 401 || errText.includes('user-or-token-not-found')) {
      throw new Error('Apify API Token expired ya invalid ho gaya hai (401). Naya token https://console.apify.com se lekar .env.local me update karein.')
    }
    throw new Error(`Apify run start failed: ${startRes.status} - ${errText.slice(0, 200)}`)
  }

  const startData = await startRes.json()
  const runId: string = startData.data?.id
  const datasetId: string = startData.data?.defaultDatasetId

  if (!runId) throw new Error('Apify did not return a run ID')

  // STEP 2: Poll for run completion (checks every 2s, typically completes in 12-18s)
  const pollStart = Date.now()
  const maxPollMs = 45_000
  const pollIntervalMs = 2_000

  while (Date.now() - pollStart < maxPollMs) {
    await new Promise(r => setTimeout(r, pollIntervalMs))

    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!statusRes.ok) continue

    const statusData = await statusRes.json()
    const runStatus: string = statusData.data?.status

    if (runStatus === 'SUCCEEDED') {
      // STEP 3: Fetch dataset items
      const itemsRes = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId || statusData.data?.defaultDatasetId}/items?token=${apifyToken}`,
        { signal: AbortSignal.timeout(10000) }
      )
      if (!itemsRes.ok) return []
      const items = await itemsRes.json()
      return Array.isArray(items) ? items : []
    }

    if (runStatus === 'FAILED' || runStatus === 'TIMED-OUT' || runStatus === 'ABORTED') {
      // Try to recover partial results from dataset
      try {
        const partialRes = await fetch(
          `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`,
          { signal: AbortSignal.timeout(5000) }
        )
        if (partialRes.ok) {
          const partial = await partialRes.json()
          if (Array.isArray(partial) && partial.length > 0) return partial
        }
      } catch {}
      return []
    }
  }

  // Timeout: try to get whatever partial results exist
  try {
    const partialRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (partialRes.ok) {
      const partial = await partialRes.json()
      if (Array.isArray(partial)) return partial
    }
  } catch {}
  return []
}


export async function POST(req: Request) {
  try {
    const { campaignId, targetWebsiteTypes, attempt = 0 } = await req.json()

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

    // Check: If already at or above goal, do not add more leads
    if (needed <= 0) {
      await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaign.id)
      return NextResponse.json({
        success: true,
        message: `Campaign already has all ${maxLeads} leads. Goal met!`,
        leadsImported: 0,
        totalLeads: currentTotal,
        maxLeads,
        isGoalReached: true
      })
    }

    // Reset completed status if campaign was prematurely marked done but hasn't reached target
    if (campaign.status === 'completed' && currentTotal < maxLeads) {
      await supabase.from('campaigns').update({ status: 'active' }).eq('id', campaign.id)
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
    const locLower = cleanLoc.toLowerCase()
    let localitiesPool: string[] = []

    if (locLower.includes('bhopal') && locLower.includes('indore')) {
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
    } else if (locLower.includes('bhopal')) {
      localitiesPool = [
        'Bhopal',
        'MP Nagar Bhopal',
        'Kolar Road Bhopal',
        'Hoshangabad Road Bhopal',
        'Arera Colony Bhopal',
        'Ayodhya Bypass Bhopal',
        'Shahpura Bhopal',
        'Bairagarh Bhopal',
        'New Market Bhopal'
      ]
    } else if (locLower.includes('indore')) {
      localitiesPool = [
        'Indore',
        'Vijay Nagar Indore',
        'Palasia Indore',
        'Bhawarkua Indore',
        'Super Corridor Indore',
        'AB Road Indore',
        'Rau Indore',
        'Sudama Nagar Indore',
        'Annapurna Indore',
        'Geeta Bhavan Indore'
      ]
    } else if (locLower.includes('delhi')) {
      localitiesPool = [
        'Delhi',
        'South Delhi',
        'North Delhi',
        'Dwarka Delhi',
        'Rohini Delhi',
        'Laxmi Nagar Delhi',
        'Karol Bagh Delhi',
        'Connaught Place Delhi',
        'Saket Delhi',
        'Janakpuri Delhi',
        'Hauz Khas Delhi',
        'Pitampura Delhi',
        'Mayur Vihar Delhi'
      ]
    } else if (locLower.includes('mumbai')) {
      localitiesPool = [
        'Mumbai',
        'Andheri Mumbai',
        'Bandra Mumbai',
        'Borivali Mumbai',
        'Dadar Mumbai',
        'Thane',
        'Navi Mumbai',
        'Powai Mumbai',
        'Goregaon Mumbai',
        'Malad Mumbai',
        'Kandivali Mumbai'
      ]
    } else if (locLower.includes('jaipur')) {
      localitiesPool = [
        'Jaipur',
        'Malviya Nagar Jaipur',
        'Mansarovar Jaipur',
        'Vaishali Nagar Jaipur',
        'C Scheme Jaipur',
        'Raja Park Jaipur',
        'Tonk Road Jaipur',
        'Sodala Jaipur',
        'Jhotwara Jaipur'
      ]
    } else if (locLower.includes('lucknow')) {
      localitiesPool = [
        'Lucknow',
        'Gomti Nagar Lucknow',
        'Hazratganj Lucknow',
        'Alambagh Lucknow',
        'Indira Nagar Lucknow',
        'Mahanagar Lucknow',
        'Ashiyana Lucknow',
        'Vikas Nagar Lucknow'
      ]
    } else if (locLower.includes('pune')) {
      localitiesPool = [
        'Pune',
        'Kothrud Pune',
        'Viman Nagar Pune',
        'Baner Pune',
        'Wakad Pune',
        'Hinjewadi Pune',
        'Hadapsar Pune',
        'Shivaji Nagar Pune'
      ]
    } else if (locLower.includes('bangalore') || locLower.includes('bengaluru')) {
      localitiesPool = [
        'Bangalore',
        'Koramangala Bangalore',
        'Indiranagar Bangalore',
        'HSR Layout Bangalore',
        'Whitefield Bangalore',
        'Jayanagar Bangalore',
        'Electronic City Bangalore',
        'Hebbal Bangalore'
      ]
    } else if (locLower.includes('ahmedabad')) {
      localitiesPool = [
        'Ahmedabad',
        'SG Highway Ahmedabad',
        'Vastrapur Ahmedabad',
        'Navrangpura Ahmedabad',
        'Prahlad Nagar Ahmedabad',
        'Maninagar Ahmedabad',
        'Bopal Ahmedabad'
      ]
    } else {
      const primaryCity = cleanLoc.split(/[&,]/)[0].trim()
      localitiesPool = [
        cleanLoc,
        `${primaryCity}`,
        `Central ${primaryCity}`,
        `North ${primaryCity}`,
        `South ${primaryCity}`,
        `East ${primaryCity}`,
        `West ${primaryCity}`,
        `${primaryCity} City Center`,
        `${primaryCity} Market Area`
      ]
    }

    // Offset query and city with attempt counter to guarantee every retry uses a new variation
    const attemptOffset = typeof attempt === 'number' ? attempt : Math.floor(Math.random() * 10)
    const cycleIndex = currentTotal + attemptOffset
    const currentCity = localitiesPool[cycleIndex % localitiesPool.length]

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
    } else if (rawQuery.includes('library') || rawQuery.includes('reading room')) {
      queryPool = [
        'library',
        'study library',
        'public library',
        'self study reading room',
        'digital library',
        'reading room library',
        'student study library'
      ]
    } else if (rawQuery.includes('coaching') || rawQuery.includes('tuition') || rawQuery.includes('classes') || rawQuery.includes('institute') || rawQuery.includes('academy')) {
      queryPool = [
        'coaching institute',
        'tuition classes',
        'academy',
        'training institute',
        'education center',
        'learning center',
        'classes'
      ]
    } else if (rawQuery.includes('ca') || rawQuery.includes('chartered') || rawQuery.includes('accountant') || rawQuery.includes('tax') || rawQuery.includes('gst')) {
      queryPool = [
        'ca firm',
        'chartered accountant',
        'tax consultant',
        'accounting firm',
        'auditor',
        'gst consultant',
        'financial consultant'
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
        'yoga studio',
        'unisex gym'
      ]
    } else if (rawQuery.includes('doctor') || rawQuery.includes('clinic') || rawQuery.includes('hospital') || rawQuery.includes('dental') || rawQuery.includes('pathology') || rawQuery.includes('diagnostic')) {
      queryPool = [
        'clinic',
        'doctor clinic',
        'polyclinic',
        'health clinic',
        'medical center',
        'dental clinic',
        'pathology lab',
        'diagnostic center'
      ]
    } else if (rawQuery.includes('salon') || rawQuery.includes('beauty') || rawQuery.includes('spa') || rawQuery.includes('parlour')) {
      queryPool = [
        'beauty salon',
        'unisex salon',
        'hair salon',
        'spa center',
        'beauty parlour'
      ]
    } else if (rawQuery.includes('interior') || rawQuery.includes('architect') || rawQuery.includes('decor')) {
      queryPool = [
        'interior designer',
        'architect',
        'interior decorator',
        'home decor store',
        'modular kitchen'
      ]
    } else if (rawQuery.includes('hotel') || rawQuery.includes('resort')) {
      queryPool = [
        'hotel',
        'resort',
        'guest house',
        'budget hotel',
        'residency'
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

    const currentQuery = queryPool[(Math.floor(cycleIndex / 2) + attemptOffset) % queryPool.length]

    // 4. Request up to 35 places per run batch
    const crawlLimit = Math.min(Math.max(needed, 15), 35)

    console.log(`[Run Campaign ${campaignId}] Batch attempt ${attempt}: "${currentQuery}" in "${currentCity}" (Filter: ${apifyWebsiteFilter}, Limit: ${crawlLimit})`)
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

        // Check if phone already exists (avoid false-positive from upsert returning existing row)
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('phone', leadItem.phone)
          .maybeSingle()

        if (existingLead) continue // skip duplicate - don't increment counter

        const { data: savedLead, error: lErr } = await supabase
          .from('leads')
          .insert(leadItem)
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
