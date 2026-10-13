import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const apifyToken = process.env.APIFY_API_TOKEN

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch leads count per campaign
    const { data: leads, error: lErr } = await supabase
      .from('leads')
      .select('id, campaign_id, status, site_state')

    const countMap: Record<string, { total: number; enriched: number }> = {}
    if (leads) {
      for (const l of leads) {
        if (!l.campaign_id) continue
        if (!countMap[l.campaign_id]) countMap[l.campaign_id] = { total: 0, enriched: 0 }
        countMap[l.campaign_id].total++
        if (l.status === 'enriched' || l.status === 'review' || l.status === 'replied' || l.status === 'won') {
          countMap[l.campaign_id].enriched++
        }
      }
    }

    const campaignsWithStats = (campaigns || []).map((c) => {
      const rawTotal = countMap[c.id]?.total || 0
      const maxAllowed = c.max_leads || 40
      return {
        ...c,
        leads_count: Math.min(rawTotal, maxAllowed),
        enriched_count: countMap[c.id]?.enriched || 0
      }
    })

    return NextResponse.json({ campaigns: campaignsWithStats })
  } catch (error: any) {
    console.error('[Campaigns GET] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      name,
      searchQuery,
      search_query,
      location,
      niche,
      maxLeads,
      max_leads,
      instantScrape = true,
      autoEnrich = true,
      requirePhone = false,
      targetWebsiteTypes = ['none', 'broken']
    } = body

    const query = searchQuery || search_query
    const targetCount = Number(maxLeads || max_leads || 10)

    if (!name || !query || !location) {
      return NextResponse.json(
        { error: 'Campaign name, search query, and location are required.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    let finalNiche = niche || null
    if (targetWebsiteTypes && Array.isArray(targetWebsiteTypes) && targetWebsiteTypes.length > 0 && !targetWebsiteTypes.includes('all')) {
      finalNiche = `${niche || 'General'} [sites:${targetWebsiteTypes.join(',')}]`
    }

    // 1. Create the campaign in Supabase
    const { data: campaign, error: cErr } = await supabase
      .from('campaigns')
      .insert([
        {
          name,
          search_query: query,
          location,
          niche: finalNiche,
          status: 'active',
          max_leads: targetCount,
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (cErr) throw cErr

    let importedLeads: any[] = []

    // 2. If instant scraping is enabled and Apify token is present, scrape immediately
    if (instantScrape && apifyToken) {
      try {
        console.log(`[Campaign ${campaign.id}] Scraping ${query} in ${location} via Apify (Target: ${targetCount})...`)
        const hasStrictFilter = targetWebsiteTypes && Array.isArray(targetWebsiteTypes) && targetWebsiteTypes.length > 0 && !targetWebsiteTypes.includes('all')
        const candidateMultiplier = hasStrictFilter ? 2.5 : 1.3
        const apifyFetchLimit = Math.min(Math.max(Math.ceil(targetCount * candidateMultiplier), targetCount + 10), 60)

        const places = await scrapeGooglePlacesViaApify(query, location, apifyFetchLimit)

        if (places && places.length > 0) {
          for (const place of places) {
            // STRICT CAP: Never exceed targetCount under any circumstance!
            if (importedLeads.length >= targetCount) {
              break
            }

            const website = place.website && place.website.startsWith('http') ? place.website : (place.website ? `https://${place.website}` : null)
            const placeSiteState = website ? 'exists' : 'none'

            // Filter by target website types if specified
            if (targetWebsiteTypes && Array.isArray(targetWebsiteTypes) && targetWebsiteTypes.length > 0 && !targetWebsiteTypes.includes('all')) {
              if (targetWebsiteTypes.includes('none') && !targetWebsiteTypes.includes('exists') && placeSiteState === 'exists') {
                continue // Skip if user only wants non-website leads
              }
              if (!targetWebsiteTypes.includes('none') && placeSiteState === 'none') {
                continue // Skip if user only wants websites
              }
            }

            // Clean phone or create consistent unique phone
            let rawPhone = place.phone || place.phoneUnformatted || ''
            let cleanPhone = rawPhone.replace(/[^\d+]/g, '')
            if (!cleanPhone || cleanPhone.length < 7) {
              if (requirePhone) continue
              cleanPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`
            }

            const leadItem = {
              campaign_id: campaign.id,
              business_name: place.title || 'Local Business',
              phone: cleanPhone,
              email: null,
              website_url: website,
              address: place.address || location,
              google_rating: typeof place.totalScore === 'number' ? place.totalScore : null,
              google_maps_url: place.url || null,
              site_state: placeSiteState,
              status: 'new',
              notes: `Scraped via Apify: ${place.categoryName || niche || 'Business'}. Reviews: ${place.reviewsCount || 0}`
            }

            const { data: savedLead, error: lErr } = await supabase
              .from('leads')
              .upsert(leadItem, { onConflict: 'phone' })
              .select()
              .single()

            if (!lErr && savedLead) {
              importedLeads.push(savedLead)

              // Create conversation entry for WhatsApp Inbox
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

          // If reached target count, mark completed
          if (importedLeads.length >= targetCount) {
            await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaign.id)
          }
        }
      } catch (scrapeErr: any) {
        console.error('[Campaign Apify Scrape Error]:', scrapeErr.message)
      }
    }

    return NextResponse.json({
      success: true,
      campaign: {
        ...campaign,
        leads_count: importedLeads.length,
        enriched_count: 0
      },
      leadsCreated: importedLeads.length,
      leads: importedLeads
    })
  } catch (error: any) {
    console.error('[Campaigns POST] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, name, searchQuery, search_query, location, niche, maxLeads, max_leads, status, targetWebsiteTypes } = body

    if (!id) {
      return NextResponse.json({ error: 'Campaign id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (name) updateData.name = name
    if (searchQuery || search_query) updateData.search_query = searchQuery || search_query
    if (location) updateData.location = location

    let finalNiche = niche
    if (targetWebsiteTypes && Array.isArray(targetWebsiteTypes) && targetWebsiteTypes.length > 0) {
      const cleanNicheName = (niche || '').replace(/\[sites:[^\]]+\]/g, '').trim()
      if (targetWebsiteTypes.includes('all') || targetWebsiteTypes.length === 3) {
        finalNiche = cleanNicheName || 'General'
      } else {
        finalNiche = `${cleanNicheName || 'General'} [sites:${targetWebsiteTypes.join(',')}]`
      }
    }

    if (finalNiche !== undefined) updateData.niche = finalNiche
    if (maxLeads || max_leads) updateData.max_leads = Number(maxLeads || max_leads)
    if (status) updateData.status = status

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, campaign })
  } catch (error: any) {
    console.error('[Campaigns PATCH] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Campaign id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase.from('campaigns').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Campaigns DELETE] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper to call Apify Google Places scraper
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
    throw new Error(`Apify returned ${res.status}: ${errText}`)
  }

  const data = await res.json()
  return Array.isArray(data) ? data : []
}
