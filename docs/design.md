# design.md - CRM Dashboard Design

Design spec for the CRM dashboard of the B2B Lead Gen AI Agent. Read it with `product.md`, `flow.md` and `coding-rules.md`. Stack: React + Tailwind + Supabase JS. Use CSS for motion. Use GSAP only where noted.

## 1. Who uses it and what it must do
- **User:** Aryan, a solo owner. Often works late at night and on his phone.
- **Main jobs, in order:**
  1. See what the agent did overnight and what needs me now.
  2. Approve or fix AI drafts quickly (first 50 to 100 messages are human-approved).
  3. Read replies and answer inside the 24-hour window.
  4. Keep the system safe: kill switch, daily cap, consent.
- **Feeling:** a calm, tactile control room. Not a busy SaaS panel.

## 2. Design idea: "Night Shift, Clay"
The agent works while the owner sleeps. The UI is built around that story:
- The first screen is **Night Run**: a short report of what happened overnight and what waits for the owner.
- Status is shown as soft, pressable **clay pebbles**. Each lifecycle step has its own colour, so the pipeline can be read at a glance.
- Reading surfaces (chat, tables, forms) stay **flat and quiet**. Clay depth is used **only** on things you touch or that carry status. This is the one bold choice. Everything else is disciplined.

### Review against common defaults (what we avoided)
| Default look | What we do instead |
|---|---|
| Cream background with serif and terracotta accent | Cool lavender-grey base, no serif, no terracotta |
| Near-black with one acid accent | Dark mode is deep indigo with several meaningful status colours |
| Identical rounded cards with the same grey shadow | Different radii by role. Flat reading panels. Clay only on touchable or status items |
| Gradient washes, ALL-CAPS eyebrow labels, dot-joined meta strings, arrows on buttons | None of these. Sentence case, plain labels |
| Clay or neumorphism on everything | Rejected. It hurts reading and density. Used only on pebbles, buttons, switches |

## 3. Colour tokens
Light mode is "Dusk". Dark mode is "Night". Default follows the system setting. Add a manual toggle in Settings.

| Token | Dusk (light) | Night (dark) | Use |
|---|---|---|---|
| `--bg` | `#E6E2EE` | `#15132B` | App background (putty lavender) |
| `--surface` | `#F4F1F9` | `#1F1C3A` | Panels, chat area, tables (flat) |
| `--surface-raised` | `#FFFFFF` | `#2A2650` | Clay buttons, pebbles, inputs |
| `--ink` | `#1E1B3A` | `#ECE9FA` | Main text |
| `--ink-soft` | `#5B5778` | `#A9A4CC` | Secondary text |
| `--line` | `#D3CDE3` | `#37325F` | Hairline dividers |
| `--primary` | `#6D5BD0` | `#9A8CFF` | Main action, links, selected item |
| `--attention` | `#F2B544` | `#F2B544` | Needs the owner (drafts in review) |
| `--ok` | `#2FA39A` | `#4CC9BE` | Read, healthy, confirmed consent |
| `--danger` | `#E0605A` | `#FF8A84` | Failed, opted out, kill switch |

Text on `--attention` is always `#1E1B3A`. Check contrast: normal text 4.5:1 or more, large text 3:1 or more.

### Lead status pebbles
Colour is never the only signal. Every pebble has a small icon and a text label.

| Status | Pebble colour | Icon |
|---|---|---|
| new, enriched | `--ink-soft` on `--surface-raised` | dot |
| drafted, review | `--attention` | pencil |
| queued | lilac `#B9AEF0` | clock |
| sent, delivered | slate-blue `#7C8DB8` | single / double tick |
| read | `--ok` | double tick |
| replied, interested | `--primary` | chat |
| meeting_booked, won | deep teal `#1F7F78` | check |
| failed, opted_out, lost | `--danger` | exclamation / stop |

## 4. Typography
Two families, clearly different.

| Role | Font | Notes |
|---|---|---|
| Headings and big numbers | **Bricolage Grotesque** (variable) | Weights 600 to 800. Slightly tight spacing on large sizes |
| UI and body | **Hanken Grotesk** | Weights 400, 500, 600. Turn on `tabular-nums` for counts, money and times |
| Hindi text in chats | Noto Sans Devanagari (fallback) | Hinglish is mostly Roman script. Fallback keeps Hindi readable |

Load fonts with `font-display: swap`.

Scale (rem on a 16px base):
| Step | Size / line height | Use |
|---|---|---|
| display | 2.5 / 1.1 | Night Run numbers |
| h1 | 1.75 / 1.2 | Page title |
| h2 | 1.25 / 1.3 | Panel title |
| body | 0.9375 / 1.5 | Default |
| small | 0.8125 / 1.4 | Timestamps, helper text |

Rules:
- Line length under 75 characters in chat bubbles and drafts.
- Sentence case everywhere. No ALL-CAPS labels. No small label above every heading.
- Phone numbers, `wamid` and IDs use `ui-monospace` only when shown as copyable values.

## 5. Shape, depth and spacing
- **Spacing:** 4px base. Use 4, 8, 12, 16, 24, 32, 48.
- **Radius by role (not one radius):** pebbles = full pill, controls = 12px, flat panels = 16px, sheets and dialogs = 28px.
- **Flat surfaces** (chat, tables, forms): no shadow. Separate with `--line` and spacing.
- **Clay recipe** (buttons, pebbles, switches, selected conversation):
```css
/* Dusk */
box-shadow:
  8px 8px 20px rgba(120, 108, 160, .28),
  -6px -6px 16px rgba(255, 255, 255, .85),
  inset 0 1px 0 rgba(255, 255, 255, .9);
/* Night */
box-shadow:
  8px 8px 20px rgba(5, 4, 20, .55),
  -4px -4px 14px rgba(70, 64, 130, .35),
  inset 0 1px 0 rgba(255, 255, 255, .08);
/* Pressed: swap outer shadow for inset, move 1px down */
```
- Use clay on at most 3 kinds of element per screen.

## 6. Layout
### Desktop (1200px and wider)
```
+------+------------------------+-----------------------------+---------------------+
| Nav  | Conversation list      | Chat thread                 | Lead panel          |
|      | search, filters        | window banner               | business, rating    |
| icons| unread, pebble, time   | bubbles with ticks          | website audit       |
|      |                        | reply box / template picker | notes, consent      |
+------+------------------------+-----------------------------+---------------------+
```
- Nav is a slim icon rail, expands on hover.
- Lists are left-aligned. Numbers are right-aligned in tables.
- The lead panel can collapse.

### Mobile (under 768px)
- Bottom nav with 5 items: Night Run, Inbox, Approve, Pipeline, More.
- Inbox shows the list first. Tapping opens the thread full screen with a back button.
- The reply box sticks above the keyboard. Touch targets are 44px or larger.
- The lead panel opens as a bottom sheet.

## 7. Screens
### 7.1 Night Run (home)
Purpose: the morning (or midnight) report.
- Top line in plain words: "While you were away: 38 leads found, 31 drafted, 9 waiting for you."
- **Needs you now** list, in this order: unanswered replies, drafts in review, failed sends, errors.
- Row of 5 big numbers: found, drafted, sent, replied, failed. Compare with the same day last week.
- Health strip: Meta quality rating, delivery rate, opt-out rate, today's cap used (e.g. 12 of 20).
- Last run times for WF-01 to WF-03 in a small table.
- Empty state: "Nothing needs you. The next run starts at 10:00 pm."

**The one orchestrated motion:** on the first open of the day, the five numbers count up and settle (600ms, ease-out). Never repeat it on later opens.

### 7.2 Inbox
- List sorted by latest message. Unread count badge, status pebble, last message preview, time.
- Filters: All, Unread, Window open, Interested, Failed.
- Thread: bubbles on `--surface`. Inbound = left, outbound = right.
  - Human messages use `--primary`. AI-drafted messages that the owner approved use a slightly lighter tint with the label "AI draft, approved".
  - Each outbound bubble shows ticks and time. Failed shows a red mark and a Retry button.
- **Window banner** under the thread header: "Window open for 6h 12m" or "Window closed. Send a template to reopen." When closed, the text box is disabled and the template picker shows.
- Reply box: Enter sends, Shift+Enter adds a new line. A "Use AI reply" button fills the box with `reply_draft` so the owner can edit it.
- Lead panel: business name, category, city, rating, website (open link), audit findings (top 3 with evidence), score, consent status with source and date, notes, status pebble menu.

### 7.3 Approval queue
- Focus mode: one draft at a time, two columns.
  - Left: the final message as a WhatsApp-style bubble.
  - Right: **Evidence** (the critic's flaws with the quote or measured fact), website health, and lead score.
- Actions: Approve, Edit, Reject. Keyboard: `A`, `E`, `R`. After an action, the next draft slides in (160ms).
- Approve is disabled if `consent_status` is not `confirmed`, with the text: "Consent missing. This lead stays in the queue until consent is confirmed." The owner can still approve the text. The sender enforces the Consent Gate.
- Progress text: "6 of 9 reviewed".

### 7.4 Pipeline
- Kanban columns: Sent, Replied, Interested, Meeting booked, Won, Lost.
- Cards are flat. The status pebble is clay.
- Drag to change status. Show a toast with Undo for 6 seconds.
- Mobile: columns become a horizontal swipe list with a column picker.

### 7.5 Leads table
- Columns: business, city, category, phone, lead type, score, status, consent, last activity.
- Filters: campaign, status, lead type, consent, score range.
- Bulk actions: set consent, add note, export CSV. Bulk consent needs a confirm dialog that states the consent source.
- Dense rows (40px). Sticky header. Numbers use tabular figures.

### 7.6 Campaigns
- Cards or rows with: name, search query, city, active switch, last run, leads found, reply rate.
- Create or edit form: niche, city, max places (default 40).

### 7.7 Templates
- Name, category, language, approval status pebble, body preview with variables highlighted.
- "Copy text" button. Status comes from Meta. The owner updates it by hand at first.

### 7.8 Analytics
- Funnel: found, sent, delivered, read, replied, interested, won.
- Reply rate per campaign. Cost per reply in INR. Failure and opt-out rate over time.
- Charts: simple bars and lines. Use the pebble colours. Add a data table view for each chart. Direct labels instead of legends where possible.

### 7.9 Settings
- **Sending switch** (kill switch). See 8.4.
- Auto-send (off by default), daily cap, send hours, require consent (on, locked with a warning if turned off), model names, alert channel, theme.
- Show a banner at the top when sending is off: "Sending is off. Nothing will leave."

## 8. Key components
### 8.1 StatusPebble
Pill with icon and label. Clay depth. Sizes: sm (list rows), md (headers). Pressing opens the status menu where the owner can change status.

### 8.2 Ticks
| State | Look |
|---|---|
| queued | clock, `--ink-soft` |
| sent | one tick, `--ink-soft` |
| delivered | two ticks, `--ink-soft` |
| read | two ticks, `--ok` |
| failed | `--danger` exclamation, error text on press |

The tick change animates once: a 120ms colour shift. This answers a real change.

### 8.3 EvidenceCard
Shows one flaw: short name, the quote or number that proves it, severity (1 to 5 as filled dots), and "our fix" in one line. No flaw is shown without evidence.

### 8.4 Sending switch (kill switch)
- A large clay switch on Settings, and a small status chip in the top bar on every screen.
- **Turning sending OFF:** one click. Takes effect at once.
- **Turning sending ON:** press and hold for 1 second. A dialog first shows: today's cap, send hours, how many messages are queued, and the Meta quality rating.
- If the circuit breaker turned sending off, show why: "Sending paused after 6 failed sends in 30 minutes. Check Failed in Inbox, then turn sending on."

### 8.5 WindowBanner
Three states: open (neutral), closing soon under 2h (`--attention`), closed (`--danger` tint). Always has text and an icon.

### 8.6 TemplatePicker
List of approved templates with variable fields. Shows a live preview of the final message and the cost: "Marketing message, about Rs 1.02 with GST."

### 8.7 Toasts and dialogs
- Toast: bottom centre on desktop, above the bottom nav on mobile. 5 seconds. Has Undo where possible.
- Dialogs are used only for risky actions: turn sending on, bulk consent, delete a lead's data.

## 9. Writing in the interface
- Sentence case. Plain verbs. Active voice. Say what happens.
- The same action keeps the same word everywhere. "Approve" gives a toast "Approved". "Send" gives "Sent".
- Errors say what happened and what to do. No apologies. No vague text.

| Situation | Text |
|---|---|
| Window closed | "The 24-hour window is closed. Send a template to start again." |
| Consent missing | "Consent missing. This lead stays in the queue until consent is confirmed." |
| Token expired | "WhatsApp token expired. Sending is paused. Add a new token in n8n credentials." |
| Send failed | "Not sent. WhatsApp says this number is not on WhatsApp (131026). Try email or a call." |
| Opted out | "This lead asked to stop. Messages are blocked." |
| Empty inbox | "No chats yet. Replies will appear here." |
| Empty approval queue | "Nothing to review. New drafts appear after the 1:00 am run." |
| Sending off | "Sending is off. Nothing will leave." |

## 10. Motion
- One orchestrated moment: Night Run number count-up, first open of the day.
- All other motion answers an action: clay press (80ms), tick change (120ms), next draft slide (160ms), drag and drop settle, toast in and out.
- No scroll reveals. No hover lifts on every card.
- Respect `prefers-reduced-motion`: turn off the count-up and slides. Keep colour changes.

## 11. Accessibility and quality floor
- Visible focus ring: 2px `--primary` with 2px offset on every interactive item.
- Full keyboard use: inbox list with arrow keys, `A` `E` `R` in the queue, `Esc` closes sheets.
- Status is never colour only. Charts have a table view.
- Touch targets 44px or larger. Layout works from 360px width.
- Time shown in IST, 12-hour format with am or pm. Relative time for under 24 hours.
- Light and dark must both pass contrast checks.

## 12. Tailwind setup (starter)
```js
// tailwind.config.js
export default {
  darkMode: ['class', '[data-theme="night"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', raised: 'var(--surface-raised)',
        ink: 'var(--ink)', 'ink-soft': 'var(--ink-soft)', line: 'var(--line)',
        primary: 'var(--primary)', attention: 'var(--attention)',
        ok: 'var(--ok)', danger: 'var(--danger)'
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui'],
        sans: ['"Hanken Grotesk"', '"Noto Sans Devanagari"', 'ui-sans-serif', 'system-ui']
      },
      borderRadius: { control: '12px', panel: '16px', sheet: '28px' },
      boxShadow: { clay: 'var(--clay)', 'clay-pressed': 'var(--clay-pressed)' }
    }
  }
}
```
Define all `--*` variables in `:root` (Dusk) and `[data-theme="night"]` (Night) from the tables above. Add `--clay` and `--clay-pressed` from section 5.

## 13. Build notes for the coding agent
1. Build the tokens and the `StatusPebble`, `Ticks`, `WindowBanner` and `EvidenceCard` components first. Test them in both themes.
2. Build Inbox next (list, thread, lead panel), then the Approval queue, then Night Run.
3. Use Supabase Realtime for `messages` and `conversations`. Update ticks and unread counts live.
4. Do not call WhatsApp from the browser. Use the n8n webhooks in `api-specs.md` section B.
5. Keep clay shadows off tables and the chat area. If a screen has clay on more than 3 kinds of element, remove some.
6. Use the exact copy in section 9. Do not invent new wording for errors.
7. Check each screen at 360px, 768px and 1280px before you call it done.
