# api-specs.md - API Specs

Replace UPPERCASE placeholders. Check each provider's current docs because versions and field names change. Store all keys in n8n credentials. Never hardcode them.

## A. External APIs

### A1. Apify - Google Maps Scraper
```http
POST https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=APIFY_TOKEN&timeout=280
Content-Type: application/json

{
  "searchStringsArray": ["dental clinic"],
  "locationQuery": "Mumbai, India",
  "maxCrawledPlacesPerSearch": 40,
  "language": "en",
  "skipClosedPlaces": true
}
```
Field mapping (check the real output first): `placeId` -> `place_id`, `title` -> `business_name`, `categoryName` -> `category`, `phone` -> `phone_raw`, `website` -> `website_url`, `totalScore` -> `google_rating`, `reviewsCount` -> `google_reviews_count`, `url` -> `google_maps_url`. Save the full item in `raw`.
Cost: about $4 per 1,000 places. Free plan: $5 per month.

### A2. Jina Reader
```http
GET https://r.jina.ai/https://example-clinic.com
Authorization: Bearer JINA_API_KEY
Accept: application/json
X-Return-Format: markdown
X-With-Links-Summary: true
X-Timeout: 20
```

### A3. Firecrawl (fallback)
```http
POST https://api.firecrawl.dev/v1/scrape
Authorization: Bearer FIRECRAWL_API_KEY
Content-Type: application/json

{ "url": "https://example-clinic.com", "formats": ["markdown", "links"], "onlyMainContent": true, "timeout": 30000 }
```

### A4. PageSpeed Insights
```http
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fexample-clinic.com&strategy=mobile&category=performance&key=PSI_API_KEY
```
`score = lighthouseResult.categories.performance.score * 100` -> `website_audits.pagespeed_mobile`.

### A5. Gemini
```http
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
x-goog-api-key: GEMINI_API_KEY
Content-Type: application/json

{
  "systemInstruction": { "parts": [ { "text": "...system prompt..." } ] },
  "contents": [ { "role": "user", "parts": [ { "text": "{ ...lead JSON... }" } ] } ],
  "generationConfig": { "temperature": 0.3, "responseMimeType": "application/json", "maxOutputTokens": 1500 }
}
```
Result: `candidates[0].content.parts[0].text` (parse as JSON). On HTTP 429 retry with backoff (20 s, 40 s, 80 s). Wait 12 to 15 s between calls on the free tier.

Critic output schema:
```json
{
  "business_summary": "string",
  "site_state": "ok|broken|empty|blocked|none",
  "flaws": [ { "flaw": "string", "evidence": "string", "severity": 1, "our_fix": "string" } ],
  "strengths": ["string"],
  "best_angle": "string",
  "score": 0,
  "language": "en|hi|hinglish",
  "do_not_mention": ["string"]
}
```
Copywriter output schema:
```json
{ "var1": "business name", "var2": "observation, max 140 chars", "var3": "outcome, max 120 chars", "reply_draft": "max 60 words", "language": "en", "template": "pitch_site_ok_v1" }
```
Reply classifier output:
```json
{ "intent": "interested|question|not_interested|stop|wrong_number|other", "confidence": 0.0, "language": "en|hi|hinglish", "summary": "max 15 words" }
```

### A6. WhatsApp - send template (first message)
```http
POST https://graph.facebook.com/GRAPH_VERSION/PHONE_NUMBER_ID/messages
Authorization: Bearer WHATSAPP_TOKEN
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "919876543210",
  "type": "template",
  "template": {
    "name": "pitch_site_ok_v1",
    "language": { "code": "en" },
    "components": [ { "type": "body", "parameters": [
      { "type": "text", "text": "VAR1" },
      { "type": "text", "text": "VAR2" },
      { "type": "text", "text": "VAR3" }
    ] } ]
  }
}
```
Success: `{ "messages": [ { "id": "wamid.XXXX" } ] }`. Save the id in `messages.wa_message_id` at once.

### A7. WhatsApp - send text (inside 24h window)
```http
POST https://graph.facebook.com/GRAPH_VERSION/PHONE_NUMBER_ID/messages
Authorization: Bearer WHATSAPP_TOKEN
Content-Type: application/json

{ "messaging_product": "whatsapp", "recipient_type": "individual", "to": "919876543210", "type": "text", "text": { "preview_url": false, "body": "Message text" } }
```

### A8. WhatsApp webhook
Verify (GET): compare `hub.verify_token` with `WEBHOOK_VERIFY_TOKEN`. Return `hub.challenge` as plain text.

Events (POST): `entry[0].changes[0].value` has either `messages[]` or `statuses[]`.
| Event | Where | Action |
|---|---|---|
| Text reply | `messages[0].type = "text"`, `.text.body`, `.from`, `.id` | Insert inbound message |
| Button reply | `type = "button"` or interactive | Same. Stop button = opt-out |
| Media | `type = "image" / "audio" / "document"` | Save placeholder, flag chat |
| Status sent / delivered / read | `statuses[0].status`, `statuses[0].id` | Update `messages` |
| Status failed | `statuses[0].errors[0].code` | Save error, mark failed |

Signature check:
```
expected = "sha256=" + HMAC_SHA256(key = APP_SECRET, message = RAW_REQUEST_BODY)
if expected != header["X-Hub-Signature-256"] -> reject
else -> respond 200 at once, then process
```

Common error codes: 131026 (not on WhatsApp, do not retry), 131047 (24h window closed, send a template), 131048 / 131049 (spam limits, pause), 130429 / 131056 (rate limit, back off), 132000 / 132001 / 132012 (template mismatch), 190 / 401 (token problem, pause and alert).

### A9. Supabase REST insert with dedupe (alternative to the Postgres node)
```http
POST SUPABASE_URL/rest/v1/leads?on_conflict=place_id
apikey: SUPABASE_SERVICE_ROLE_KEY
Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY
Content-Type: application/json
Prefer: resolution=ignore-duplicates,return=representation

[ { "place_id": "...", "business_name": "...", "phone_e164": "+919876543210" } ]
```

## B. Internal API (n8n webhooks called by the dashboard)
These are proposed contracts. Use a secret path suffix on every webhook URL.

### B1. CRM manual reply (WF-06)
```http
POST N8N_BASE/webhook/crm-send-SECRET
Authorization: Bearer SUPABASE_USER_ACCESS_TOKEN
Content-Type: application/json

{ "conversation_id": "uuid", "text": "Thanks for replying! ..." }
```
Steps: verify the token with Supabase Auth -> load the conversation -> if `window_expires_at` is in the past, return 409 `{ "error": "window_closed" }` -> send text -> insert message (`sender = human`) -> return `{ "ok": true, "message_id": "uuid" }`.

### B2. Send template from CRM (after the window is closed)
```http
POST N8N_BASE/webhook/crm-send-template-SECRET
Authorization: Bearer SUPABASE_USER_ACCESS_TOKEN

{ "conversation_id": "uuid", "template_name": "followup_v1", "variables": ["...", "..."] }
```

### B3. Approve or reject a draft
Dashboard updates `leads.status` (`review` -> `queued` or `lost`) and `messages.approved_by`, `approved_at` directly with RLS. n8n WF-04 does the sending.

### B4. Consent webhook (landing page form, wa.me first message)
```http
POST N8N_BASE/webhook/consent-SECRET
Content-Type: application/json

{ "phone": "+919876543210", "source": "web_form", "consent_text_version": "v1" }
```
Sets `consent_status = confirmed`, `consent_source`, `consent_at`, and adds a `lead_events` row.

### B5. Settings
Dashboard reads and edits the `settings` table directly (kill switch, auto_send, daily_cap, send hours, models).

## C. Environment variables
| Name | Source |
|---|---|
| APIFY_TOKEN | Apify console |
| JINA_API_KEY | Jina AI |
| FIRECRAWL_API_KEY | Firecrawl |
| PSI_API_KEY | Google Cloud (PageSpeed Insights API) |
| GEMINI_API_KEY | Google AI Studio |
| WHATSAPP_TOKEN | Meta system user permanent token |
| WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_WABA_ID | Meta WhatsApp API setup |
| META_APP_SECRET | Meta app settings |
| WEBHOOK_VERIFY_TOKEN | Random string you choose |
| SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Supabase (service key stays in n8n only) |
| SUPABASE_ANON_KEY | Supabase (only key allowed in the dashboard) |
| TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID | Telegram |
| GENERIC_TIMEZONE | `Asia/Kolkata` |
