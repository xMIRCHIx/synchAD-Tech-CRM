# B2B_Lead_Gen_Plan.md - Master Plan

## Goal
Build an autonomous B2B lead generation agent. It finds local businesses, studies their digital presence, writes a personal pitch, starts a WhatsApp chat (with consent), and keeps everything in a CRM.

## Stack
n8n, Apify (Google Maps), Jina / Firecrawl, Google Gemini 2.5, Meta WhatsApp Cloud API, Supabase.

## Project files
| File | What it holds |
|---|---|
| product.md | What we build and the rules |
| architecture.md | Components, workflows, security |
| flow.md | Step-by-step flow, all 5 phases |
| schema.md | Full Supabase SQL |
| api-specs.md | External and internal API calls |
| coding-rules.md | Rules for the coding agent |
| Prompt_For_Claude.md | Prompt to continue planning with Claude |
| PPT_Prompt_For_AI.md | Prompt to make a presentation |

## Key decision: the Consent Gate
Meta requires clear opt-in before business-initiated WhatsApp messages. A number on Google Maps is not consent. Template approval is also required. So:
- The AI still researches and writes every pitch.
- WhatsApp sends only when `consent_status = confirmed`.
- Consent is earned by email with a click-to-chat link, a call, Click-to-WhatsApp ads, a form, or a manual DM.

## 4-week roadmap
| Week | Goal | Tasks |
|---|---|---|
| 1 | Foundation | Create Supabase project and run the SQL. Install n8n (Docker, HTTPS, timezone IST). Create Apify, Jina, Gemini and Meta developer accounts. Build WF-01 and WF-02. Test with 30 to 50 leads. Start Meta business verification |
| 2 | Brain and CRM | Build WF-03 (critic, copywriter, quality gate). Tune prompts on 20 real leads. Submit WhatsApp templates. Build CRM screens: Inbox, Approval Queue, Settings. Build WF-08 |
| 3 | Messaging | Build WF-05 and WF-06. Test end to end with the Meta test number. Build WF-04 with all guards. Set up the consent route. Build WF-09 and WF-10 |
| 4 | Soft launch | Go live with 10 to 20 messages per day, all human-approved. Watch metrics daily. Add WF-07 and A/B testing. Raise caps only if everything stays green |

## Warm-up caps
| Week | First messages per day | Move up when |
|---|---|---|
| 1 | 10 to 20 | All approved by human. Delivery 90% or more |
| 2 | 25 to 40 | Opt-outs very low. Quality green |
| 3 | 50 to 80 | Reply rate stable. No warnings |
| 4+ | 100+ (as Meta limits allow) | All earlier conditions still hold |

## Cost (India, Oct 2026)
| Item | Stage A (20/day) | Stage B (50/day) | Stage C (100/day) |
|---|---|---|---|
| First messages per month | 440 | 1,100 | 2,200 |
| WhatsApp marketing (with GST) | about Rs 450 | about Rs 1,120 | about Rs 2,240 |
| Apify | free credits | about Rs 1,350 | about Rs 2,700 |
| Gemini (if paid) | free tier | about Rs 330 | about Rs 660 |
| n8n server | Rs 0 to 500 | Rs 400 to 600 | Rs 400 to 600 |
| Rough total | under Rs 1,000 | about Rs 3,200 | about Rs 6,300 |

These are estimates. Prices change. Check Meta, Apify and Google pages before you commit.

## Risks and answers
| Risk | Answer |
|---|---|
| WhatsApp number banned | Consent Gate, templates, caps, quality watch, backup number |
| AI writes false claims | Evidence rule, quality gate, human approval first |
| Free tier limits (Gemini, Firecrawl) | Wait nodes, Jina first, enable billing if needed |
| Bad phone numbers | Strict cleaning, landline filter |
| Server down | State in DB, restart policy, uptime monitor |
| Law (DPDP Act 2023, scraping terms) | Collect only business info, keep opt-out list, retention rule, review with a lawyer before scaling |

## Daily numbers to watch
Delivery rate (90%+), failure rate (under 5%), opt-out rate (under 2%), Meta quality rating (green), reply rate, Gemini errors (under 5%), leads stuck in one status (zero).

## Launch checklist
- [ ] Business verified, templates approved, permanent token saved
- [ ] Consent Gate on and consent route live
- [ ] Auto-send off, daily cap 10 to 20
- [ ] Error workflow attached to every workflow
- [ ] Telegram or email alerts tested
- [ ] Weekly DB backup and workflow export
- [ ] First 50 messages read by a human before sending
- [ ] Daily report arrives every evening

## Open questions (decide before Week 1)
1. Where will n8n run (VPS, home server, free-tier VM)?
2. Which consent route first (email, call, ads, form)?
3. Which niche and city first?
4. Which WhatsApp number will be used? Is it fresh?
5. English, Hindi or Hinglish templates first?
6. Telegram or email for alerts?
