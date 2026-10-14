import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStrategicWhyPitch } from '@/lib/nichePitch'

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(req: Request) {
  try {
    const { leadId, websiteUrl, businessName, category, regeneratePitchOnly, senderName } = await req.json()

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

    const rawUrl = (websiteUrl || currentLead?.website_url || '').trim()
    const targetUrl = (rawUrl && rawUrl.toLowerCase() !== 'null' && rawUrl.toLowerCase() !== 'undefined') ? rawUrl : ''
    const rawName = businessName || currentLead?.business_name || ''
    const isDirectContact = rawName.toLowerCase().startsWith('direct contact')
    const name = isDirectContact ? '' : rawName
    const niche = category || currentLead?.campaigns?.niche || 'Local Business'

    let scrapedMarkdown = ''
    let httpStatus = 200
    let siteState = targetUrl ? 'exists' : 'none'

    const existingAudit = Array.isArray(currentLead?.website_audits) 
      ? currentLead?.website_audits[0] 
      : currentLead?.website_audits

    // 1. Scrape website with Firecrawl if URL is available (skip if regeneratePitchOnly and existing scraped_text is present)
    if (targetUrl) {
      if (regeneratePitchOnly && existingAudit?.scraped_text) {
        scrapedMarkdown = existingAudit.scraped_text
        siteState = currentLead?.site_state || 'exists'
      } else {
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
              scrapedMarkdown = fcData.data.markdown.slice(0, 4000)
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
      }
    } else {
      scrapedMarkdown = 'No website registered on Google Maps profile. Business relies purely on local listings.'
      siteState = 'none'
      httpStatus = 404
    }

    // 2. High-Converting Niche-Personalized Pitch Defaults
    const greeting = name ? `Hey ${name}!` : 'Hey there!'
    const strategy = getStrategicWhyPitch({
      businessName: name,
      ownerName: currentLead?.owner_name,
      niche,
      address: currentLead?.address,
      websiteUrl: targetUrl,
      siteState,
      googleRating: currentLead?.google_rating,
      senderName,
      includeSenderName: Boolean(senderName)
    })

    const defaultAiPitch = strategy.defaultHook

    let auditData = {
      flaws: existingAudit?.findings?.flaws || [
        siteState === 'none'
          ? `No official digital platform for customers searching in ${strategy.nicheLabel}`
          : 'Lacks direct WhatsApp inquiry and portfolio showcase for mobile visitors',
        'Mobile visitors bounce to competitors with active digital portals',
        'Missing localized customer enquiry automation'
      ],
      strengths: existingAudit?.findings?.strengths || [
        'High Google Maps search visibility and reviews',
        'Established local business reputation'
      ],
      score: targetUrl ? (siteState === 'broken' ? 88 : 78) : 85,
      pitch_angle: strategy.angle,
      ai_pitch: defaultAiPitch
    }

    // 3. Analyze with Gemini
    if (GEMINI_API_KEY) {
      try {
        const prompt = `You are a world-class B2B Growth Auditor & High-Converting WhatsApp Outreach Copywriter for SynchAD Tech.
Analyze this business:
- Business Name: "${name || 'Local Business'}"
- Industry / Niche: "${niche}" (${strategy.nicheLabel})
- Location: "${currentLead?.address || 'India'}"
- Website URL: "${targetUrl || 'None'}"
- Outreach Sender Persona: "${senderName || 'SynchAD Tech Specialist'}"
- Scraped Website / Profile Info:
"""
${scrapedMarkdown}
"""

Task:
1. Detect Website Health: Is the URL healthy ("exists"), broken/404/dead/error page ("broken"), or missing ("none")?
2. Identify 3 specific, actionable flaws or revenue leaks tailored to their industry (${strategy.nicheLabel}).
3. Identify 2 genuine strengths to compliment them on.
4. Calculate an opportunity score (integer between 65 and 95).
5. Define a clear pitch_angle tailored to ${strategy.nicheLabel}.
6. Write a personalized, high-converting WhatsApp outreach message under 65 words:
   STRICT RULES FOR THE MESSAGE:
   - Greeting & Personal Touch: Start with "${greeting} ${senderName ? `${senderName} here from SynchAD Tech. ` : ''}" (NEVER use "Direct Contact" or a phone number as their name).
   - NEVER CLAIM THAT YOU HAVE ALREADY BUILT A WEBSITE OR DEMO FOR THEM.
   - ABSOLUTE BAN ON GENERIC ROBOTIC PHRASES LIKE "1-tap booking" OR "1-tap WhatsApp booking engine".
   - INDUSTRY-SPECIFIC VALUE:
     * If Real Estate: Focus on property buyers browsing online, verified property showcase, downloadable brochures, and direct WhatsApp buyer inquiries.
     * If CA / Tax / Accounting: Focus on corporate trust, partner credibility, GST/tax advisory service portfolios, and client consultation booking.
     * If Clinic / Doctor: Focus on patient trust, treatments offered, and online appointment booking.
     * If Coaching / Education: Focus on student admissions, batch schedules, topper results, and free demo class bookings.
     * If Restaurant / Cafe: Focus on digital menu with photos, ambiance, and direct table/takeaway orders without heavy Swiggy/Zomato commission loss.
     * If Hotel / Resort: Focus on room photos, tariffs, and direct booking saving 15-20% OTA commissions on MakeMyTrip.
     * If Gym / Fitness: Focus on equipment showcase, membership tiers, and 1-day free trial pass registrations.
     * If Interior / Architecture: Focus on 3D renders, past project portfolio galleries, and design consultation booking.
     * If Other / Local Business: Focus on their specific business strengths and direct mobile customer inquiry funnels.
   - Offer work samples on request: Say "If you'd like, I can share a few of our work samples / recent client case studies".
   - The Call-To-Action (CTA) MUST ask for a quick 5-minute call or Zoom meeting (e.g. "Would you be open for a quick 5-minute call or Zoom meeting this week?").
   - Tone: Friendly, professional, conversational, zero hype, zero spammy language.

Respond ONLY with valid JSON in this exact structure:
{
  "detected_site_state": "exists" | "broken" | "none",
  "flaws": ["string", "string", "string"],
  "strengths": ["string", "string"],
  "score": 85,
  "pitch_angle": "string",
  "ai_pitch": "string"
}`

        const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash']
        let rawText = ''

        for (const model of candidateModels) {
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
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
                signal: AbortSignal.timeout(18000)
              }
            )

            if (geminiRes.ok) {
              const geminiJson = await geminiRes.json()
              rawText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text || ''
              if (rawText) break
            }
          } catch (mErr) {
            // Try next model
          }
        }

        if (rawText) {
          try {
            const parsed = JSON.parse(rawText)
            if (parsed.ai_pitch) {
              if (parsed.detected_site_state && ['exists', 'broken', 'none'].includes(parsed.detected_site_state)) {
                siteState = parsed.detected_site_state
              }
              auditData = {
                flaws: parsed.flaws || auditData.flaws,
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
      } catch (gErr: any) {
        console.error('[Audit] Gemini API error:', gErr.message)
      }
    }

    // 4. Save to Supabase
    let savedAudit: any = null
    if (leadId) {
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
            opportunity_score: auditData.score,
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

      await supabase
        .from('leads')
        .update({
          site_state: siteState as any,
          score: auditData.score,
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
        ai_pitch: auditData.ai_pitch,
        opportunity_score: auditData.score
      },
      ai_pitch: auditData.ai_pitch,
      score: auditData.score,
      pitch_angle: auditData.pitch_angle,
      site_state: siteState
    })
  } catch (error: any) {
    console.error('[Audit] Global error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
