# schema.md - Database Schema (Supabase / Postgres)

This is the full database for the B2B Lead Gen AI Agent. Supabase is the **single source of truth**. n8n keeps no memory of its own.

## Rules for this schema
- Run the blocks in order (A to G) in the Supabase SQL editor.
- `leads.place_id` and `leads.phone_e164` are unique. They stop duplicates.
- `messages.wa_message_id` is unique. It makes webhook replays safe.
- Lead status only moves forward. Triggers help with this.
- The WhatsApp 24-hour window is tracked in `conversations.window_expires_at`.
- `settings` holds the kill switch, daily cap, auto-send flag and model names.
- n8n uses the **service role key**. The dashboard uses only the **anon key** plus the owner login. Never put the service role key in browser code.

## Tables in one line each
| Table | Purpose |
|---|---|
| campaigns | One search (niche + city), for example "dental clinic, Mumbai" |
| leads | One row per business. Contact, status, consent, score, follow-up time |
| website_audits | Website health check and the AI critic findings |
| conversations | One chat per lead. Holds the 24h window and unread count |
| messages | Every inbound and outbound message with status and cost |
| templates | WhatsApp templates and their Meta approval status |
| lead_events | Audit trail of everything that happened to a lead |
| settings | Key-value config read by n8n |
| error_log | Failures from any workflow |

## Lead status flow
`new` -> `enriched` -> `drafted` -> `review` -> `queued` -> `sent` -> `delivered` -> `read` -> `replied` -> `interested` -> `meeting_booked` -> `won`

Side exits: `invalid`, `failed`, `not_interested`, `opted_out`, `lost`.

## SQL

### Block A: types (enums)

```sql
create extension if not exists pgcrypto;

create type lead_status as enum (
  'new','invalid','enriched','drafted','review','queued','sent',
  'delivered','read','replied','interested','not_interested',
  'opted_out','meeting_booked','won','lost','failed'
);
create type lead_type as enum ('has_website_ok','has_website_broken','no_website','unknown');
create type consent_status as enum ('unknown','pending','confirmed','revoked');
create type msg_direction as enum ('outbound','inbound');
create type msg_status as enum ('queued','sent','delivered','read','failed','received');
create type msg_kind as enum ('template','text','media','system_note');
create type sender_kind as enum ('ai','human','lead','system');
```

### Block B: core tables

```sql
create table campaigns (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  search_query  text not null,          -- e.g. 'dental clinic'
  city          text not null,          -- e.g. 'Mumbai, India'
  max_places    int  not null default 50,
  active        boolean not null default true,
  last_run_at   timestamptz,
  created_at    timestamptz not null default now()
);

create table leads (
  id                   uuid primary key default gen_random_uuid(),
  campaign_id          uuid references campaigns(id) on delete set null,
  place_id             text unique not null,       -- Google Maps place id (dedupe key)
  business_name        text not null,
  category             text,
  address              text,
  city                 text,
  phone_raw            text,
  phone_e164           text unique,                -- +919876543210 format, null if invalid
  phone_is_mobile      boolean,
  website_url          text,
  google_maps_url      text,
  google_rating        numeric(2,1),
  google_reviews_count int,
  lead_type            lead_type not null default 'unknown',
  status               lead_status not null default 'new',
  consent_status       consent_status not null default 'unknown',
  consent_source       text,                       -- 'click_to_whatsapp','web_form','email_reply','call', ...
  consent_at           timestamptz,
  opted_out            boolean not null default false,
  opted_out_at         timestamptz,
  score                int,                        -- 0-100 lead priority from AI
  pitch_angle          text,                       -- main angle used in the pitch
  follow_up_count      int not null default 0,
  next_follow_up_at    timestamptz,
  assigned_to          uuid,                       -- auth.users id of the owner
  notes                text,
  raw                  jsonb,                      -- full Apify item for debugging
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index leads_status_idx    on leads(status);
create index leads_followup_idx  on leads(next_follow_up_at) where next_follow_up_at is not null;
create index leads_campaign_idx  on leads(campaign_id);

create table website_audits (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid not null references leads(id) on delete cascade,
  checked_at        timestamptz not null default now(),
  url_checked       text,
  final_url         text,
  http_status       int,
  load_ms           int,
  site_state        text not null,        -- ok | broken | empty | blocked | none
  pages             jsonb,                -- list of pages crawled: homepage, about, services
  content_text      text,                 -- cleaned markdown text (trimmed)
  has_ssl           boolean,
  pagespeed_mobile  int,                  -- 0-100 from PageSpeed Insights, optional
  findings          jsonb,                -- AI critic output (see Part 6)
  model_used        text,
  created_at        timestamptz not null default now()
);
create index audits_lead_idx on website_audits(lead_id);
```

### Block C: conversations, messages, templates

```sql
create table conversations (
  id                   uuid primary key default gen_random_uuid(),
  lead_id              uuid not null unique references leads(id) on delete cascade,
  state                text not null default 'open',      -- open | closed
  window_expires_at    timestamptz,    -- last inbound message time + 24 hours
  unread_count         int not null default 0,
  last_message_at      timestamptz,
  last_message_preview text,
  created_at           timestamptz not null default now()
);
create index conv_last_msg_idx on conversations(last_message_at desc);

create table templates (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,        -- must match the name in Meta
  language    text not null default 'en',
  category    text not null,               -- marketing | utility | authentication
  body        text not null,
  variables   jsonb,                       -- list of variable names in order
  wa_status   text not null default 'draft', -- draft | pending | approved | rejected
  created_at  timestamptz not null default now()
);

create table messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references conversations(id) on delete cascade,
  lead_id           uuid not null references leads(id) on delete cascade,
  direction         msg_direction not null,
  kind              msg_kind not null default 'text',
  sender            sender_kind not null,
  template_id       uuid references templates(id),
  body              text,
  media_url         text,
  wa_message_id     text unique,           -- wamid from WhatsApp, dedupe key
  status            msg_status not null default 'queued',
  error_code        text,
  error_detail      text,
  is_ai_draft       boolean not null default false,
  approved_by       uuid,
  approved_at       timestamptz,
  cost_inr          numeric(8,4) default 0,
  created_at        timestamptz not null default now(),
  sent_at           timestamptz,
  delivered_at      timestamptz,
  read_at           timestamptz
);
create index messages_conv_idx   on messages(conversation_id, created_at);
create index messages_lead_idx   on messages(lead_id);
create index messages_status_idx on messages(status);
```

### Block D: events, settings, errors

```sql
create table lead_events (
  id          bigint generated always as identity primary key,
  lead_id     uuid not null references leads(id) on delete cascade,
  event_type  text not null,
  payload     jsonb,
  created_at  timestamptz not null default now()
);
create index events_lead_idx on lead_events(lead_id, created_at desc);

create table settings (
  key    text primary key,
  value  jsonb not null
);
insert into settings(key, value) values
  ('sending_enabled', 'false'),            -- master kill switch
  ('auto_send',       'false'),            -- false = every message needs human approval
  ('daily_cap',       '20'),               -- max first messages per day
  ('send_hour_start', '10'),               -- IST hours when sending is allowed
  ('send_hour_end',   '18'),
  ('model_analysis',  '"gemini-2.5-flash"'),
  ('model_classify',  '"gemini-2.5-flash-lite"'),
  ('require_consent', 'true');             -- Consent Gate (keep true)

create table error_log (
  id          bigint generated always as identity primary key,
  workflow    text,
  node        text,
  lead_id     uuid,
  message     text,
  payload     jsonb,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);
```

### Block E: triggers and helper functions

```sql
-- 1) keep updated_at fresh
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
create trigger leads_updated before update on leads
  for each row execute function set_updated_at();

-- 2) when a message arrives or is sent, refresh the conversation row
create or replace function bump_conversation() returns trigger as $$
begin
  update conversations set
    last_message_at      = new.created_at,
    last_message_preview = left(coalesce(new.body, '[media]'), 120),
    unread_count         = case when new.direction = 'inbound'
                                then unread_count + 1 else unread_count end,
    window_expires_at    = case when new.direction = 'inbound'
                                then new.created_at + interval '24 hours'
                                else window_expires_at end
  where id = new.conversation_id;
  return new;
end; $$ language plpgsql;
create trigger messages_bump after insert on messages
  for each row execute function bump_conversation();

-- 3) push delivery status up to the lead (only moves forward)
create or replace function sync_lead_status() returns trigger as $$
begin
  if new.direction = 'outbound' and new.status in ('sent','delivered','read') then
    update leads set status = new.status::text::lead_status
    where id = new.lead_id
      and status in ('queued','sent','delivered');
  end if;
  return new;
end; $$ language plpgsql;
create trigger messages_status_sync after update of status on messages
  for each row execute function sync_lead_status();

-- 4) claim a batch of leads safely (no two workflows grab the same lead)
create or replace function claim_leads(p_status lead_status, p_limit int)
returns setof leads as $$
  select * from leads
  where status = p_status and opted_out = false
  order by created_at
  limit p_limit
  for update skip locked;
$$ language sql;
```

### Block F: views for the dashboard

```sql
create view v_inbox as
select c.id as conversation_id, c.unread_count, c.last_message_at,
       c.last_message_preview, c.window_expires_at,
       (c.window_expires_at is not null and c.window_expires_at > now()) as window_open,
       l.id as lead_id, l.business_name, l.phone_e164, l.status, l.lead_type, l.score
from conversations c join leads l on l.id = c.lead_id;

create view v_funnel as
select status, count(*) as total from leads group by status;

create view v_daily_stats as
select date_trunc('day', created_at) as day,
       count(*) filter (where direction='outbound') as sent,
       count(*) filter (where status='delivered' or status='read') as delivered,
       count(*) filter (where status='read') as read,
       count(*) filter (where direction='inbound') as replies,
       count(*) filter (where status='failed') as failed,
       sum(cost_inr) as cost_inr
from messages group by 1 order by 1 desc;
```

### Block G: security and realtime

```sql
alter table campaigns       enable row level security;
alter table leads           enable row level security;
alter table website_audits  enable row level security;
alter table conversations   enable row level security;
alter table messages        enable row level security;
alter table templates       enable row level security;
alter table lead_events     enable row level security;
alter table settings        enable row level security;
alter table error_log       enable row level security;

-- Single-owner agency: any logged-in user may read and write.
-- (If you add team members later, tighten this with an owner column.)
do $$
declare t text;
begin
  foreach t in array array['campaigns','leads','website_audits','conversations',
    'messages','templates','lead_events','settings','error_log']
  loop
    execute format('create policy "auth_all_%1$s" on %1$I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Realtime for the inbox
alter publication supabase_realtime add table messages, conversations, leads;
```

## Notes
- To claim leads safely, use one query that picks and updates in a single step. Example: `update leads set status='enriched' where id in (select id from leads where status='new' limit 10 for update skip locked) returning *;`
- If you add more team members later, tighten the RLS policies with an owner column.
- If you add a second channel (email, call), add a `channel` column to `messages`.
