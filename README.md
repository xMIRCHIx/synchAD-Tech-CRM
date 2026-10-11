# 🚀 SynchAD Tech CRM — Autonomous B2B Lead Gen & AI Outreach Engine

> **Next-generation Autonomous B2B Growth Engine:** Google Maps scraping, AI-powered website audit analysis, and official Meta WhatsApp Cloud API outreach with 1-tap customer conversion.

---

## 🌟 Key Features

### 1. 📍 Automated Google Maps Lead Generation (Apify Integration)
- Search any niche across Pan-India, custom metro cities, or global locations.
- Extracts verified business names, direct phone numbers, Google ratings, review counts, addresses, and website links.
- Automatic phone deduplication and lead enrichment into Supabase.

### 2. 🧠 AI Deep Website Audits (Firecrawl + Gemini AI)
- Automated website crawler analyzes site health, mobile responsiveness, and SEO.
- Pinpoints key business problems: *No Website*, *Broken Website*, *Outdated Design*, or *No SSL*.
- Generates high-converting tailored WhatsApp pitch messages with opportunity scores (60–98).

### 3. 💬 Official Meta WhatsApp Cloud API (v21.0) Integration
- Direct connection with official Meta Cloud API with permanent system user authentication.
- **Interactive WhatsApp Inbox:** 2-way real-time conversation threading with deliverability tracking.
- **Smart Message Dispatcher:** Automatically delivers custom pitches as direct texts or verified Meta marketing templates.
- **Real-Time Webhooks:** Captures incoming customer replies and automatically elevates hot leads to the top.

### 4. 🏢 WhatsApp Business Profile Manager
- Live 2-way synchronization with Meta WhatsApp Cloud API.
- Live preview card matching customer's real WhatsApp chat screen.
- Manage Business Description, Status/About, Categories (Verticals), Email, and Websites directly from CRM.

### 5. 📊 Pipeline & Analytics Dashboard
- Kanban-style leads pipeline (Review, Enriched, Sent, Replied, Won).
- Real-time performance metrics: Win Rate %, Total Outreaches, Campaign Matrix, and conversion timelines.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16.4 (App Router, Turbopack, React 19)
- **Database & Storage:** Supabase (PostgreSQL with Row Level Security)
- **WhatsApp API:** Official Meta WhatsApp Cloud API v21.0
- **AI Engine:** Google Gemini (Gemini 3.8 Flash)
- **Web Scraping & Crawling:** Apify (`compass~crawler-google-places`) & Firecrawl API
- **Styling & UI:** Tailwind CSS, Lucide Icons, Glassmorphism UI

---

## ⚡ Quickstart & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/xMIRCHIx/synchAD-Tech-CRM.git
cd synchAD-Tech-CRM
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your API keys:
```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public Anonymous Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Admin Service Role Key |
| `APIFY_API_TOKEN` | Apify API Token for Google Maps scraper |
| `FIRECRAWL_API_KEY` | Firecrawl API Key for website auditing |
| `GEMINI_API_KEY` | Google Gemini API Key for pitch generation |
| `WHATSAPP_ACCESS_TOKEN` | Meta System User Permanent Token |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Cloud API Phone Number ID |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta WhatsApp Business Account (WABA) ID |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Webhook verification secret (`synchad_crm_secret`) |

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment & Webhook Setup

### Deploy to Vercel
1. Import repository to [Vercel](https://vercel.com).
2. Add all environment variables from `.env.local` in project settings.
3. Deploy!

### Configure Meta WhatsApp Webhook
1. Go to **Meta Developer Portal** → Your App → **WhatsApp** → **Configuration / Webhooks**.
2. Set **Callback URL**: `https://<your-vercel-domain>/api/whatsapp/webhook`
3. Set **Verify Token**: `synchad_crm_secret`
4. Click **Verify and Save**.
5. Under **Webhook fields**, click **Subscribe** to `messages`.

---

## 📄 License
Private & Proprietary — Developed for **SynchAD Tech**.
