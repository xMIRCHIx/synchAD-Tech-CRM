import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = createAdminClient();

    const sampleLeads: Record<string, any>[] = [
      {
        business_name: "Metro Smile Orthodontics",
        phone: "+919811223344",
        email: "contact@metrosmile.com",
        website_url: "https://metrosmile.com",
        address: "Connaught Place, New Delhi",
        google_rating: 4.8,
        site_state: "exists",
        status: "review",
        score: 78,
        owner_name: "Dr. Rahul Sharma",
        notes: "Top rated clinic in CP. Slow mobile site.",
      },
      {
        business_name: "Dr. Mehta Spine & Ortho Clinic",
        phone: "+919933445566",
        email: "dr.mehta@gmail.com",
        website_url: null,
        address: "Andheri West, Mumbai",
        google_rating: 4.5,
        site_state: "none",
        status: "queued",
        score: 89,
        notes: "No website registered on Google Maps. High inquiry volume.",
      },
      {
        business_name: "Kavita Skin & Laser Studio",
        phone: "+919877889900",
        email: "kavita.skin@outlook.com",
        website_url: "http://kavitaskinstudio.in",
        address: "Indiranagar, Bengaluru",
        google_rating: 4.2,
        site_state: "broken",
        status: "replied",
        score: 96,
        owner_name: "Kavita Reddy",
        notes: "WordPress site hacked, redirects to spam.",
      },
      {
        business_name: "Titan Fitness & Crossfit Hub",
        phone: "+919822334455",
        email: "info@titanfitness.co",
        website_url: "https://titanfitness.co",
        address: "Banjara Hills, Hyderabad",
        google_rating: 4.9,
        site_state: "exists",
        status: "won",
        score: 65,
        notes: "Converted to monthly SEO + Landing page plan.",
      },
      {
        business_name: "Apex Dental Care",
        phone: "+919820011223",
        email: "info@apexdentalcare.in",
        website_url: "http://apexdentalcare.in",
        address: "Bandra West, Mumbai",
        google_rating: 4.6,
        site_state: "broken",
        status: "review",
        score: 94,
        owner_name: "Dr. Aryan Desai",
        notes: "Website returning 502 Bad Gateway.",
      },
    ];

    for (const l of sampleLeads) {
      const { data: inserted, error: insertErr } = await supabase
        .from("leads")
        .upsert(l, { onConflict: "phone" })
        .select()
        .single();

      if (inserted) {
        const audits: Record<string, any> = {
          "Metro Smile Orthodontics": {
            http_status: 200,
            scraped_text:
              "WordPress theme with 18 unoptimized plugins. Mobile speed score: 28/100.",
            findings: {
              flaws: [
                "Mobile PageSpeed score is 28/100 (takes 6.4s to load)",
                "No direct WhatsApp click-to-book CTA on mobile",
                "Missing schema markup for LocalBusiness",
              ],
              strengths: [
                "Clean clinic photos and doctor credentials",
                "Over 140 genuine 5-star Google reviews",
              ],
            },
            ai_pitch:
              "Hi Dr. Rahul, noticed Metro Smile has a stellar 4.8 rating on Google in CP! However, your mobile website takes 6+ seconds to load, causing patients to drop off before booking. We built an instant 1-click booking widget for dental clinics. Can I send a 30-sec demo video?",
          },
          "Dr. Mehta Spine & Ortho Clinic": {
            http_status: null,
            scraped_text:
              "No domain or website associated with Google business profile.",
            findings: {
              flaws: [
                "Completely missing dedicated website or landing page",
                "Relying 100% on Justdial/Practo commissions",
                "No automated appointment booking pipeline",
              ],
              strengths: [
                "Prime clinic location in Andheri West",
                "Strong patient word-of-mouth with 4.5 rating",
              ],
            },
            ai_pitch:
              "Namaste Dr. Mehta, your clinic in Andheri gets great patient reviews, but without a dedicated clinic website or WhatsApp appointment booking system, patients get diverted to competitor clinics on Practo. We help top ortho doctors setup their own direct patient booking portal in 48 hours. Can I share details?",
          },
          "Kavita Skin & Laser Studio": {
            http_status: 500,
            scraped_text:
              "PHP Fatal error: Allowed memory size exhausted in wp-includes/functions.php. Malicious redirect detected.",
            findings: {
              flaws: [
                "WordPress PHP fatal error causing HTTP 500 on consultation form",
                "Mobile users get redirected to suspicious ad domain",
                "SSL security warning displayed by Chrome",
              ],
              strengths: [
                "Established presence in Indiranagar since 2019",
                "Premium aesthetic treatment catalog",
              ],
            },
            ai_pitch:
              "Hi Kavita, we were researching top aesthetic clinics in Indiranagar and saw your Google profile, but your website currently displays a critical PHP error and security warning to patients. We specialize in fixing medical clinic websites and securing high-ticket patient leads. Would love to send a quick fix audit.",
          },
          "Titan Fitness & Crossfit Hub": {
            http_status: 200,
            scraped_text:
              "Custom React website, responsive, integrated with payment gateway.",
            findings: {
              flaws: ["Minor: Missing exit-intent membership offer popup"],
              strengths: [
                "High converting mobile design",
                "WhatsApp widget prominently displayed",
              ],
            },
            ai_pitch:
              "Hey Titan Fitness team, loving the brand in Banjara Hills! Your setup is awesome.",
          },
          "Apex Dental Care": {
            http_status: 502,
            scraped_text:
              "Bad Gateway - nginx/1.18.0. SSL certificate expired 14 days ago. Site unreachable on mobile.",
            findings: {
              flaws: [
                "Domain SSL certificate expired 14 days ago",
                "Server returning HTTP 502 Bad Gateway",
                "No mobile responsive viewport detected",
                "Missing WhatsApp click-to-chat CTA",
              ],
              strengths: [
                "Domain registered since 2018",
                "High Google business profile search volume",
              ],
            },
            ai_pitch:
              "Hey Dr. Aryan, noticed Apex Dental Care is ranking well on Google Maps in Bandra, but your website http://apexdentalcare.in is throwing a 502 error and losing patient bookings every day. We built a fast 1-click booking page template that fixes this immediately. Can I send a 30-sec preview?",
          },
        };

        if (audits[l.business_name]) {
          await supabase
            .from("website_audits")
            .upsert(
              { lead_id: inserted.id, ...audits[l.business_name] },
              { onConflict: "lead_id" },
            );
        }
      }
    }

    return NextResponse.json({ success: true, count: sampleLeads.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
