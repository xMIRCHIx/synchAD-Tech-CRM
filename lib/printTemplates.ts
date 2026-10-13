/**
 * Standalone High-Fidelity HTML Generators & Invisible Iframe Print Engine.
 * Generates exact pixel-perfect A4 documents with zero CSS interference.
 */

export interface InvoicePrintData {
  agency: {
    name: string
    tagline?: string
    address: string
    gstin?: string
    pan?: string
    email: string
    phone: string
    logo_url?: string
    bank_name?: string
    account_number?: string
    ifsc_code?: string
    upi_id?: string
    representative?: string
    partner1_role?: string
    partner2_name?: string
    partner2_role?: string
    has_dual_signatories?: boolean
    city?: string
  }
  client: {
    name: string
    signatory?: string
    address?: string
    gstin?: string
    email?: string
    phone?: string
  }
  invoiceNumber: string
  issueDate: string
  dueDate: string
  placeOfSupply: string
  agreementRef: string
  projectName: string
  installmentLabel: string
  items: Array<{
    description: string
    details?: string
    sac?: string
    quantity: number
    rate: number
    amount: number
  }>
  milestones: Array<{
    milestone: string
    share: number
    amount: number
    status: 'due' | 'upcoming' | 'paid'
  }>
  subtotal: number
  discount: number
  taxableValue: number
  taxPercent: number
  cgstAmount: number
  sgstAmount: number
  roundOff: number
  invoiceTotal: number
  amountReceived: number
  balanceDue: number
  amountInWords: string
}

export interface AgreementPrintData {
  agency: {
    name: string
    address: string
    gstin?: string
    pan?: string
    email: string
    phone: string
    logo_url?: string
    representative?: string
    partner1_role?: string
    partner2_name?: string
    partner2_role?: string
    has_dual_signatories?: boolean
  }
  client: {
    name: string
    signatory?: string
    address?: string
    gstin?: string
    pan?: string
    email?: string
    phone?: string
  }
  agreementNumber: string
  effectiveDate: string
  agreementPlace: string
  agreementVersion: string
  projectName: string
  startDateStr: string
  estimatedCompletion: string
  dealVal: number
  gstPercent: number
  gstAmount: number
  totalPayable: number
  amountInWords: string
  inst1Share: number
  inst1Fee: number
  inst1Gst: number
  inst1Tot: number
  inst2Share: number
  inst2Fee: number
  inst2Gst: number
  inst2Tot: number
  inst3Share: number
  inst3Fee: number
  inst3Gst: number
  inst3Tot: number
  sections: Array<{
    id: number
    title: string
    clauses: Array<{ no: string; text: string }>
  }>
  deliverables: Array<{
    id: string
    title: string
    description: string
    included: boolean
  }>
  timeline: Array<{
    week: string
    dates: string
    description: string
    paymentLink: string
  }>
}

/**
 * Generates the 100% pure standalone HTML for Tax Invoice
 */
export function generateInvoiceHtml(data: InvoicePrintData): string {
  const { agency, client, items, milestones } = data
  const cgstRate = data.taxPercent > 0 ? (data.taxPercent / 2).toFixed(1).replace('.0', '') : '0'
  const sgstRate = data.taxPercent > 0 ? (data.taxPercent / 2).toFixed(1).replace('.0', '') : '0'

  const itemsHtml = items.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><b>${item.description}</b>${item.details ? `<small>${item.details}</small>` : ''}</td>
      <td>${item.sac || '998314'}</td>
      <td class="_18hRHG_num">${item.quantity}</td>
      <td class="_18hRHG_num">${Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      <td class="_18hRHG_num">${Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>
  `).join('')

  const milestonesHtml = milestones.map((m, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${m.milestone}</td>
      <td class="_18hRHG_num">${m.share}%</td>
      <td class="_18hRHG_num">${Number(m.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      <td>
        <span class="_18hRHG_status ${m.status === 'due' ? '_18hRHG_sDue' : m.status === 'paid' ? '_18hRHG_sPaid' : '_18hRHG_sUp'}">
          ${m.status === 'due' ? 'Due now' : m.status === 'paid' ? 'Paid' : 'Upcoming'}
        </span>
      </td>
    </tr>
  `).join('')

  const logoMarkup = agency.logo_url
    ? `<img src="${agency.logo_url}" alt="${agency.name}" class="BLzxva_logoImg" />`
    : `<div class="BLzxva_logo"><span>${agency.name}</span><small>Official Invoice</small></div>`

  const partner2Signature = (agency.has_dual_signatories ?? true) && agency.partner2_name
    ? `<div style="margin-top: 4px; padding-top: 3px; border-top: 1px dotted var(--line);">
        <b>${agency.partner2_name}</b><br/>
        <span class="BLzxva_muted">${agency.partner2_role || 'Managing Partner'}</span>
       </div>`
    : ''

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tax Invoice - ${data.invoiceNumber}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--font-inter:"Inter"}html,body{margin:0}
.BLzxva_doc{--ink:#1e1b3a;--brand:#6d5bd0;--tint:#f4f1f9;--line:#d9d4e8;--muted:#5b5778;--soft:#ede9f7;font-family:var(--font-inter,"Inter"),"Inter","Poppins","DejaVu Sans",system-ui,sans-serif;color:var(--ink);font-feature-settings:"tnum" 1,"cv11" 1;-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#fff}
.BLzxva_doc,.BLzxva_doc *{box-sizing:border-box}
.BLzxva_num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.BLzxva_muted{color:var(--muted)}
.BLzxva_label{color:var(--muted);letter-spacing:.02em;margin-bottom:3px;font-size:7pt;font-weight:600;text-transform:uppercase}
.BLzxva_logo{color:#8a82b5;background:#fbfafe;border:1.2px dashed #b7aedb;border-radius:6px;flex-direction:column;justify-content:center;align-items:center;width:60mm;height:20mm;font-size:9pt;font-weight:600;display:flex}
.BLzxva_logo small{color:#9c95c2;margin-top:2px;font-size:6.8pt;font-weight:400}
.BLzxva_logoImg{object-fit:contain;object-position:left center;max-width:60mm;height:20mm;display:block}
.BLzxva_rule{background:linear-gradient(90deg,var(--brand),#b9aef0);border-radius:2px;height:3px}
.BLzxva_stage{background:#e6e2ee;min-height:100vh;padding:24px 12px 48px}
.BLzxva_toolbar{max-width:210mm;font-family:var(--font-inter,"Inter"),"Inter",system-ui,sans-serif;color:#1e1b3a;justify-content:space-between;align-items:center;gap:12px;margin:0 auto 14px;font-size:14px;display:flex}
.BLzxva_toolbar b{font-weight:600}
.BLzxva_btn{cursor:pointer;height:36px;font:inherit;color:#fff;background:#6d5bd0;border:0;border-radius:12px;align-items:center;padding:0 16px;font-weight:600;text-decoration:none;display:inline-flex}
.BLzxva_btnGhost{color:#1e1b3a;background:#fff;box-shadow:inset 0 0 0 1px #d3cde3}
.BLzxva_btn:focus-visible{outline-offset:2px;outline:2px solid #6d5bd0}
.BLzxva_actions{gap:8px;display:flex}
@media print{
  .BLzxva_stage{background:0 0;min-height:0;padding:0}
  .BLzxva_noPrint{display:none!important}
  ._18hRHG_sheet{box-shadow:none!important;break-after:avoid!important;margin:0!important;padding:8mm 12mm!important;width:auto!important}
}
@page { size: A4; margin: 0; }
._18hRHG_sheet{width:210mm;height:297mm;margin:0 auto;padding:9mm 13mm 8mm;font-size:8.6pt;line-height:1.38;overflow:hidden;box-shadow:0 6px 30px #3c326e2e;background:#fff}
._18hRHG_num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
._18hRHG_top{grid-template-columns:1fr auto;align-items:start;gap:10mm;display:grid}
._18hRHG_co{color:var(--muted);margin-top:6px;font-size:8pt;line-height:1.45}
._18hRHG_co b{color:var(--ink);font-size:10.5pt}
._18hRHG_title{text-align:right}
._18hRHG_titleH{letter-spacing:-.02em;color:var(--ink);margin:0 0 6px;font-size:22pt;font-weight:800;line-height:1.2}
._18hRHG_meta{border-collapse:collapse;margin-left:auto;font-size:8.2pt}
._18hRHG_meta td{text-align:right;padding:2.2px 0 2.2px 14px}
._18hRHG_meta td:first-child{color:var(--muted)}
._18hRHG_meta td:last-child{font-weight:600}
._18hRHG_ruleGap{margin:9px 0 10px}
._18hRHG_parties{grid-template-columns:1fr 1fr;gap:8mm;display:grid}
._18hRHG_party{border:1px solid var(--line);background:#fff;border-radius:8px;padding:8px 10px}
._18hRHG_party b{font-size:9.6pt}
._18hRHG_party div{color:var(--muted);font-size:8pt;line-height:1.5}
._18hRHG_partyRow{gap:6px;display:flex}
._18hRHG_partyRow span:first-child{min-width:38px}
._18hRHG_project{background:var(--tint);border-radius:6px;margin:9px 0 8px;padding:6px 10px;font-size:8.4pt}
._18hRHG_project b{font-weight:600}
._18hRHG_gap{width:1.4em;display:inline-block}
._18hRHG_items{border-collapse:collapse;width:100%}
._18hRHG_items th{background:var(--ink);color:#fff;text-align:left;padding:6px 8px;font-size:7.6pt;font-weight:600}
._18hRHG_items th._18hRHG_num{text-align:right}
._18hRHG_items td{border-bottom:1px solid var(--line);vertical-align:top;padding:5px 8px}
._18hRHG_items td small{color:var(--muted);margin-top:1px;font-size:7.4pt;display:block}
._18hRHG_items tbody tr:nth-child(2n) td{background:#fbfafe}
._18hRHG_mid{grid-template-columns:1.15fr 1fr;align-items:start;gap:8mm;margin-top:7px;display:grid}
._18hRHG_words{border:1px solid var(--line);border-radius:8px;margin-bottom:8px;padding:7px 10px}
._18hRHG_words b{font-size:8.8pt}
._18hRHG_sched{border-collapse:collapse;width:100%;font-size:7.8pt}
._18hRHG_sched th{text-align:left;color:var(--muted);border-bottom:1.2px solid var(--brand);padding:4px 6px;font-size:7pt;font-weight:600}
._18hRHG_sched th._18hRHG_num{text-align:right}
._18hRHG_sched td{border-bottom:1px solid var(--line);padding:4px 6px}
._18hRHG_status{border-radius:99px;padding:1px 7px;font-size:7pt;font-weight:600;display:inline-block}
._18hRHG_sDue{color:#7a5300;background:#fdf1d3}
._18hRHG_sUp{background:var(--soft);color:#4a3fa0}
._18hRHG_sPaid{color:#135e58;background:#d9f1ee}
._18hRHG_tot{border-collapse:collapse;width:100%;font-size:8.6pt}
._18hRHG_tot td{border-bottom:1px solid var(--line);padding:3.8px 8px}
._18hRHG_tot tr._18hRHG_big td{background:var(--ink);color:#fff;border:none;font-size:10pt;font-weight:700}
._18hRHG_tot tr._18hRHG_dueRow td{background:var(--soft);border-bottom:none;font-weight:700}
._18hRHG_bottom{grid-template-columns:1.3fr auto 1fr;align-items:stretch;gap:6mm;margin-top:8px;display:grid}
._18hRHG_card{border:1px solid var(--line);border-radius:8px;padding:8px 10px}
._18hRHG_kv{grid-template-columns:62px 1fr;font-size:8pt;line-height:1.55;display:grid}
._18hRHG_kv span:nth-child(odd){color:var(--muted)}
._18hRHG_qr{color:#8a82b5;text-align:center;background:#fbfafe;border:1.2px dashed #b7aedb;border-radius:8px;flex-direction:column;justify-content:center;align-items:center;width:33mm;padding:4px;font-size:7.4pt;display:flex}
._18hRHG_qrBox{border:1px dashed #c9c2e6;width:19mm;height:19mm;margin-bottom:4px;display:block}
._18hRHG_sign{flex-direction:column;justify-content:space-between;display:flex}
._18hRHG_signSpace{border-bottom:1px solid var(--ink);color:#9c95c2;justify-content:flex-end;align-items:flex-end;height:12mm;margin:2px 0 4px;font-size:6.8pt;display:flex}
._18hRHG_terms{color:var(--muted);margin-top:7px;font-size:7.6pt;line-height:1.5}
._18hRHG_terms b{color:var(--ink)}
._18hRHG_terms ol{margin:3px 0 0;padding-left:14px;list-style:decimal}
._18hRHG_foot{border-top:1px solid var(--line);text-align:center;color:var(--muted);margin-top:6px;padding-top:5px;font-size:7.4pt}
</style>
</head>
<body>
<div class="BLzxva_stage">
  <div class="BLzxva_toolbar BLzxva_noPrint">
    <b>Invoice ${data.invoiceNumber}</b>
    <div class="BLzxva_actions">
      <button type="button" onclick="window.print()" class="BLzxva_btnGhost BLzxva_btn">Print / Save as PDF</button>
    </div>
  </div>
  
  <div class="BLzxva_doc _18hRHG_sheet">
    <div class="_18hRHG_top">
      <div>
        ${logoMarkup}
        <div class="_18hRHG_co">
          <b>${agency.name}</b><br/>
          ${agency.tagline || 'Websites, branding and digital growth'}<br/>
          ${agency.address}
        </div>
      </div>
      <div class="_18hRHG_title">
        <h1 class="_18hRHG_titleH">Tax Invoice</h1>
        <table class="_18hRHG_meta">
          <tbody>
            <tr><td>Invoice no.</td><td>${data.invoiceNumber}</td></tr>
            <tr><td>Invoice date</td><td>${data.issueDate}</td></tr>
            <tr><td>Due date</td><td>${data.dueDate}</td></tr>
            <tr><td>Place of supply</td><td>${data.placeOfSupply}</td></tr>
            <tr><td>Agreement ref.</td><td>${data.agreementRef}</td></tr>
            <tr><td>Reverse charge</td><td>No</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="BLzxva_rule _18hRHG_ruleGap"></div>

    <div class="_18hRHG_parties">
      <div class="_18hRHG_party">
        <div class="BLzxva_label">Billed by</div>
        <b>${agency.name}</b>
        <div>${agency.address}</div>
        <div class="_18hRHG_partyRow"><span>GSTIN</span><span>${agency.gstin || '22AAAAA0000A1Z5'}</span></div>
        <div class="_18hRHG_partyRow"><span>PAN</span><span>${agency.pan || 'AAAAA0000A'}</span></div>
        <div class="_18hRHG_partyRow"><span>Email</span><span>${agency.email}</span></div>
        <div class="_18hRHG_partyRow"><span>Phone</span><span>${agency.phone}</span></div>
      </div>
      <div class="_18hRHG_party">
        <div class="BLzxva_label">Billed to</div>
        <b>${client.name || 'Valued Client'}</b>
        <div>${client.address || 'Registered Business Address'}</div>
        <div class="_18hRHG_partyRow"><span>GSTIN</span><span>${client.gstin || 'Unregistered'}</span></div>
        <div class="_18hRHG_partyRow"><span>Attn.</span><span>${client.signatory || client.name}</span></div>
        <div class="_18hRHG_partyRow"><span>Email</span><span>${client.email || 'client@email.com'}</span></div>
        <div class="_18hRHG_partyRow"><span>Phone</span><span>${client.phone || '+91 91234 56789'}</span></div>
      </div>
    </div>

    <div class="_18hRHG_project">
      <b>Project:</b> ${data.projectName}
      <span class="_18hRHG_gap"></span>
      <b>Instalment:</b> ${data.installmentLabel}
    </div>

    <table class="_18hRHG_items">
      <thead>
        <tr>
          <th style="width:4%">#</th>
          <th>Description</th>
          <th style="width:10%">SAC</th>
          <th class="_18hRHG_num" style="width:7%">Qty</th>
          <th class="_18hRHG_num" style="width:15%">Rate (₹)</th>
          <th class="_18hRHG_num" style="width:15%">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="_18hRHG_mid">
      <div>
        <div class="_18hRHG_words">
          <div class="BLzxva_label">Amount in words</div>
          <b>${data.amountInWords}</b>
        </div>
        <div class="BLzxva_label">Payment schedule (from agreement ${data.agreementRef})</div>
        <table class="_18hRHG_sched">
          <thead>
            <tr>
              <th style="width:6%">#</th>
              <th>Milestone</th>
              <th class="_18hRHG_num">Share</th>
              <th class="_18hRHG_num">Amount (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${milestonesHtml}
          </tbody>
        </table>
      </div>

      <table class="_18hRHG_tot">
        <tbody>
          <tr><td>Subtotal</td><td class="_18hRHG_num">₹${data.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
          ${data.discount > 0 ? `<tr><td>Discount</td><td class="_18hRHG_num">-₹${data.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
          <tr><td>Taxable value</td><td class="_18hRHG_num">₹${data.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
          ${data.taxPercent > 0 ? `
            <tr><td>CGST @ ${cgstRate}%</td><td class="_18hRHG_num">₹${data.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            <tr><td>SGST @ ${sgstRate}%</td><td class="_18hRHG_num">₹${data.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
          ` : ''}
          ${data.roundOff !== 0 ? `<tr><td>Round off</td><td class="_18hRHG_num">${data.roundOff > 0 ? `+₹${data.roundOff}` : `-₹${Math.abs(data.roundOff)}`}</td></tr>` : ''}
          <tr class="_18hRHG_big"><td>Invoice total</td><td class="_18hRHG_num">₹${data.invoiceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td>Amount received</td><td class="_18hRHG_num">₹${data.amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
          <tr class="_18hRHG_dueRow"><td>Balance due</td><td class="_18hRHG_num">₹${data.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="_18hRHG_bottom">
      <div class="_18hRHG_card">
        <div class="BLzxva_label">Bank details for payment</div>
        <div class="_18hRHG_kv">
          <span>Name</span><span>${agency.name}</span>
          <span>Bank</span><span>${agency.bank_name || 'Bank'}</span>
          <span>Account</span><span>${agency.account_number || '0000 0000 0000'} (Current)</span>
          <span>IFSC</span><span>${agency.ifsc_code || 'IFSC'}</span>
          <span>UPI ID</span><span>${agency.upi_id || 'upi'}</span>
        </div>
      </div>

      <div class="_18hRHG_qr">
        <i class="_18hRHG_qrBox"></i>UPI QR code<br/>goes here
      </div>

      <div class="_18hRHG_card _18hRHG_sign">
        <div><div class="BLzxva_label">For ${agency.name}</div></div>
        <div class="_18hRHG_signSpace">Stamp and signature</div>
        <div style="font-size:7.8pt">
          <b>${agency.representative || 'Aryan Gupta'}</b><br/>
          <span class="BLzxva_muted">${agency.partner1_role || 'Director'}</span>
          ${partner2Signature}
        </div>
      </div>
    </div>

    <div class="_18hRHG_terms">
      <b>Terms</b>
      <ol>
        <li>Please pay by the due date. Late payment attracts a charge of 1.5% per month on the amount overdue.</li>
        <li>Quote the invoice number in your payment reference. Bank charges are borne by the payer.</li>
        <li>Work on each stage starts after the matching instalment is received, as set out in the agreement.</li>
        <li>Disputes are subject to the jurisdiction of courts at ${agency.city || 'Noida, UP'}.</li>
      </ol>
    </div>

    <div class="_18hRHG_foot">
      This is a computer-generated invoice. Questions about it? Write to ${agency.email} or call ${agency.phone}.
    </div>
  </div>
</div>
</body>
</html>`
}

/**
 * Generates the 100% pure standalone HTML for Services Agreement
 */
export function generateAgreementHtml(data: AgreementPrintData): string {
  const { agency, client, sections, deliverables, timeline } = data

  const sectionsHtml = sections.map(sec => `
    <section>
      <h2 class="Uvh_Ra_sec">${sec.id}. ${sec.title}</h2>
      ${sec.clauses.map(c => `
        <div class="Uvh_Ra_clause">
          <span class="Uvh_Ra_clauseNo">${c.no}</span>
          <span>${c.text}</span>
        </div>
      `).join('')}
    </section>
  `).join('')

  const deliverablesHtml = deliverables.map((d, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><b>${d.title}</b><small>${d.description}</small></td>
      <td><span class="Uvh_Ra_chk"></span>Yes</td>
    </tr>
  `).join('')

  const timelineHtml = timeline.map(tw => `
    <tr>
      <td>Week ${tw.week}</td>
      <td>${tw.dates}</td>
      <td>${tw.description}</td>
      <td>${tw.paymentLink}</td>
    </tr>
  `).join('')

  const logoMarkup = agency.logo_url
    ? `<img src="${agency.logo_url}" alt="${agency.name}" class="BLzxva_logoImg" />`
    : `<div class="BLzxva_logo"><span>${agency.name}</span><small>Services Agreement</small></div>`

  const partner2SigBox = (agency.has_dual_signatories ?? true) && agency.partner2_name ? `
    <div class="Uvh_Ra_sig">
      <div class="Uvh_Ra_who">For the Provider (Partner 2)</div>
      <div>${agency.name}</div>
      <div class="Uvh_Ra_space"><span>Signature</span><span>Company stamp</span></div>
      <div class="Uvh_Ra_ln"><span>Name</span><span>${agency.partner2_name}</span></div>
      <div class="Uvh_Ra_ln"><span>Title</span><span>${agency.partner2_role || 'Managing Partner'}</span></div>
      <div class="Uvh_Ra_ln"><span>Date</span><span>&nbsp;</span></div>
      <div class="Uvh_Ra_ln"><span>Place</span><span>${data.agreementPlace}</span></div>
    </div>
  ` : ''

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Services Agreement - ${data.agreementNumber}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--font-inter:"Inter"}html,body{margin:0}
.BLzxva_doc{--ink:#1e1b3a;--brand:#6d5bd0;--tint:#f4f1f9;--line:#d9d4e8;--muted:#5b5778;--soft:#ede9f7;font-family:var(--font-inter,"Inter"),"Inter","Poppins","DejaVu Sans",system-ui,sans-serif;color:var(--ink);font-feature-settings:"tnum" 1,"cv11" 1;-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#fff}
.BLzxva_doc,.BLzxva_doc *{box-sizing:border-box}
.BLzxva_num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.BLzxva_muted{color:var(--muted)}
.BLzxva_label{color:var(--muted);letter-spacing:.02em;margin-bottom:3px;font-size:7pt;font-weight:600}
.BLzxva_logo{color:#8a82b5;background:#fbfafe;border:1.2px dashed #b7aedb;border-radius:6px;flex-direction:column;justify-content:center;align-items:center;width:60mm;height:20mm;font-size:9pt;font-weight:600;display:flex}
.BLzxva_logo small{color:#9c95c2;margin-top:2px;font-size:6.8pt;font-weight:400}
.BLzxva_logoImg{object-fit:contain;object-position:left center;max-width:60mm;height:20mm;display:block}
.BLzxva_rule{background:linear-gradient(90deg,var(--brand),#b9aef0);border-radius:2px;height:3px}
.BLzxva_stage{background:#e6e2ee;min-height:100vh;padding:24px 12px 48px}
.BLzxva_toolbar{max-width:210mm;font-family:var(--font-inter,"Inter"),"Inter",system-ui,sans-serif;color:#1e1b3a;justify-content:space-between;align-items:center;gap:12px;margin:0 auto 14px;font-size:14px;display:flex}
.BLzxva_toolbar b{font-weight:600}
.BLzxva_btn{cursor:pointer;height:36px;font:inherit;color:#fff;background:#6d5bd0;border:0;border-radius:12px;align-items:center;padding:0 16px;font-weight:600;text-decoration:none;display:inline-flex}
.BLzxva_btnGhost{color:#1e1b3a;background:#fff;box-shadow:inset 0 0 0 1px #d3cde3}
.BLzxva_btn:focus-visible{outline-offset:2px;outline:2px solid #6d5bd0}
.BLzxva_actions{gap:8px;display:flex}
@media print{
  .BLzxva_stage{background:0 0;min-height:0;padding:0}
  .BLzxva_noPrint{display:none!important}
  .Uvh_Ra_sheet{width:auto!important;box-shadow:none!important;margin:0!important;padding:0!important}
}
@page { size: A4; margin: 15mm 16mm 17mm 16mm; }
.Uvh_Ra_sheet{width:210mm;margin:0 auto;padding:15mm 16mm 17mm;font-size:9.4pt;line-height:1.52;box-shadow:0 6px 30px #3c326e2e;background:#fff}
.Uvh_Ra_num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.Uvh_Ra_head{grid-template-columns:1fr auto;align-items:start;gap:8mm;display:grid}
.Uvh_Ra_sellerLine{color:var(--muted);margin-top:6px;font-size:8.2pt;line-height:1.45}
.Uvh_Ra_sellerLine b{color:var(--ink);font-size:10pt}
.Uvh_Ra_agmeta{text-align:right;color:var(--muted);font-size:8.4pt;line-height:1.6}
.Uvh_Ra_agmeta b{color:var(--ink)}
.Uvh_Ra_ruleGap{margin:10px 0 12px}
.Uvh_Ra_titleH{letter-spacing:-.02em;margin:0 0 2px;font-size:20pt;font-weight:800;line-height:1.2;color:var(--ink)}
.Uvh_Ra_lead{color:var(--muted);margin:0 0 8px}
.Uvh_Ra_parties{grid-template-columns:1fr 1fr;gap:6mm;margin:8px 0 10px;display:grid}
.Uvh_Ra_party{border:1px solid var(--line);break-inside:avoid;border-radius:8px;padding:9px 11px;font-size:8.6pt;line-height:1.5;background:#fff}
.Uvh_Ra_partyName{font-size:10pt;font-weight:700;color:var(--ink)}
.Uvh_Ra_role{color:var(--muted);margin-bottom:3px;font-size:7.4pt;font-weight:600;text-transform:uppercase}
.Uvh_Ra_glance{background:var(--tint);break-inside:avoid;border-radius:8px;margin:6px 0 10px;padding:9px 12px}
.Uvh_Ra_glance table{border-collapse:collapse;width:100%;font-size:8.8pt}
.Uvh_Ra_glance td{vertical-align:top;padding:2.5px 0}
.Uvh_Ra_glance td:first-child{width:30%;color:var(--muted)}
.Uvh_Ra_pricebox{border:2px solid var(--brand);break-inside:avoid;box-shadow:0 0 0 4px var(--soft);background:#fff;border-radius:12px;margin:10px 0 12px;padding:12px 14px}
.Uvh_Ra_ph{justify-content:space-between;align-items:baseline;margin-bottom:8px;display:flex}
.Uvh_Ra_ph b{font-size:11pt;color:var(--ink)}
.Uvh_Ra_ph span{color:var(--muted);font-size:8pt}
.Uvh_Ra_pgrid{grid-template-columns:1.1fr 1fr;align-items:start;gap:6mm;display:grid}
.Uvh_Ra_pt{border-collapse:collapse;width:100%;font-size:9pt}
.Uvh_Ra_pt td{border-bottom:1px solid var(--line);padding:4px 8px}
.Uvh_Ra_pt tr.Uvh_Ra_totRow td{background:var(--ink);color:#fff;border:none;font-size:10.5pt;font-weight:700}
.Uvh_Ra_inwords{color:var(--muted);margin-top:5px;font-size:8.2pt}
.Uvh_Ra_inwords b{color:var(--ink)}
.Uvh_Ra_inst{border-collapse:collapse;width:100%;margin-top:10px;font-size:8.4pt}
.Uvh_Ra_inst th{background:var(--soft);text-align:left;color:#3d3480;padding:5px 7px;font-size:7.6pt;font-weight:600}
.Uvh_Ra_inst th.Uvh_Ra_num{text-align:right}
.Uvh_Ra_inst td{border-bottom:1px solid var(--line);vertical-align:top;padding:5px 7px}
.Uvh_Ra_inst tr.Uvh_Ra_sumRow td{border-bottom:none;border-top:1.5px solid var(--brand);font-weight:700}
.Uvh_Ra_extras{color:var(--muted);margin-top:8px;font-size:8pt;line-height:1.45}
.Uvh_Ra_pgrid .Uvh_Ra_extras{margin-top:0}
.Uvh_Ra_extras b{color:var(--ink)}
.Uvh_Ra_sec{border-bottom:1.5px solid var(--brand);break-after:avoid;margin:16px 0 4px;padding-bottom:3px;font-size:11pt;font-weight:700;color:var(--ink)}
.Uvh_Ra_clause{grid-template-columns:30px 1fr;margin:0 0 4px;display:grid}
.Uvh_Ra_clauseNo{color:var(--brand);font-variant-numeric:tabular-nums;font-weight:700}
.Uvh_Ra_p{margin:0 0 6px}
.Uvh_Ra_sigs{break-inside:avoid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6mm;margin-top:12px;display:grid}
.Uvh_Ra_sig{border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:8.6pt;background:#fff}
.Uvh_Ra_who{font-size:9.6pt;font-weight:700;color:var(--ink)}
.Uvh_Ra_space{border-bottom:1px solid var(--ink);color:#9c95c2;justify-content:space-between;align-items:flex-end;height:24mm;margin:8px 0 4px;padding-bottom:2px;font-size:7pt;display:flex}
.Uvh_Ra_ln{border-bottom:1px dotted var(--line);grid-template-columns:62px 1fr;padding:3px 0;display:grid}
.Uvh_Ra_ln span:first-child{color:var(--muted)}
.Uvh_Ra_wit{break-inside:avoid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:10px;font-size:8.4pt;display:grid}
.Uvh_Ra_wit div{border-top:1px solid var(--ink);color:var(--muted);margin-top:20mm;padding-top:3px}
.Uvh_Ra_annex{break-before:page;page-break-before:always}
.Uvh_Ra_annexTitle{letter-spacing:-.01em;margin:0 0 4px;font-size:15pt;font-weight:800;line-height:1.25;color:var(--ink)}
.Uvh_Ra_annexTitleGap{margin-top:20px}
.Uvh_Ra_sc{border-collapse:collapse;width:100%;margin:6px 0 10px;font-size:8.8pt}
.Uvh_Ra_sc th{background:var(--ink);color:#fff;text-align:left;padding:6px 8px;font-size:8pt;font-weight:600}
.Uvh_Ra_sc td{border-bottom:1px solid var(--line);vertical-align:top;padding:6px 8px}
.Uvh_Ra_sc td small{color:var(--muted);font-size:7.8pt;display:block}
.Uvh_Ra_sc tr{break-inside:avoid}
.Uvh_Ra_chk{border:1.3px solid var(--brand);vertical-align:-1px;border-radius:2px;width:9px;height:9px;margin-right:5px;display:inline-block;background:#6d5bd0}
.Uvh_Ra_two{grid-template-columns:1fr 1fr;gap:6mm;display:grid}
.Uvh_Ra_listbox{border:1px solid var(--line);break-inside:avoid;border-radius:8px;padding:8px 12px;font-size:8.8pt}
.Uvh_Ra_listbox b{font-size:9.4pt;color:var(--ink)}
.Uvh_Ra_listbox ul{margin:4px 0 0;padding-left:16px;list-style:outside}
.Uvh_Ra_listbox li{margin-bottom:2px}
</style>
</head>
<body>
<div class="BLzxva_stage">
  <div class="BLzxva_toolbar BLzxva_noPrint">
    <b>Agreement ${data.agreementNumber}</b>
    <div class="BLzxva_actions">
      <button type="button" onclick="window.print()" class="BLzxva_btnGhost BLzxva_btn">Print / Save as PDF</button>
    </div>
  </div>

  <div class="BLzxva_doc Uvh_Ra_sheet">
    <div class="Uvh_Ra_head">
      <div>
        ${logoMarkup}
        <div class="Uvh_Ra_sellerLine">
          <b>${agency.name}</b><br/>
          ${agency.address}<br/>
          GSTIN ${agency.gstin || '22AAAAA0000A1Z5'}
        </div>
      </div>
      <div class="Uvh_Ra_agmeta">
        <b>Agreement no.</b> ${data.agreementNumber}<br/>
        <b>Date</b> ${data.effectiveDate}<br/>
        <b>Place</b> ${data.agreementPlace}<br/>
        <b>Version</b> ${data.agreementVersion}
      </div>
    </div>

    <div class="BLzxva_rule Uvh_Ra_ruleGap"></div>

    <h1 class="Uvh_Ra_titleH">Website and Digital Services Agreement</h1>
    <p class="Uvh_Ra_lead">This agreement is made on ${data.effectiveDate} at ${data.agreementPlace}, between the two parties below.</p>

    <div class="Uvh_Ra_parties">
      <div class="Uvh_Ra_party">
        <div class="Uvh_Ra_role">Service provider (&quot;Provider&quot;)</div>
        <div class="Uvh_Ra_partyName">${agency.name}</div>
        ${agency.address}<br/>
        GSTIN ${agency.gstin || '22AAAAA0000A1Z5'}, PAN ${agency.pan || 'AAAAA0000A'}<br/>
        Represented by ${agency.representative || 'Aryan Gupta'}, ${agency.partner1_role || 'Director'}
        ${(agency.has_dual_signatories ?? true) && agency.partner2_name ? ` and ${agency.partner2_name}, ${agency.partner2_role || 'Managing Partner'}` : ''}<br/>
        ${agency.email}, ${agency.phone}
      </div>
      <div class="Uvh_Ra_party">
        <div class="Uvh_Ra_role">Client (&quot;Client&quot;)</div>
        <div class="Uvh_Ra_partyName">${client.name}</div>
        ${client.address || 'Registered Business Address'}<br/>
        GSTIN ${client.gstin || 'Unregistered'}, PAN ${client.pan || 'N/A'}<br/>
        Represented by ${client.signatory || client.name}<br/>
        ${client.email || 'client@email.com'}, ${client.phone || '+91 91234 56789'}
      </div>
    </div>

    <div class="Uvh_Ra_glance">
      <table>
        <tbody>
          <tr><td>Project</td><td><b>${data.projectName}</b></td></tr>
          <tr><td>Start date</td><td>${data.startDateStr}</td></tr>
          <tr><td>Estimated completion</td><td>${data.estimatedCompletion}</td></tr>
          <tr><td>Provider contact</td><td>${agency.representative}, ${agency.phone}, ${agency.email}</td></tr>
          <tr><td>Client contact</td><td>${client.signatory || client.name}, ${client.phone}, ${client.email}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="Uvh_Ra_pricebox">
      <div class="Uvh_Ra_ph"><b>Price and payment</b><span>All amounts in Indian Rupees</span></div>
      <div class="Uvh_Ra_pgrid">
        <div>
          <table class="Uvh_Ra_pt">
            <tbody>
              <tr><td>Project fee (before GST)</td><td class="Uvh_Ra_num">₹${data.dealVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
              <tr><td>GST @ ${data.gstPercent}%</td><td class="Uvh_Ra_num">₹${data.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
              <tr class="Uvh_Ra_totRow"><td>Total payable</td><td class="Uvh_Ra_num">₹${data.totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            </tbody>
          </table>
          <div class="Uvh_Ra_inwords">In words: <b>${data.amountInWords}</b></div>
        </div>
        <div class="Uvh_Ra_extras">
          <b>Not included in this price</b><br/>
          Domain name and hosting (paid by the Client at actual cost), paid advertising spend, stock photos or paid plugins, content writing and photography, and any work outside the scope in Annexure A. Extra work is quoted in writing before it starts.
        </div>
      </div>

      <table class="Uvh_Ra_inst">
        <thead>
          <tr>
            <th style="width:5%">#</th>
            <th>Instalment</th>
            <th class="Uvh_Ra_num" style="width:8%">Share</th>
            <th class="Uvh_Ra_num" style="width:14%">Fee (₹)</th>
            <th class="Uvh_Ra_num" style="width:12%">GST (₹)</th>
            <th class="Uvh_Ra_num" style="width:15%">Payable (₹)</th>
            <th style="width:20%">Due</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>On signing this agreement (advance)</td>
            <td class="Uvh_Ra_num">${data.inst1Share}%</td>
            <td class="Uvh_Ra_num">${data.inst1Fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td class="Uvh_Ra_num">${data.inst1Gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td class="Uvh_Ra_num"><b>${data.inst1Tot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></td>
            <td>On signing</td>
          </tr>
          <tr>
            <td>2</td>
            <td>On approval of the website design</td>
            <td class="Uvh_Ra_num">${data.inst2Share}%</td>
            <td class="Uvh_Ra_num">${data.inst2Fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td class="Uvh_Ra_num">${data.inst2Gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td class="Uvh_Ra_num"><b>${data.inst2Tot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></td>
            <td>Within 3 days of approval</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Before go-live, after final testing</td>
            <td class="Uvh_Ra_num">${data.inst3Share}%</td>
            <td class="Uvh_Ra_num">${data.inst3Fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td class="Uvh_Ra_num">${data.inst3Gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td class="Uvh_Ra_num"><b>${data.inst3Tot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></td>
            <td>Before go-live</td>
          </tr>
          <tr class="Uvh_Ra_sumRow">
            <td></td>
            <td>Total</td>
            <td class="Uvh_Ra_num">100%</td>
            <td class="Uvh_Ra_num">${data.dealVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td class="Uvh_Ra_num">${data.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td class="Uvh_Ra_num">${data.totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="Uvh_Ra_extras">
        Payment is made by bank transfer or UPI to the account named on each invoice. The Provider issues a GST invoice for each instalment.
      </div>
    </div>

    ${sectionsHtml}

    <h2 class="Uvh_Ra_sec">Signatures</h2>
    <p class="Uvh_Ra_p">The parties have read and understood this agreement and sign it on the date written on page 1.</p>

    <div class="Uvh_Ra_sigs">
      <div class="Uvh_Ra_sig">
        <div class="Uvh_Ra_who">For the Provider (Partner 1)</div>
        <div>${agency.name}</div>
        <div class="Uvh_Ra_space"><span>Signature</span><span>Company stamp</span></div>
        <div class="Uvh_Ra_ln"><span>Name</span><span>${agency.representative || 'Aryan Gupta'}</span></div>
        <div class="Uvh_Ra_ln"><span>Title</span><span>${agency.partner1_role || 'Director'}</span></div>
        <div class="Uvh_Ra_ln"><span>Date</span><span>&nbsp;</span></div>
        <div class="Uvh_Ra_ln"><span>Place</span><span>${data.agreementPlace}</span></div>
      </div>

      ${partner2SigBox}

      <div class="Uvh_Ra_sig">
        <div class="Uvh_Ra_who">For the Client</div>
        <div>${client.name}</div>
        <div class="Uvh_Ra_space"><span>Signature</span><span>Company stamp</span></div>
        <div class="Uvh_Ra_ln"><span>Name</span><span>${(client.signatory || client.name).split(',')[0]}</span></div>
        <div class="Uvh_Ra_ln"><span>Title</span><span>Owner</span></div>
        <div class="Uvh_Ra_ln"><span>Date</span><span>&nbsp;</span></div>
        <div class="Uvh_Ra_ln"><span>Place</span><span>${(client.address || '').split(',').pop()?.trim() || data.agreementPlace}</span></div>
      </div>
    </div>

    <div class="Uvh_Ra_wit">
      <div>Witness 1: name, address and signature</div>
      <div>Witness 2: name, address and signature</div>
    </div>

    <div class="Uvh_Ra_annex">
      <h2 class="Uvh_Ra_annexTitle">Annexure A: Scope of work</h2>
      <p class="Uvh_Ra_p BLzxva_muted">The Work includes only the items marked below.</p>

      <table class="Uvh_Ra_sc">
        <thead>
          <tr>
            <th style="width:5%">#</th>
            <th>Deliverable</th>
            <th style="width:17%">Included</th>
          </tr>
        </thead>
        <tbody>
          ${deliverablesHtml}
        </tbody>
      </table>

      <div class="Uvh_Ra_two">
        <div class="Uvh_Ra_listbox">
          <b>What the Client provides</b>
          <ul>
            <li>Logo, brand colours and photos</li>
            <li>Text for each page, or notes for the Provider to draft</li>
            <li>Domain and hosting access</li>
            <li>Google account access for the profile</li>
            <li>One person who can approve work</li>
          </ul>
        </div>
        <div class="Uvh_Ra_listbox">
          <b>Not included</b>
          <ul>
            <li>Content writing, photography, video</li>
            <li>Paid ads and ad management</li>
            <li>Domain, hosting and paid plugin fees</li>
            <li>Online payments or e-commerce</li>
            <li>Monthly maintenance after 30 days</li>
          </ul>
        </div>
      </div>

      <h2 class="Uvh_Ra_annexTitle Uvh_Ra_annexTitleGap">Annexure B: Timeline</h2>
      <p class="Uvh_Ra_p BLzxva_muted">Dates start when the first instalment is received and the Client has shared the material in clause 5.1.</p>

      <table class="Uvh_Ra_sc">
        <thead>
          <tr>
            <th style="width:12%">Week</th>
            <th style="width:22%">Dates</th>
            <th>What happens</th>
            <th style="width:24%">Payment link</th>
          </tr>
        </thead>
        <tbody>
          ${timelineHtml}
        </tbody>
      </table>
    </div>
  </div>
</div>
</body>
</html>`
}

/**
 * Universal Print Dispatcher:
 * Uses an invisible isolated iframe to trigger instant browser print of pure HTML.
 * Completely bypasses modal containers, dark themes, and Tailwind 4 interference.
 */
export function executePrint(html: string) {
  try {
    let iframe = document.getElementById('synchad-virtual-print-frame') as HTMLIFrameElement
    if (!iframe) {
      iframe = document.createElement('iframe')
      iframe.id = 'synchad-virtual-print-frame'
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.style.opacity = '0'
      iframe.style.pointerEvents = 'none'
      document.body.appendChild(iframe)
    }

    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(html)
      doc.close()
      iframe.contentWindow?.focus()
      setTimeout(() => {
        iframe.contentWindow?.print()
      }, 350)
      return
    }
  } catch (e) {
    console.error('Virtual iframe print error:', e)
  }

  // Popup window fallback if iframe fails
  const printWin = window.open('', '_blank')
  if (printWin) {
    printWin.document.open()
    printWin.document.write(html)
    printWin.document.close()
    printWin.focus()
    setTimeout(() => {
      printWin.print()
    }, 350)
  } else {
    window.print()
  }
}
