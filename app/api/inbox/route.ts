import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function calculateLeadScore(lead: any, audit?: any): number {
  if (lead.score != null) return lead.score
  let score = 50

  // Website status is prime angle
  if (lead.site_state === 'broken') score += 40
  else if (lead.site_state === 'none') score += 35
  else if (lead.site_state === 'exists') score += 15

  // High Google rating = reputable business that cares about customer flow
  if (lead.google_rating) {
    if (lead.google_rating >= 4.5) score += 8
    else if (lead.google_rating >= 4.0) score += 5
  }

  // Audit findings (if flaws exist, high pitch potential)
  if (audit?.findings?.flaws?.length) {
    score += Math.min(10, audit.findings.flaws.length * 3)
  }

  return Math.min(99, Math.max(25, score))
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch leads with their website audits and campaigns
    const { data: leads, error: lErr } = await supabase
      .from('leads')
      .select('*, website_audits(*), campaigns(*)')
      .order('updated_at', { ascending: false })

    if (lErr) throw lErr

    // Fetch conversations and messages
    const { data: conversations, error: cErr } = await supabase
      .from('conversations')
      .select('*, messages(*)')

    const convMap: Record<string, any> = {}
    if (conversations) {
      for (const c of conversations) {
        convMap[c.lead_id] = c
      }
    }

    const enrichedLeads = (leads || []).map((lead) => {
      const audit = Array.isArray(lead.website_audits)
        ? lead.website_audits[0]
        : lead.website_audits
      return {
        ...lead,
        website_audits: audit || null,
        score: calculateLeadScore(lead, audit)
      }
    })

    const sortedLeads = enrichedLeads.sort((a, b) => {
      // 1. Priority to 'replied' leads
      if (a.status === 'replied' && b.status !== 'replied') return -1
      if (b.status === 'replied' && a.status !== 'replied') return 1

      // 2. Compare latest conversation message time or updated_at
      const convA = convMap[a.id]
      const convB = convMap[b.id]
      const timeA = convA?.last_message_at
        ? new Date(convA.last_message_at).getTime()
        : (a.updated_at ? new Date(a.updated_at).getTime() : 0)
      const timeB = convB?.last_message_at
        ? new Date(convB.last_message_at).getTime()
        : (b.updated_at ? new Date(b.updated_at).getTime() : 0)

      return timeB - timeA
    })

    return NextResponse.json({
      leads: sortedLeads,
      conversations: convMap
    })
  } catch (error: any) {
    console.error('[Inbox GET] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { leadId, body, direction = 'outbound' } = await req.json()

    if (!leadId || !body) {
      return NextResponse.json({ error: 'leadId and message body are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Ensure conversation exists
    let { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('lead_id', leadId)
      .maybeSingle()

    if (!conv) {
      const { data: newConv, error: newConvErr } = await supabase
        .from('conversations')
        .insert({
          lead_id: leadId,
          unread_count: 0,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (newConvErr || !newConv) throw newConvErr || new Error('Failed to create conversation')
      conv = newConv
    }

    // 2. Insert message
    const { data: message, error: msgErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: conv!.id,
        direction,
        body,
        status: 'delivered',
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString()
      })
      .select()
      .single()

    if (msgErr) throw msgErr

    // 3. Update lead status if outbound pitch
    await supabase
      .from('leads')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)

    return NextResponse.json({ success: true, message })
  } catch (error: any) {
    console.error('[Inbox POST] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
