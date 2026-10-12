import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const leadId = searchParams.get('leadId')

    const supabase = createAdminClient()

    // If specific leadId requested
    if (leadId) {
      // 1. Try fetching from client_deals table
      try {
        const { data: deal } = await supabase
          .from('client_deals')
          .select('*')
          .eq('lead_id', leadId)
          .maybeSingle()

        if (deal) {
          return NextResponse.json({ success: true, deal })
        }
      } catch {}

      // 2. Fallback to parsing from lead notes
      const { data: lead } = await supabase
        .from('leads')
        .select('id, notes, business_name, owner_name, phone, address')
        .eq('id', leadId)
        .single()

      if (lead?.notes) {
        try {
          const parsed = JSON.parse(lead.notes)
          if (parsed?.__deal) {
            return NextResponse.json({
              success: true,
              deal: {
                ...parsed.__deal,
                lead_id: leadId,
                client_name: lead.business_name || lead.owner_name,
                client_phone: lead.phone
              }
            })
          }
        } catch {}
      }

      // Default template if no deal exists yet
      return NextResponse.json({
        success: true,
        deal: {
          lead_id: leadId,
          client_name: lead?.business_name || lead?.owner_name || 'Client Business',
          client_phone: lead?.phone || '',
          deal_value: 35000,
          advance_paid: 17500,
          balance_due: 17500,
          currency: 'INR',
          payment_mode: 'upi',
          service_type: 'Custom Website + WhatsApp Booking Funnel',
          project_scope: 'Responsive modern website, mobile speed optimization, and 1-tap WhatsApp booking engine.',
          features: [
            'Next.js Ultra-Fast Architecture',
            '100% Mobile Responsive Layout',
            '1-Tap WhatsApp Booking Engine',
            'Google Maps & Local SEO Setup',
            'SSL Certificate & Domain Linking',
            '30-Day Tech Support & Bug Warranty'
          ],
          installments: [
            { id: 'inst-1', label: '50% Advance Booking', amount: 17500, due_date: new Date().toISOString().split('T')[0], status: 'paid' },
            { id: 'inst-2', label: '30% Milestone Demo', amount: 10500, due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], status: 'pending' },
            { id: 'inst-3', label: '20% Final Launch', amount: 7000, due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], status: 'pending' }
          ],
          target_deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          stage: 'closing'
        }
      })
    }

    // If no leadId, fetch ALL deals
    const dealsList: any[] = []
    const processedLeadIds = new Set<string>()

    // Try fetching from client_deals
    try {
      const { data: allDbDeals } = await supabase.from('client_deals').select('*')
      if (allDbDeals) {
        for (const d of allDbDeals) {
          dealsList.push(d)
          if (d.lead_id) processedLeadIds.add(d.lead_id)
        }
      }
    } catch {}

    // Also fetch won leads to pull any deals saved in notes
    const { data: wonLeads } = await supabase
      .from('leads')
      .select('id, business_name, owner_name, phone, address, notes, updated_at')
      .eq('status', 'won')

    if (wonLeads) {
      for (const wl of wonLeads) {
        if (!processedLeadIds.has(wl.id)) {
          let foundDeal = null
          if (wl.notes) {
            try {
              const parsed = JSON.parse(wl.notes)
              if (parsed?.__deal) {
                foundDeal = {
                  ...parsed.__deal,
                  lead_id: wl.id,
                  client_name: wl.business_name || wl.owner_name,
                  client_phone: wl.phone
                }
              }
            } catch {}
          }

          if (!foundDeal) {
            foundDeal = {
              lead_id: wl.id,
              client_name: wl.business_name || wl.owner_name || 'Client Business',
              client_phone: wl.phone,
              deal_value: 35000,
              advance_paid: 17500,
              balance_due: 17500,
              currency: 'INR',
              payment_mode: 'upi',
              service_type: 'Custom Website + WhatsApp Booking Funnel',
              project_scope: 'Responsive modern website and 1-tap WhatsApp booking engine.',
              features: [
                'Next.js Ultra-Fast Architecture',
                '100% Mobile Responsive Layout',
                '1-Tap WhatsApp Booking Engine'
              ],
              installments: [
                { id: 'inst-1', label: '50% Advance Booking', amount: 17500, due_date: new Date().toISOString().split('T')[0], status: 'paid' },
                { id: 'inst-2', label: '50% Final Launch', amount: 17500, due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], status: 'pending' }
              ],
              target_deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
              stage: 'closing'
            }
          }

          dealsList.push(foundDeal)
          processedLeadIds.add(wl.id)
        }
      }
    }

    return NextResponse.json({ success: true, deals: dealsList })
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
      client_name,
      client_phone,
      deal_value = 0,
      advance_paid = 0,
      currency = 'INR',
      payment_mode = 'upi',
      service_type = 'Custom Website + WhatsApp Booking Funnel',
      project_scope = '',
      features = [],
      installments = [],
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
      client_name: client_name || null,
      client_phone: client_phone || null,
      deal_value: numValue,
      advance_paid: numAdvance,
      balance_due: balanceDue,
      currency,
      payment_mode,
      service_type,
      project_scope,
      features: Array.isArray(features) ? features : [],
      installments: Array.isArray(installments) ? installments : [],
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
