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
      dealValue = 35000,
      advancePaid = 17500,
      balanceDue = 17500,
      currency = 'INR',
      serviceType = 'Custom Website + WhatsApp Booking Funnel',
      projectScope = 'Design, build, mobile optimization, and WhatsApp instant booking engine.',
      targetDeadline,
      partner1Name = 'Aryan Gupta',
      partner1Role = 'Co-Founder & Technical Lead',
      partner2Name = 'Harsh Vardhan',
      partner2Role = 'Co-Founder & Operations Lead',
      hasDualPartners = true
    } = body

    const todayStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    const agrCode = `SYNCH-AGR-${Math.floor(1000 + Math.random() * 9000)}`
    const symbol = currency === 'INR' ? '₹' : '$'

    const partnerSectionPrompt = hasDualPartners
      ? `- Authorized Signatories (Agency): 
          1. Partner 1: "${partner1Name}" (${partner1Role})
          2. Partner 2: "${partner2Name}" (${partner2Role})`
      : `- Authorized Signatory (Agency): "${partner1Name}" (${partner1Role})`

    const prompt = `You are a high-level corporate legal counsel specializing in B2B technology agreements.
Draft a professional, ironclad, and balanced "Software & Web Development Service Agreement" for SynchAD Tech.

Contract Specifics:
- Agreement Number: ${agrCode}
- Effective Date: ${todayStr}
- Service Provider: SynchAD Tech ("Developer / Agency")
${partnerSectionPrompt}
- Client Business: "${businessName || 'Client'}"
- Authorized Representative / Client Name: "${clientName || businessName || 'Client Representative'}"
- Client Phone: "${phone || 'Listed on file'}"
- Client Address: "${address || 'Registered Business Address'}"
- Primary Service Type: "${serviceType}"
- Scope of Work & Deliverables: "${projectScope}"
- Total Deal Value: ${symbol}${Number(dealValue).toLocaleString()} ${currency}
- Advance Payment (Milestone 1): ${symbol}${Number(advancePaid).toLocaleString()} ${currency}
- Balance Outstanding (Milestone 2/3): ${symbol}${Number(balanceDue).toLocaleString()} ${currency}
- Estimated Completion Deadline: "${targetDeadline || '14 Business Days from advance payment'}"

Structure of the Agreement:
1. TITLE & PREAMBLE: Service Agreement between SynchAD Tech and Client.
2. SCOPE OF SERVICES & DELIVERABLES: Detail the custom website architecture, responsive design, and WhatsApp direct conversion integration.
3. PROJECT TIMELINE & MILESTONES: Sprint schedule, preview demonstrations, and launch timeline.
4. PAYMENT SCHEDULE & INVOICING TERMS: Clear stipulation of the advance deposit and final balance due upon deployment.
5. CLIENT COOPERATION: Delivery of brand assets (logos, content, credentials) and 48-hour feedback windows.
6. INTELLECTUAL PROPERTY & OWNERSHIP: Client receives full, unencumbered ownership of all custom code, assets, and website upon final settlement of the balance due.
7. WARRANTY, POST-LAUNCH SUPPORT & BUG FIXES: 30 days of complimentary technical warranty support post-deployment.
8. CONFIDENTIALITY & NON-DISCLOSURE: Strict mutual confidentiality.
9. GOVERNING LAW & DISPUTE RESOLUTION: Standard commercial arbitration.
10. EXECUTION & SIGNATURES: Clear dual-signature block for SynchAD Tech (Partners) and Client.

Format your output in clean, elegant Markdown. Use bold headings, bullet points, and clean typography suitable for official document printing. Do not include markdown code block backticks (like \`\`\`markdown). Output the raw formatted text directly.`

    let agreementContent = ''

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
                  temperature: 0.2,
                  maxOutputTokens: 2500
                }
              }),
              signal: AbortSignal.timeout(22000)
            }
          )

          if (geminiRes.ok) {
            const data = await geminiRes.json()
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) {
              agreementContent = text.replace(/^```markdown\s*/i, '').replace(/```\s*$/i, '').trim()
              break
            }
          }
        } catch {
          // Try next model
        }
      }
    }

    // High quality standard legal template fallback if Gemini API is unreachable
    if (!agreementContent) {
      agreementContent = `# SOFTWARE & WEB DEVELOPMENT SERVICE AGREEMENT
**Agreement Reference:** ${agrCode}  
**Effective Date:** ${todayStr}

---

### 1. PARTIES
This Service Agreement ("Agreement") is entered into by and between:
* **Service Provider:** **SynchAD Tech**, having its primary digital operations in India ("Developer" or "Agency").
* **Client:** **${businessName || 'Client'}**, represented by **${clientName || 'Authorized Signatory'}** ("Client"), Phone: ${phone || 'N/A'}.

---

### 2. SCOPE OF SERVICES & DELIVERABLES
SynchAD Tech agrees to design, develop, test, and deploy the following project deliverables:
* **Service Package:** ${serviceType}
* **Deliverable Specifications:** ${projectScope}
* **Mobile & Conversion Funnel:** 1-Tap WhatsApp chat/booking integration, mobile responsive interface, and Google search readiness.

---

### 3. FINANCIAL TERMS & PAYMENT MILESTONES
The agreed total compensation for the project is **${symbol}${Number(dealValue).toLocaleString()} ${currency}**:
1. **Milestone 1 (Initial Deposit / Mobilization):** **${symbol}${Number(advancePaid).toLocaleString()}** (Paid upon execution of this Agreement).
2. **Milestone 2 (Final Delivery & Launch):** **${symbol}${Number(balanceDue).toLocaleString()}** (Due upon deployment and handover of credentials).

---

### 4. INTELLECTUAL PROPERTY & OWNERSHIP
Upon full and final settlement of all payments due, all custom designs, front-end code, and project assets developed specifically for the Client shall become the exclusive intellectual property of the Client.

---

### 5. POST-LAUNCH WARRANTY & REVISIONS
SynchAD Tech provides a **30-day technical bug-fix warranty** post-deployment at no additional fee.

---

### 6. SIGNATURES & ACCEPTANCE

**For SynchAD Tech (Partner 1):**  
Name: ${partner1Name} (${partner1Role})  
Signature: _________________________  
Date: ${todayStr}  

${hasDualPartners ? `**For SynchAD Tech (Partner 2):**  
Name: ${partner2Name} (${partner2Role})  
Signature: _________________________  
Date: ${todayStr}  
` : ''}
**For ${businessName || 'Client'} (Client):**  
Name: ${clientName || 'Authorized Signatory'}  
Signature: _________________________  
Date: ${todayStr}
`
    }

    // Try saving agreement to client_agreements in Supabase
    if (leadId) {
      try {
        const supabase = createAdminClient()
        await supabase.from('client_agreements').upsert({
          lead_id: leadId,
          agreement_number: agrCode,
          title: `${serviceType} Agreement — ${businessName}`,
          content: agreementContent,
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
      agreementContent
    })
  } catch (err: any) {
    console.error('[Agreement Generator] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
