import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(req: Request) {
  try {
    const { leadId, websiteUrl, businessName, category } = await req.json()

    if (!leadId && !websiteUrl) {
      return NextResponse.json({ error: 'leadId or websiteUrl is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    let currentLead: any = null

    if (leadId) {
      const { data: lead, error: leadErr } = await supabase
        .from('leads')
        .select('*, campaigns(*), website_audits(*)')
        .eq('id', leadId)
        .single()

      if (leadErr || !lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }
      currentLead = lead
    }

    const targetUrl = websiteUrl || currentLead?.website_url
    const name = businessName || currentLead?.business_name || 'Business'
    const niche = category || currentLead?.campaigns?.niche || 'Local Business'

    let scrapedMarkdown = ''
    let httpStatus = 200
    let siteState = targetUrl ? 'exists' : 'none'

    // 1. Scrape website with Firecrawl if URL is available
    if (targetUrl) {
      console.log(`[Audit] Scraping website with Firecrawl: ${targetUrl}`)
      try {
        const firecrawlRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`,
            formats: ['markdown'],
            onlyMainContent: true,
            timeout: 25000
          }),
          signal: AbortSignal.timeout(28000)
        })

        httpStatus = firecrawlRes.status

        if (firecrawlRes.ok) {
          const fcData = await firecrawlRes.json()
          if (fcData.success && fcData.data?.markdown) {
            scrapedMarkdown = fcData.data.markdown.slice(0, 4000) // First 4000 chars is plenty for Gemini
            const lowerMd = scrapedMarkdown.toLowerCase()
            const isBroken =
              lowerMd.includes('404 not found') ||
              lowerMd.includes("this page isn't available") ||
              lowerMd.includes("page isn't available") ||
              lowerMd.includes('page not found') ||
              lowerMd.includes('error 404') ||
              lowerMd.includes('domain for sale') ||
              lowerMd.includes('account suspended') ||
              lowerMd.includes('website under construction') ||
              lowerMd.includes('err_name_not_resolved') ||
              lowerMd.includes('channel does not exist') ||
              scrapedMarkdown.trim().length < 30

            siteState = isBroken ? 'broken' : 'exists'
          } else {
            scrapedMarkdown = `Website reachable but contained sparse or blocked content.`
            siteState = 'broken'
          }
        } else {
          console.warn(`[Audit] Firecrawl status ${firecrawlRes.status}`)
          scrapedMarkdown = `Failed to scrape website. HTTP Status: ${firecrawlRes.status}`
          siteState = firecrawlRes.status >= 400 ? 'broken' : 'none'
        }
      } catch (err: any) {
        console.error('[Audit] Firecrawl error:', err.message)
        scrapedMarkdown = `Website connection timed out or unreachable: ${err.message}`
        siteState = 'broken'
        httpStatus = 504
      }
    } else {
      scrapedMarkdown = 'No website registered on Google Maps profile. Business relies purely on local listings.'
      siteState = 'none'
      httpStatus = 404
    }

    // 2. Analyze with Gemini 3.8 Flash
    console.log(`[Audit] Running Gemini 3.8 Flash analysis for ${name}`)
    let auditData = {
      flaws: [
        'Lacks 1-click WhatsApp appointment booking button',
        'Mobile page load optimization needed',
        'Missing localized customer conversion funnel'
      ],
      strengths: [
        'High Google Maps search visibility',
        'Positive local customer reputation'
      ],
      score: targetUrl ? (siteState === 'broken' ? 88 : 78) : 85,
      pitch_angle: siteState === 'none' ? 'No Website Customer Loss' : (siteState === 'broken' ? 'Broken Website Leak' : 'WhatsApp Booking Engine'),
      ai_pitch: `Hey ${name}! Noticed you have great reviews on Google Maps, but your website ${targetUrl || 'presence'} is missing a quick 1-tap WhatsApp booking flow. Most mobile customers drop off without booking. We built a fast booking page specifically for ${niche} that fixes this. Can I share a 30-sec preview?`
    }

    if (GEMINI_API_KEY) {
      try {
        const prompt = `You are a world-class B2B Growth Auditor & High-Converting WhatsApp Outreach Copywriter.
Analyze this business:
- Business Name: "${name}"
- Industry / Niche: "${niche}"
- Website URL: "${targetUrl || 'None'}"
- Scraped Website Content:
"""
${scrapedMarkdown}
"""

Task:
1. Detect Website Health: Is the URL healthy ("exists"), broken/404/dead/error page ("broken"), or missing ("none")?
2. Identify 3 to 4 specific, actionable flaws or revenue leaks (e.g. 404 error page losing leads, lack of mobile booking, no WhatsApp chat widget, no clear pricing).
3. Identify 2 genuine strengths to compliment them on.
4. Calculate an opportunity score (integer between 60 and 98), where higher means greater urgency/pitch potential.
5. Define a clear pitch_angle (short phrase, e.g. "Broken Web Link Fix", "Instant WhatsApp Booking System", "Automated Lead Capture").
6. Write a personalized, high-converting, friendly WhatsApp message (under 60 words):
   - Hook: Friendly compliment on their business reputation.
   - Pain/Observation: Point out the specific issue naturally without being offensive.
   - Low-friction offer: "Mind if I send a 30-sec screen recording showing how to fix this?" or "Can I send a free preview template?"
   - Must NOT sound like generic AI spam.

Respond ONLY with valid JSON in this exact structure:
{
  "detected_site_state": "exists" | "broken" | "none",
  "flaws": ["string", "string", "string"],
  "strengths": ["string", "string"],
  "score": 85,
  "pitch_angle": "string",
  "ai_pitch": "string"
}`

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                responseMimeType: 'application/json'
              }
            }),
            signal: AbortSignal.timeout(20000)
          }
        )

        if (geminiRes.ok) {
          const geminiJson = await geminiRes.json()
          const rawText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text
          if (rawText) {
            try {
              const parsed = JSON.parse(rawText)
              if (parsed.flaws && parsed.ai_pitch) {
                if (parsed.detected_site_state && ['exists', 'broken', 'none'].includes(parsed.detected_site_state)) {
                  siteState = parsed.detected_site_state
                }
                auditData = {
                  flaws: parsed.flaws,
                  strengths: parsed.strengths || auditData.strengths,
                  score: typeof parsed.score === 'number' ? parsed.score : auditData.score,
                  pitch_angle: parsed.pitch_angle || auditData.pitch_angle,
                  ai_pitch: parsed.ai_pitch
                }
              }
            } catch (pErr) {
              console.warn('[Audit] Failed to parse Gemini JSON reply:', rawText)
            }
          }
        } else {
          console.warn('[Audit] Gemini HTTP error:', geminiRes.status, await geminiRes.text())
        }
      } catch (gErr: any) {
        console.error('[Audit] Gemini API error:', gErr.message)
      }
    }

    // 3. Save to Supabase
    let savedAudit: any = null
    if (leadId) {
      // Upsert website_audits
      const { data: auditRecord, error: auditErr } = await supabase
        .from('website_audits')
        .upsert(
          {
            lead_id: leadId,
            http_status: httpStatus,
            scraped_text: scrapedMarkdown.slice(0, 1500),
            findings: {
              flaws: auditData.flaws,
              strengths: auditData.strengths
            },
            ai_pitch: auditData.ai_pitch,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'lead_id' }
        )
        .select()
        .single()

      if (auditErr) {
        console.error('[Audit] Supabase audit insert error:', auditErr)
      } else {
        savedAudit = auditRecord
      }

      // Update lead
      await supabase
        .from('leads')
        .update({
          site_state: siteState as any,
          status: 'enriched',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
    }

    return NextResponse.json({
      success: true,
      audit: savedAudit || {
        lead_id: leadId,
        http_status: httpStatus,
        findings: {
          flaws: auditData.flaws,
          strengths: auditData.strengths
        },
        ai_pitch: auditData.ai_pitch
      },
      score: auditData.score,
      pitch_angle: auditData.pitch_angle,
      site_state: siteState
    })
  } catch (error: any) {
    console.error('[Audit] Global error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
