import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      leadId,
      clientName,
      businessName,
      phone,
      address,
      dealValue = 48000,
      advancePaid = 19200,
      balanceDue = 28800,
      currency = 'INR',
      serviceType = 'Website and local SEO set-up',
      projectScope = '5 pages responsive design, mobile optimization, WhatsApp booking flow, local SEO',
      targetDeadline = '4 weeks from start date',
      partner1Name = 'Aryan Gupta',
      partner1Role = 'Co-Founder & Technical Director',
      partner2Name = 'Dewansh Chatterjee',
      partner2Role = 'Co-Founder & Managing Partner',
      hasDualPartners = true,
      customInstruction = ''
    } = body

    const agrCode = `AGR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
    const symbol = currency === 'INR' ? '₹' : '$'

    const prompt = `You are a high-level corporate legal counsel specializing in B2B technology and digital agency contracts for SynchAD Tech.
Draft customized clauses, deliverables, and timeline for an official "Website and Digital Services Agreement".

Contract Parameters:
- Client Business: "${businessName || clientName || 'Client'}"
- Authorized Representative: "${clientName || businessName || 'Client Representative'}"
- Primary Service: "${serviceType}"
- Project Scope: "${projectScope}"
- Total Deal Value: ${symbol}${Number(dealValue).toLocaleString()} ${currency}
- Advance Payment: ${symbol}${Number(advancePaid).toLocaleString()} ${currency}
- Deadline: "${targetDeadline}"
- Provider Partners: "${partner1Name}" (${partner1Role})${hasDualPartners ? ` & "${partner2Name}" (${partner2Role})` : ''}
${customInstruction ? `- User Custom Instructions: "${customInstruction}"` : ''}

CRITICAL: Return ONLY valid JSON (no markdown backticks, no comments).
Format:
{
  "sections": [
    {
      "id": 1,
      "title": "What this agreement covers",
      "clauses": [
        { "no": "1.1", "text": "..." },
        { "no": "1.2", "text": "..." }
      ]
    },
    {
      "id": 2,
      "title": "Timeline and delivery",
      "clauses": [
        { "no": "2.1", "text": "..." },
        { "no": "2.2", "text": "..." },
        { "no": "2.3", "text": "..." }
      ]
    },
    {
      "id": 3,
      "title": "Fees, taxes and payment",
      "clauses": [
        { "no": "3.1", "text": "..." },
        { "no": "3.2", "text": "..." },
        { "no": "3.3", "text": "..." },
        { "no": "3.4", "text": "..." },
        { "no": "3.5", "text": "..." }
      ]
    },
    {
      "id": 4,
      "title": "Provider responsibilities",
      "clauses": [
        { "no": "4.1", "text": "..." },
        { "no": "4.2", "text": "..." },
        { "no": "4.3", "text": "..." }
      ]
    },
    {
      "id": 5,
      "title": "Client responsibilities",
      "clauses": [
        { "no": "5.1", "text": "..." },
        { "no": "5.2", "text": "..." },
        { "no": "5.3", "text": "..." },
        { "no": "5.4", "text": "..." }
      ]
    },
    {
      "id": 6,
      "title": "Revisions and change requests",
      "clauses": [
        { "no": "6.1", "text": "..." },
        { "no": "6.2", "text": "..." }
      ]
    },
    {
      "id": 7,
      "title": "Ownership and use of the Work",
      "clauses": [
        { "no": "7.1", "text": "..." },
        { "no": "7.2", "text": "..." },
        { "no": "7.3", "text": "..." },
        { "no": "7.4", "text": "..." }
      ]
    },
    {
      "id": 8,
      "title": "Confidentiality",
      "clauses": [
        { "no": "8.1", "text": "..." },
        { "no": "8.2", "text": "..." }
      ]
    },
    {
      "id": 9,
      "title": "Hosting, domain and third-party services",
      "clauses": [
        { "no": "9.1", "text": "..." },
        { "no": "9.2", "text": "..." }
      ]
    },
    {
      "id": 10,
      "title": "Support and warranty",
      "clauses": [
        { "no": "10.1", "text": "..." },
        { "no": "10.2", "text": "..." },
        { "no": "10.3", "text": "..." }
      ]
    },
    {
      "id": 11,
      "title": "Limit of liability",
      "clauses": [
        { "no": "11.1", "text": "..." },
        { "no": "11.2", "text": "..." },
        { "no": "11.3", "text": "..." }
      ]
    },
    {
      "id": 12,
      "title": "Term and ending the agreement",
      "clauses": [
        { "no": "12.1", "text": "..." },
        { "no": "12.2", "text": "..." },
        { "no": "12.3", "text": "..." },
        { "no": "12.4", "text": "..." }
      ]
    },
    {
      "id": 13,
      "title": "Events beyond control",
      "clauses": [
        { "no": "13.1", "text": "..." }
      ]
    },
    {
      "id": 14,
      "title": "Disputes and governing law",
      "clauses": [
        { "no": "14.1", "text": "..." },
        { "no": "14.2", "text": "..." },
        { "no": "14.3", "text": "..." }
      ]
    },
    {
      "id": 15,
      "title": "Notices",
      "clauses": [
        { "no": "15.1", "text": "..." }
      ]
    },
    {
      "id": 16,
      "title": "General",
      "clauses": [
        { "no": "16.1", "text": "..." },
        { "no": "16.2", "text": "..." },
        { "no": "16.3", "text": "..." },
        { "no": "16.4", "text": "..." },
        { "no": "16.5", "text": "..." }
      ]
    }
  ],
  "deliverables": [
    { "id": "d-1", "title": "Website design", "description": "Custom design for 5 pages: Home, About, Services, Gallery, Contact. Desktop, tablet and mobile.", "included": true },
    { "id": "d-2", "title": "Website development", "description": "Fast, mobile friendly build. SSL set-up. Basic speed optimisation. Cross-browser testing.", "included": true },
    { "id": "d-3", "title": "Contact and booking form", "description": "Appointment request form with email and WhatsApp alerts. Click-to-call and WhatsApp buttons.", "included": true },
    { "id": "d-4", "title": "Google Business Profile", "description": "Create or fix the profile, add services, hours, photos and categories.", "included": true },
    { "id": "d-5", "title": "Basic on-page SEO", "description": "Page titles, descriptions, headings, sitemap, Google Search Console and Analytics set-up. 10 target keywords.", "included": true },
    { "id": "d-6", "title": "Training and handover", "description": "One 30 minute video call on how to update the site. Admin access after final payment.", "included": true },
    { "id": "d-7", "title": "Revisions", "description": "2 rounds on design, 1 round on the finished website.", "included": true },
    { "id": "d-8", "title": "Free bug-fix support", "description": "30 days after go-live.", "included": true }
  ],
  "timeline": [
    { "week": "1", "dates": "Week 1", "description": "Kick-off call. Client sends content and brand files. Provider plans pages.", "paymentLink": "Instalment 1 received" },
    { "week": "2", "dates": "Week 2", "description": "Design draft shared. Client reviews and approves.", "paymentLink": "Instalment 2 on design approval" },
    { "week": "3", "dates": "Week 3", "description": "Development, forms and Google Business Profile setup.", "paymentLink": "None" },
    { "week": "4", "dates": "Week 4", "description": "Testing, fixes, final review, go-live and training.", "paymentLink": "Instalment 3 before go-live" }
  ]
}`

    let structuredData: any = null

    if (GEMINI_API_KEY) {
      const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash']
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
                  temperature: 0.1,
                  maxOutputTokens: 3500,
                  responseMimeType: 'application/json'
                }
              }),
              signal: AbortSignal.timeout(24000)
            }
          )

          if (geminiRes.ok) {
            const data = await geminiRes.json()
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) {
              const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
              const parsed = JSON.parse(cleaned)
              if (parsed.sections && Array.isArray(parsed.sections)) {
                structuredData = parsed
                break
              }
            }
          }
        } catch {
          // Try next model
        }
      }
    }

    // High quality standard fallback if Gemini API is unreachable or returned invalid JSON
    if (!structuredData || !structuredData.sections) {
      structuredData = {
        sections: [
          {
            id: 1,
            title: 'What this agreement covers',
            clauses: [
              { no: '1.1', text: 'The Provider will design, build and launch the website and related services described in Annexure A (the "Work") for the Client.' },
              { no: '1.2', text: 'Annexure A (scope) and Annexure B (timeline) are part of this agreement. If they conflict with the clauses, the clauses apply.' }
            ]
          },
          {
            id: 2,
            title: 'Timeline and delivery',
            clauses: [
              { no: '2.1', text: 'The Provider will follow the timeline in Annexure B. The dates assume the Client gives content, approvals and access on time (see clause 5).' },
              { no: '2.2', text: 'If the Client is late, the dates move by the same number of days. The Provider is not in breach for delay caused by the Client.' },
              { no: '2.3', text: 'The Work is delivered when the website is live on the Client’s domain, or when the Provider hands over the final files, whichever is agreed in Annexure A.' }
            ]
          },
          {
            id: 3,
            title: 'Fees, taxes and payment',
            clauses: [
              { no: '3.1', text: 'The Client will pay the total price and instalments shown in the Price and payment box on page 1.' },
              { no: '3.2', text: 'Work on each stage starts when the matching instalment is received in full. The Provider may pause the Work if an instalment is more than 7 days late.' },
              { no: '3.3', text: 'GST at the rate in force is added to the fee. If the rate changes, the new rate applies from the date of change. Taxes withheld by the Client (TDS) must be deposited and a certificate shared.' },
              { no: '3.4', text: 'Late payment attracts a charge of 1.5% per month on the overdue amount, counted per day.' },
              { no: '3.5', text: 'Final handover, admin access and source files are released only after the last instalment is received.' }
            ]
          },
          {
            id: 4,
            title: 'Provider responsibilities',
            clauses: [
              { no: '4.1', text: 'The Provider will carry out the Work with reasonable skill and care, using suitably skilled people.' },
              { no: '4.2', text: 'The Provider will keep the Client informed on progress and share drafts for approval at the stages in Annexure B.' },
              { no: '4.3', text: 'The Provider may use freelancers or subcontractors and remains responsible for their work.' }
            ]
          },
          {
            id: 5,
            title: 'Client responsibilities',
            clauses: [
              { no: '5.1', text: 'The Client will give text, logos, photos, service details and other material in a usable form within 5 working days of the start date.' },
              { no: '5.2', text: 'The Client will review drafts and reply within 3 working days. Silence for 7 days after a draft is shared counts as approval of that stage.' },
              { no: '5.3', text: 'The Client confirms that it owns, or has the right to use, all material it supplies, and that the material does not break any law or third-party right.' },
              { no: '5.4', text: 'The Client will arrange its own accounts for the domain, hosting and third-party tools, and give the Provider the access it needs.' }
            ]
          },
          {
            id: 6,
            title: 'Revisions and change requests',
            clauses: [
              { no: '6.1', text: 'The price includes 2 rounds of revisions on the design and 1 round on the finished website. A round means one consolidated list of changes.' },
              { no: '6.2', text: `Anything beyond the scope or the included rounds is a change request. The Provider will quote its cost and time in writing. Work starts only after the Client agrees. Rate for extra work: ${symbol}1,000 per hour.` }
            ]
          },
          {
            id: 7,
            title: 'Ownership and use of the Work',
            clauses: [
              { no: '7.1', text: 'After the Client pays all amounts due, the Client owns the final website design, text and images made specifically for it.' },
              { no: '7.2', text: 'The Provider keeps ownership of its pre-existing tools, code libraries, templates and know-how. The Client gets a non-exclusive licence to use them as part of the website.' },
              { no: '7.3', text: 'Third-party items (fonts, plugins, themes, stock images) stay under their own licences. Their licence fees are the Client’s cost.' },
              { no: '7.4', text: 'The Provider may show the finished website in its portfolio and case studies, unless the Client objects in writing.' }
            ]
          },
          {
            id: 8,
            title: 'Confidentiality',
            clauses: [
              { no: '8.1', text: 'Each party will keep the other’s non-public business, pricing, customer and technical information confidential. It will use it only for this project.' },
              { no: '8.2', text: 'This does not apply to information that is public, already known, or must be disclosed by law. This clause continues for 2 years after the agreement ends.' }
            ]
          },
          {
            id: 9,
            title: 'Hosting, domain and third-party services',
            clauses: [
              { no: '9.1', text: 'Hosting, domain, email, SMS, payment gateway, WhatsApp and similar services are provided by third parties. Their fees and terms are separate from this agreement.' },
              { no: '9.2', text: 'The Provider is not responsible for outages, price changes or policy changes of third-party services.' }
            ]
          },
          {
            id: 10,
            title: 'Support and warranty',
            clauses: [
              { no: '10.1', text: 'For 30 days after go-live, the Provider will fix bugs in the delivered Work free of charge. This does not cover new features, content changes or problems caused by the Client or third parties.' },
              { no: '10.2', text: 'Support after 30 days is available under a separate written plan or at the rate in clause 6.2.' },
              { no: '10.3', text: 'The Provider does not promise search rankings, traffic, leads or sales. These depend on many things outside its control.' }
            ]
          },
          {
            id: 11,
            title: 'Limit of liability',
            clauses: [
              { no: '11.1', text: 'Neither party is liable for indirect or consequential loss, including lost profit or lost business.' },
              { no: '11.2', text: 'The total liability of the Provider under this agreement is limited to the fees the Client has actually paid for the Work.' },
              { no: '11.3', text: 'Nothing here limits liability that cannot be limited by law, such as fraud.' }
            ]
          },
          {
            id: 12,
            title: 'Term and ending the agreement',
            clauses: [
              { no: '12.1', text: 'This agreement starts on the date above and runs until the Work is delivered and all payments are made.' },
              { no: '12.2', text: 'Either party may end it with 7 days’ written notice. Either party may end it at once if the other breaks a material term and does not fix it within 7 days of written notice.' },
              { no: '12.3', text: 'On ending, the Client pays for all Work done up to the end date. Any advance paid is first set against this amount. The Provider refunds the unused balance within 15 days. Completed work and files are handed over once all dues are paid.' },
              { no: '12.4', text: 'Clauses on payment, ownership, confidentiality, liability and disputes continue after the agreement ends.' }
            ]
          },
          {
            id: 13,
            title: 'Events beyond control',
            clauses: [
              { no: '13.1', text: 'Neither party is liable for delay caused by events beyond its reasonable control, such as natural disasters, power or internet failure, government orders, strikes or war. The affected party will tell the other promptly and resume as soon as it can.' }
            ]
          },
          {
            id: 14,
            title: 'Disputes and governing law',
            clauses: [
              { no: '14.1', text: 'The parties will first try to settle any dispute by talking, within 15 days of written notice of the dispute.' },
              { no: '14.2', text: 'If it is not settled, the dispute goes to arbitration by a sole arbitrator under the Arbitration and Conciliation Act, 1996. The seat and venue is the Provider\'s registered location. The language is English.' },
              { no: '14.3', text: 'This agreement is governed by the laws of India. Subject to clause 14.2, the courts at the Provider\'s registered location have exclusive jurisdiction.' }
            ]
          },
          {
            id: 15,
            title: 'Notices',
            clauses: [
              { no: '15.1', text: 'Notices must be in writing and sent to the email or address on page 1. An email is treated as received on the next working day. A letter by courier is treated as received after 3 working days.' }
            ]
          },
          {
            id: 16,
            title: 'General',
            clauses: [
              { no: '16.1', text: 'This agreement is the full agreement between the parties on this project. It replaces earlier talks and messages.' },
              { no: '16.2', text: 'Changes must be in writing and signed (or accepted by email) by both parties.' },
              { no: '16.3', text: 'If a clause is found invalid, the rest of the agreement still applies.' },
              { no: '16.4', text: 'Neither party may transfer its rights or duties without the other’s written consent.' },
              { no: '16.5', text: 'The parties may sign in counterparts and by electronic signature. Each is valid as an original.' }
            ]
          }
        ],
        deliverables: [
          { id: 'd-1', title: 'Website design', description: 'Custom design for 5 pages: Home, About, Services, Gallery, Contact. Desktop, tablet and mobile.', included: true },
          { id: 'd-2', title: 'Website development', description: 'Fast, mobile friendly build. SSL set-up. Basic speed optimisation. Cross-browser testing.', included: true },
          { id: 'd-3', title: 'Contact and booking form', description: 'Appointment request form with email and WhatsApp alerts. Click-to-call and WhatsApp buttons.', included: true },
          { id: 'd-4', title: 'Google Business Profile', description: 'Create or fix the profile, add services, hours, photos and categories.', included: true },
          { id: 'd-5', title: 'Basic on-page SEO', description: 'Page titles, descriptions, headings, sitemap, Google Search Console and Analytics set-up. 10 target keywords.', included: true },
          { id: 'd-6', title: 'Training and handover', description: 'One 30 minute video call on how to update the site. Admin access after final payment.', included: true },
          { id: 'd-7', title: 'Revisions', description: '2 rounds on design, 1 round on the finished website.', included: true },
          { id: 'd-8', title: 'Free bug-fix support', description: '30 days after go-live.', included: true }
        ],
        timeline: [
          { week: '1', dates: 'Week 1', description: 'Kick-off call. Client sends content and brand files. Provider plans pages.', paymentLink: 'Instalment 1 received' },
          { week: '2', dates: 'Week 2', description: 'Design draft shared. Client reviews and approves.', paymentLink: 'Instalment 2 on design approval' },
          { week: '3', dates: 'Week 3', description: 'Development, forms and Google Business Profile setup.', paymentLink: 'None' },
          { week: '4', dates: 'Week 4', description: 'Testing, fixes, final review, go-live and training.', paymentLink: 'Instalment 3 before go-live' }
        ]
      }
    }

    // Try saving agreement to client_agreements in Supabase
    if (leadId) {
      try {
        const supabase = createAdminClient()
        await supabase.from('client_agreements').upsert({
          lead_id: leadId,
          agreement_number: agrCode,
          title: `${serviceType} Agreement — ${businessName || clientName}`,
          content: JSON.stringify(structuredData),
          client_signatory: clientName || businessName,
          deal_value: Number(dealValue) || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'agreement_number' })
      } catch {
        // Table might not exist yet
      }
    }

    return NextResponse.json({
      success: true,
      agreementNumber: agrCode,
      data: structuredData
    })
  } catch (err: any) {
    console.error('[Agreement Generator] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
