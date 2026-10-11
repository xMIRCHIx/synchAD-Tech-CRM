# product.md - Product Definition

## One line
An AI agent that finds local businesses, studies their online presence, writes a personal pitch, and starts a WhatsApp chat. A built-in CRM keeps every lead and every message.

## Who uses it
- **Primary user:** Aryan, the agency owner (solo operator). Later, a small sales team.
- **Target leads:** local businesses (clinics, agencies, salons, coaching centres) that need a website, a better website, or more leads.

## Problem
- Finding leads by hand is slow.
- Generic cold messages get ignored and reported.
- Owners lose track of chats across phones and tools.

## What the product does
1. **Finds** businesses on Google Maps (name, phone, website).
2. **Checks** the website: does it work? What is missing?
3. **Writes** a short, polite, specific WhatsApp message using only real facts.
4. **Sends** it (only when consent is confirmed) and **catches replies**.
5. **Stores** everything in a CRM. The owner can read the chat and reply by hand.

## Two lead types (the main branch)
| Type | Pitch idea |
|---|---|
| Has website | Fix and improve it (speed, mobile, booking button, trust) |
| No website | Build a simple site that turns Google searches into bookings |

## Core features (MVP)
- Nightly prospecting from Google Maps
- Phone cleaning and duplicate blocking
- Website health check (working, broken, empty, blocked)
- Two-pass AI: critic, then copywriter
- Quality gate and human approval queue
- WhatsApp template send, status tracking (sent, delivered, read, failed)
- Inbound webhook and reply classification (interested, question, stop, other)
- CRM inbox with manual reply
- Kill switch, daily cap, send hours

## Later features (V2)
- Automatic follow-ups (max 2)
- Template A/B testing
- Owner alerts on Telegram
- One-click AI reply drafts
- Mini audit report PDF
- Analytics dashboard

## Not in scope
- Sending to people without consent
- Fully automatic AI replies to interested leads (human sends at first)
- Bulk SMS or voice calls
- Multi-tenant SaaS (maybe later)

## Rules that cannot be broken
1. **Consent Gate:** no WhatsApp send unless `consent_status = confirmed`.
2. Every message includes an opt-out line. STOP is honored forever.
3. AI never invents facts. Every claim needs evidence from scraped data.
4. First 50 to 100 messages are approved by a human.
5. Business hours only (10:00 to 18:00 IST). Daily cap with slow warm-up.

## Success metrics
| Metric | Target |
|---|---|
| Delivery rate | 90% or higher |
| Failure rate | under 5% |
| Opt-out rate | under 2% |
| Meta quality rating | green |
| Reply rate | measure own baseline in weeks 1 to 2 |
| Cost per reply | track in INR |

## Cost reality (India, Oct 2026)
- WhatsApp marketing template: Rs 0.8631 + 18% GST per delivered message (about Rs 1.02)
- Utility template: Rs 0.1150 per message
- Free-form replies: 1,000 free per number per month, then charged
- Apify free plan: $5 credits per month (about 1,000 to 1,250 places)
- Gemini, Jina, Supabase: free tiers at start. Check limits.
- n8n: free if self-hosted, but needs an always-on server

"Zero-cost" is true for data and AI at small scale. WhatsApp messages and the server are the real costs.
