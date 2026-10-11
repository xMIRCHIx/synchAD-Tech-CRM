import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { phone, pitchText, leadId, templateName = 'hello_world', languageCode = 'en_US', useTextOnly = false } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Clean phone number: remove non-digits, e.g. "+91 98123-45678" -> "919812345678"
    let cleanPhone = phone.replace(/[^\d]/g, '')
    // If Indian 10-digit number without country code, prepend 91
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`
    }

    const token = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '1268131546394409'

    if (!token) {
      return NextResponse.json({
        error: 'WHATSAPP_ACCESS_TOKEN is missing in .env.local',
        tokenMissing: true
      }, { status: 400 })
    }

    // Prepare Meta Cloud API Payload:
    // If pitchText is provided, try sending as text first so the actual personalized message is delivered!
    // If it's outside the 24h window (code 131047) or template is requested, we send template.
    const messageBody = pitchText || 'Hello from Synchad!'
    const tryTextFirst = Boolean(pitchText || useTextOnly)

    let payload: Record<string, any> = tryTextFirst
      ? {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: messageBody,
          },
        }
      : {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: languageCode,
            },
          },
        }

    console.log(`[Meta WhatsApp Send Request] To: ${cleanPhone}, Type: ${payload.type}`)

    let metaRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    let metaData = await metaRes.json()

    // If text failed because outside 24h window (error code 131047), fallback to template
    if (!metaRes.ok && metaData.error?.code === 131047 && payload.type === 'text') {
      console.log(`[Meta WhatsApp] Outside 24h window. Falling back to template: ${templateName}`)
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
        },
      }
      metaRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      metaData = await metaRes.json()
    }

    if (!metaRes.ok) {
      console.error('[Meta WhatsApp Cloud API Error]:', metaData)
      const errorMsg = metaData.error?.message || 'Meta WhatsApp API returned an error'
      const isExpired = errorMsg.toLowerCase().includes('expired') || metaData.error?.code === 190

      return NextResponse.json(
        {
          error: isExpired
            ? 'Meta Access Token has expired. Please refresh your token in Meta Developer Portal.'
            : errorMsg,
          details: metaData.error,
          isExpired,
        },
        { status: metaRes.status || 400 }
      )
    }

    const messageId = metaData.messages?.[0]?.id || `wamid.${Date.now()}`

    // Record in Supabase
    try {
      const supabase = createAdminClient()

      let targetLeadId = leadId
      if (!targetLeadId) {
        const { data: foundLead } = await supabase
          .from('leads')
          .select('id')
          .or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone},phone.eq.${cleanPhone.slice(-10)}`)
          .maybeSingle()
        if (foundLead) targetLeadId = foundLead.id
      }

      if (targetLeadId) {
        // 1. Ensure conversation exists
        let { data: conv } = await supabase
          .from('conversations')
          .select('id')
          .eq('lead_id', targetLeadId)
          .maybeSingle()

        if (!conv) {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              lead_id: targetLeadId,
              unread_count: 0,
              last_message_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()
          conv = newConv
        } else {
          await supabase
            .from('conversations')
            .update({
              last_message_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', conv.id)
        }

        // 2. Insert message record
        if (conv) {
          await supabase
            .from('messages')
            .insert({
              conversation_id: conv.id,
              direction: 'outbound',
              body: messageBody,
              status: 'delivered',
              wa_message_id: messageId,
              sent_at: new Date().toISOString(),
              delivered_at: new Date().toISOString(),
            })
        }

        // 3. Update lead status & timestamp
        await supabase
          .from('leads')
          .update({
            status: 'sent',
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetLeadId)
      }
    } catch (dbErr) {
      console.error('[DB Recording Error]:', dbErr)
    }

    return NextResponse.json({
      success: true,
      realApi: true,
      messageId,
      recipient: cleanPhone,
      templateUsed: payload.type === 'template' ? payload.template.name : null,
      message: `Message delivered via Meta WhatsApp API (${payload.type === 'template' ? 'Template: ' + payload.template.name : 'Text'}).`
    })
  } catch (error: any) {
    console.error('[WhatsApp Route Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
