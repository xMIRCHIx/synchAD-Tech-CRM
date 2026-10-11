import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function calculateLeadScore(lead: any, audit?: any): number {
  if (lead.score != null) return lead.score;
  let score = 50;

  // Website status is prime angle
  if (lead.site_state === "broken") score += 40;
  else if (lead.site_state === "none") score += 35;
  else if (lead.site_state === "exists") score += 15;

  // High Google rating = reputable business that cares about customer flow
  if (lead.google_rating) {
    if (lead.google_rating >= 4.5) score += 8;
    else if (lead.google_rating >= 4.0) score += 5;
  }

  // Audit findings (if flaws exist, high pitch potential)
  if (audit?.findings?.flaws?.length) {
    score += Math.min(10, audit.findings.flaws.length * 3);
  }

  return Math.min(99, Math.max(25, score));
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: leads, error } = await supabase
      .from("leads")
      .select("*, website_audits(*), campaigns(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching leads:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Attach computed score if missing
    const enrichedLeads = (leads || []).map((lead) => {
      const audit = Array.isArray(lead.website_audits)
        ? lead.website_audits[0]
        : lead.website_audits;
      return {
        ...lead,
        website_audits: audit || null,
        score: lead.score ?? calculateLeadScore(lead, audit),
      };
    });

    return NextResponse.json({ leads: enrichedLeads });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawItems = Array.isArray(body.leads) ? body.leads : [body];

    if (!rawItems.length || !rawItems[0]) {
      return NextResponse.json({ error: "No lead data provided" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const validStatuses = [
      'new', 'enriched', 'review', 'queued',
      'sent', 'delivered', 'read',
      'replied', 'won', 'lost', 'skipped'
    ];

    const leadsToInsert = rawItems.map((item: any) => {
      const name = (item.business_name || item.name || item.title || '').trim();
      let rawPhone = String(item.phone || item.mobile || item.contact || '').trim();
      let cleanPhone = rawPhone.replace(/[^\d+]/g, '');
      if (!cleanPhone || cleanPhone.length < 7) {
        cleanPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
      }

      let website = (item.website_url || item.website || item.url || '').trim();
      if (website && !website.startsWith('http')) {
        website = `https://${website}`;
      }
      if (!website) website = null;

      let siteState = item.site_state;
      if (!siteState || !['exists', 'none', 'broken', 'unknown'].includes(siteState)) {
        siteState = website ? 'exists' : 'none';
      }

      const status = validStatuses.includes(item.status) ? item.status : 'review';

      const leadRecord: any = {
        business_name: name || 'Custom Lead',
        phone: cleanPhone,
        email: item.email || null,
        website_url: website,
        address: item.address || item.location || 'Address not listed',
        google_rating: item.google_rating != null && !isNaN(Number(item.google_rating)) ? Number(item.google_rating) : null,
        google_maps_url: item.google_maps_url || null,
        site_state: siteState,
        status,
        owner_name: item.owner_name || null,
        notes: item.notes || (item.is_custom ? 'Custom Lead added via CRM' : 'Imported via CSV/Excel'),
        campaign_id: item.campaign_id || null,
        updated_at: new Date().toISOString()
      };

      return leadRecord;
    });

    const { data: savedData, error } = await supabase
      .from('leads')
      .upsert(leadsToInsert, { onConflict: 'phone' })
      .select('*, campaigns(*)');

    if (error) {
      console.error('Error creating leads:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: savedData?.length || leadsToInsert.length,
      leads: savedData
    });
  } catch (err: any) {
    console.error('Error in leads POST:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, notes } = await request.json();
    if (!id)
      return NextResponse.json({ error: "Missing lead id" }, { status: 400 });

    const supabase = createAdminClient();
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ lead: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("leads").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
