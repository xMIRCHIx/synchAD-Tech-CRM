import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'synchad_crm_secret'

// GET: Meta Webhook Verification Challenge
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Meta Webhook Verified Successfully]')
    return new Response(challenge, { status: 200 })
  }

  return new Response('Verification token mismatch', { status: 403 })
}

// POST: Inbound WhatsApp Messages & Status Updates from Meta
export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }

    const supabase = createAdminClient()

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value
        if (!value) continue

        // 1. Process Inbound Messages
        if (value.messages && value.messages.length > 0) {
          for (const msg of value.messages) {
            const rawFrom = String(msg.from || '').replace(/[^\d]/g, '')
            if (!rawFrom) continue

            const formattedPhone = `+${rawFrom}`
            const senderName = value.contacts?.[0]?.profile?.name || `WhatsApp Contact`
            const msgBody = msg.text?.body || msg.button?.text || (msg.type ? `[${msg.type.toUpperCase()}]` : 'Incoming Message')
            const waMsgId = msg.id
            const timestamp = msg.timestamp ? new Date(Number(msg.timestamp) * 1000).toISOString() : new Date().toISOString()

            console.log(`[WhatsApp Inbound]: From ${formattedPhone} (${senderName}): "${msgBody}"`)

            // A. Find or create lead in Supabase
            let { data: lead } = await supabase
              .from('leads')
              .select('id, business_name, phone, status')
              .or(`phone.eq.${formattedPhone},phone.eq.${rawFrom},phone.eq.+91${rawFrom.slice(-10)}`)
              .maybeSingle()

            if (!lead) {
              const { data: newLead, error: leadErr } = await supabase
                .from('leads')
                .insert({
                  business_name: senderName !== 'WhatsApp Contact' ? senderName : `WhatsApp Contact (${formattedPhone})`,
                  phone: formattedPhone,
                  status: 'replied',
                  site_state: 'unknown',
                  google_rating: 5.0,
                  owner_name: senderName,
                  notes: `Inbound WhatsApp message received: "${msgBody}"`,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select()
                .single()

              if (leadErr || !newLead) {
                console.error('[Webhook Lead Insert Error]:', leadErr)
                continue
              }
              lead = newLead
            } else {
              // Update lead status to replied and bump updated_at so it floats to the very top!
              await supabase
                .from('leads')
                .update({
                  status: 'replied',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', lead.id)
            }

            if (!lead) continue

            // B. Find or create conversation for this lead
            let { data: conv } = await supabase
              .from('conversations')
              .select('id, unread_count')
              .eq('lead_id', lead.id)
              .maybeSingle()

            if (!conv) {
              const { data: newConv, error: convErr } = await supabase
                .from('conversations')
                .insert({
                  lead_id: lead.id,
                  unread_count: 1,
                  last_message_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select()
                .single()

              if (convErr || !newConv) {
                console.error('[Webhook Conv Insert Error]:', convErr)
                continue
              }
              conv = newConv
            } else {
              await supabase
                .from('conversations')
                .update({
                  unread_count: (conv.unread_count || 0) + 1,
                  last_message_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', conv.id)
            }

            if (!conv) continue

            // C. Insert message into messages table
            const { error: msgInsertErr } = await supabase
              .from('messages')
              .insert({
                conversation_id: conv.id,
                direction: 'inbound',
                body: msgBody,
                status: 'delivered',
                wa_message_id: waMsgId,
                sent_at: timestamp,
                delivered_at: new Date().toISOString(),
              })

            if (msgInsertErr) {
              console.error('[Webhook Msg Insert Error]:', msgInsertErr)
            }
          }
        }

        // 2. Process Status Updates (Sent, Delivered, Read)
        if (value.statuses && value.statuses.length > 0) {
          for (const statusObj of value.statuses) {
            const status = statusObj.status
            const waId = statusObj.id
            if (waId && status) {
              const updates: Record<string, any> = { status }
              if (status === 'delivered') updates.delivered_at = new Date().toISOString()
              if (status === 'read') updates.read_at = new Date().toISOString()

              await supabase
                .from('messages')
                .update(updates)
                .eq('wa_message_id', waId)
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (error: any) {
    console.error('[WhatsApp Webhook Error]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
