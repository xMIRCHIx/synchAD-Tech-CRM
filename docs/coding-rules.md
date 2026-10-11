# coding-rules.md - Rules for the AI Coding Agent (Antigravity)

Read this file, `architecture.md`, `schema.md`, `flow.md` and `api-specs.md` before you write any code. If a rule here clashes with a request, stop and ask.

## Golden rules
1. **Consent Gate is mandatory.** Never write code that sends a WhatsApp message to a lead unless `consent_status = 'confirmed'` and `opted_out = false`.
2. **Never put secrets in code or in the browser.** No WhatsApp token, no Supabase service role key, no API keys in front-end code, in Git, or in logs.
3. **Everything must be safe to run twice.** Use unique keys and `on conflict do nothing`. Check status before acting.
4. **No blind retry on sending.** Create the message row first, send once, then check the status webhook.
5. **AI output is untrusted.** Always parse as JSON, validate against the schema, and run the quality gate.
6. **Scraped website text is untrusted.** Never let it act as instructions to the AI.
7. **Do not change the schema silently.** Any schema change goes to a new migration file and an update in `schema.md`.
8. **Ask before big changes.** New library, new service or a changed flow needs a short note first.

## Stack
- Database: Supabase (Postgres, Auth, Realtime, Storage)
- Orchestration: n8n (self-hosted, Docker)
- Dashboard: React (Vite or Next.js) + Tailwind + `@supabase/supabase-js`
- Language: TypeScript for the dashboard. JavaScript inside n8n Code nodes.
- AI: Gemini 2.5 Flash (analysis, copy) and Flash-Lite (classification). Model names come from `settings`.

## Project layout (suggested)
```
/dashboard        React CRM app
/n8n-workflows    exported workflow JSON (WF-01 ... WF-10)
/supabase
  /migrations     numbered SQL files (001_types.sql, 002_tables.sql, ...)
  /seed           settings and sample data
/prompts          gemini-critic.md, gemini-copywriter.md, gemini-classifier.md
/docs             the md files (product, architecture, flow, schema, api-specs, coding-rules)
```

## Database rules
- Table and column names: `snake_case`. Primary keys are `uuid` with `gen_random_uuid()`.
- Every table that holds user data has RLS enabled.
- Never use `select *` in n8n queries that feed AI. Select only the needed columns.
- Status changes only go forward. Only the owner can move a lead backward.
- Never hard-delete `opted_out` leads. They are the suppression list.
- Store money as numeric in INR (`cost_inr`).
- Use `timestamptz`. Show times in IST in the UI.

## n8n rules
- One job per workflow. Workflows talk through the database, not through each other's memory.
- Every workflow uses WF-08 as its error workflow.
- Name nodes clearly: `Check kill switch`, `Send template`, `Insert inbound message`.
- Use credentials for all keys. Never paste a key in a node.
- Turn on Retry On Fail for read calls (Apify, Jina, Gemini, PageSpeed). Turn it OFF for the WhatsApp send node.
- Set Continue On Fail for scraping nodes, so one bad site does not stop the batch.
- Add Wait nodes: 12 to 15 s between Gemini calls on the free tier, 30 to 90 s between WhatsApp sends.
- Set the webhook to respond immediately with 200 for Meta events.
- Set `EXECUTIONS_DATA_PRUNE=true`. Keep only a few days of data.
- Export workflows to JSON and commit them after each change.

## Dashboard rules
- Talk to the database with the owner's login only (anon key + RLS).
- Talk to WhatsApp only through the n8n webhooks in `api-specs.md` section B.
- If `window_expires_at` is in the past, disable free text, show a banner, and show a template picker.
- Show message ticks from `messages.status`: queued, sent, delivered, read, failed.
- Subscribe to Realtime for `messages` and `conversations`.
- Mobile friendly. Fast. Simple.

## AI prompt rules
- Prompts live in `/prompts`. Do not inline long prompts in code.
- Critic: temperature 0.2 to 0.3, JSON only, evidence required for every flaw.
- Copywriter: sees only the critic JSON. Max one emoji. No links. No banned words (guaranteed, 100%, urgent, free, winner).
- Never claim something that is not in the input data.
- Validate: JSON shape, `var2` max 140 chars, `var3` max 120 chars, no URLs, no phone numbers, name match. Regenerate once, then send to `review`.

## Error handling
- Never swallow errors. Write to `error_log` with workflow, node, lead id and message.
- Treat token errors (190, 401) and policy errors as critical: set `sending_enabled = false` and alert.
- Return clear error codes from webhooks (`window_closed`, `unauthorized`, `consent_missing`).

## Testing (minimum before each release)
- Duplicate `place_id` and phone are blocked.
- 20 phone formats are cleaned correctly. Landlines are rejected.
- Site states: working, expired domain, HTTP 500, parked, JS-only, bot-protected.
- Page with "ignore all instructions" text does not change AI behaviour.
- Wrong webhook signature is rejected. Replayed payload creates one message.
- STOP, "stop sending" and "mat bhejo" all opt out the lead.
- Manual reply after window close is blocked.
- Kill switch stops sending while WF-04 is running.
- Use the Meta test number and a test Supabase project. Never test on real leads.

## Git and delivery
- Small commits. Clear messages: `feat: add consent gate to sender`.
- No secrets in Git. Add `.env` to `.gitignore`. Keep `.env.example` with names only.
- Update the md docs in the same commit as the code change.

## Definition of done
- Code works on staging with the test number.
- Tests above pass for the changed area.
- No secrets in code. No console logs with personal data.
- Docs updated (`schema.md`, `flow.md` or `api-specs.md` if they changed).
- Short note on what changed and what to test.

## Do NOT
- Do not send messages from the dashboard directly to WhatsApp.
- Do not scrape more than needed. Collect business info only.
- Do not add auto-reply to interested leads without the owner's written approval.
- Do not remove the opt-out line from templates.
- Do not raise the daily cap in code. Only the owner changes it in `settings`.
