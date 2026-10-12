import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const leadId = searchParams.get('leadId')

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Try fetching from client_deals table
    const { data: deal, error: dealErr } = await supabase
      .from('client_deals')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle()

    if (deal) {
      return NextResponse.json({ success: true, deal })
    }

    // 2. Fallback to parsing from lead notes
    const { data: lead } = await supabase
      .from('leads')
      .select('id, notes, business_name, owner_name, phone')
      .eq('id', leadId)
      .single()

    if (lead?.notes) {
      try {
        const parsed = JSON.parse(lead.notes)
        if (parsed?.__deal) {
          return NextResponse.json({ success: true, deal: { ...parsed.__deal, lead_id: leadId } })
        }
      } catch {
        // notes is not JSON, return default template
      }
    }

    // Default template if no deal exists yet
    return NextResponse.json({
      success: true,
      deal: {
        lead_id: leadId,
        deal_value: 35000,
        advance_paid: 17500,
        balance_due: 17500,
        currency: 'INR',
        payment_mode: 'upi',
        service_type: 'Custom Website + WhatsApp Booking Funnel',
        project_scope: 'Design, mobile speed optimization, and 1-tap WhatsApp booking engine.',
        target_deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        stage: 'closing'
      }
    })
  } catch (err: any) {
    console.error('[Deal GET] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      lead_id,
      deal_value = 0,
      advance_paid = 0,
      currency = 'INR',
      payment_mode = 'upi',
      service_type = 'Custom Website + WhatsApp Booking Funnel',
      project_scope = '',
      target_deadline,
      stage = 'closing'
    } = body

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 })
    }

    const numValue = Number(deal_value) || 0
    const numAdvance = Number(advance_paid) || 0
    const balanceDue = Math.max(0, numValue - numAdvance)

    const dealPayload = {
      lead_id,
      deal_value: numValue,
      advance_paid: numAdvance,
      balance_due: balanceDue,
      currency,
      payment_mode,
      service_type,
      project_scope,
      target_deadline: target_deadline || null,
      stage,
      updated_at: new Date().toISOString()
    }

    const supabase = createAdminClient()

    // 1. Try upserting into client_deals table
    let savedDeal = null
    try {
      const { data: dbDeal, error: dealErr } = await supabase
        .from('client_deals')
        .upsert(dealPayload, { onConflict: 'lead_id' })
        .select()
        .single()

      if (!dealErr && dbDeal) {
        savedDeal = dbDeal
      }
    } catch {
      // client_deals table might not exist yet, fallback
    }

    // 2. Fallback / Sync in leads table (store __deal in notes & mark won)
    const { data: lead } = await supabase.from('leads').select('notes').eq('id', lead_id).single()
    let currentNotesObj: any = {}
    if (lead?.notes) {
      try {
        currentNotesObj = JSON.parse(lead.notes)
      } catch {
        currentNotesObj = { text: lead.notes }
      }
    }
    currentNotesObj.__deal = dealPayload

    await supabase
      .from('leads')
      .update({
        notes: JSON.stringify(currentNotesObj),
        status: 'won',
        updated_at: new Date().toISOString()
      })
      .eq('id', lead_id)

    return NextResponse.json({
      success: true,
      deal: savedDeal || dealPayload
    })
  } catch (err: any) {
    console.error('[Deal POST] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
