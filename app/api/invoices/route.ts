import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const leadId = searchParams.get('leadId')

    const supabase = createAdminClient()
    let query = supabase.from('client_invoices').select('*').order('created_at', { ascending: false })

    if (leadId) {
      query = query.eq('lead_id', leadId)
    }

    const { data: invoices, error } = await query

    if (error) {
      // Table might not exist yet
      return NextResponse.json({ success: true, invoices: [] })
    }

    return NextResponse.json({ success: true, invoices: invoices || [] })
  } catch (err: any) {
    console.error('[Invoices GET] Error:', err)
    return NextResponse.json({ success: true, invoices: [] })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      leadId,
      clientName,
      clientPhone,
      clientAddress,
      amount,
      installmentLabel = '50% Advance Booking',
      dueDate,
      items = [],
      notes = '',
      paymentMode = 'upi'
    } = body

    if (!clientName || !amount) {
      return NextResponse.json({ error: 'Client name and amount are required' }, { status: 400 })
    }

    const invNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const today = new Date().toISOString().split('T')[0]
    const due = dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

    const invoicePayload = {
      invoice_number: invNum,
      lead_id: leadId || null,
      client_name: clientName,
      client_phone: clientPhone || '',
      client_address: clientAddress || '',
      amount: Number(amount) || 0,
      status: 'unpaid',
      installment_label: installmentLabel,
      issue_date: today,
      due_date: due,
      items: items.length > 0 ? items : [
        {
          description: installmentLabel,
          quantity: 1,
          rate: Number(amount) || 0,
          amount: Number(amount) || 0
        }
      ],
      notes,
      payment_mode: paymentMode,
      updated_at: new Date().toISOString()
    }

    const supabase = createAdminClient()
    let savedInvoice = null

    try {
      const { data, error } = await supabase
        .from('client_invoices')
        .insert([invoicePayload])
        .select()
        .single()

      if (!error && data) {
        savedInvoice = data
      }
    } catch {
      // Table might not exist yet
    }

    return NextResponse.json({
      success: true,
      invoice: savedInvoice || invoicePayload
    })
  } catch (err: any) {
    console.error('[Invoices POST] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
