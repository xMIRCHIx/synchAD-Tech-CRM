import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const leadId = searchParams.get('leadId')

    const supabase = createAdminClient()
    let query = supabase.from('client_agreements').select('*').order('created_at', { ascending: false })

    if (leadId) {
      query = query.eq('lead_id', leadId)
    }

    const { data: agreements, error } = await query

    if (error) {
      return NextResponse.json({ success: true, agreements: [] })
    }

    return NextResponse.json({ success: true, agreements: agreements || [] })
  } catch (err: any) {
    console.error('[Agreements GET] Error:', err)
    return NextResponse.json({ success: true, agreements: [] })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      leadId,
      agreementNumber,
      title,
      content,
      agencySignatory = 'SynchAD Tech (Authorized Representative)',
      clientSignatory,
      effectiveDate,
      dealValue = 0,
      status = 'draft'
    } = body

    if (!title || !content || !clientSignatory) {
      return NextResponse.json({ error: 'Title, content, and client signatory are required' }, { status: 400 })
    }

    const agrCode = agreementNumber || `SYNCH-AGR-${Math.floor(1000 + Math.random() * 9000)}`
    const today = effectiveDate || new Date().toISOString().split('T')[0]

    const agreementPayload = {
      agreement_number: agrCode,
      lead_id: leadId || null,
      title,
      content,
      agency_signatory: agencySignatory,
      client_signatory: clientSignatory,
      effective_date: today,
      deal_value: Number(dealValue) || 0,
      status,
      updated_at: new Date().toISOString()
    }

    const supabase = createAdminClient()
    let saved = null

    try {
      const { data, error } = await supabase
        .from('client_agreements')
        .insert([agreementPayload])
        .select()
        .single()

      if (!error && data) {
        saved = data
      }
    } catch {}

    return NextResponse.json({
      success: true,
      agreement: saved || agreementPayload
    })
  } catch (err: any) {
    console.error('[Agreements POST] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, agreement_number, status, content } = body

    if (!id && !agreement_number) {
      return NextResponse.json({ error: 'Agreement ID or number required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (content) updates.content = content

    let query = supabase.from('client_agreements').update(updates)
    if (id) query = query.eq('id', id)
    else query = query.eq('agreement_number', agreement_number)

    const { data, error } = await query.select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, agreement: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const agrNum = searchParams.get('agreement_number')

    if (!id && !agrNum) {
      return NextResponse.json({ error: 'Agreement ID or number required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    let query = supabase.from('client_agreements').delete()
    if (id) query = query.eq('id', id)
    else query = query.eq('agreement_number', agrNum)

    const { error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
