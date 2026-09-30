# ⚡ Local Business Lead Engine

A simple, fast, local-first client acquisition and outreach tool built for website developers and digital agencies. Designed from the ground up to operate with **₹0/month recurring software/API costs**.

---

## 🎯 What Problem This Solves

### Your Previous Manual Workflow:
1. Search Google Maps manually.
2. Find promising local businesses.
3. Check whether they have a website.
4. Manually check reviews, rating, contact details, and website quality.
5. Copy phone/WhatsApp/email.
6. Manually draft a personalized sales pitch.
7. Send outreach through WhatsApp/email.
8. Remember to follow up later.
9. Build/show custom website demo.

### Your Streamlined Engine Workflow:
1. **Google Maps** → Find business and paste Maps link or raw text snippet.
2. **Instant Extraction** → Local parser auto-fills name, phone, rating, reviews, address, website.
3. **1-Click Website Analysis** → 15+ automated checks (HTTPS, mobile viewport, title, meta desc, H1, WhatsApp CTA, booking CTA, latency, broken links).
4. **55-Point Commercial Lead Score** → Priority A (44-55), Priority B (34-43), Priority C (0-33) with exact reasons.
5. **Personalized Outreach Pack** → Generates WhatsApp message, Email subject & body, Follow-up #1, Follow-up #2, and Sales Angle.
6. **1-Click Contacting** → `Open WhatsApp (Pre-filled)`, `Call`, `Email`, `Copy`.
7. **Cadence Task System** → Day 0 (Initial) → Day 3 (Follow-up #1) → Day 7 (Follow-up #2) → Stop.

---

## 💰 ₹0 Recurring Cost Guarantee

- ❌ **No Google Places API key required.**
- ❌ **No OpenAI / Claude / Gemini API keys required.**
- ❌ **No paid CRM subscription required.**
- ❌ **No paid email service required.**
- ❌ **No WhatsApp API or paid bot subscription required.**
- ❌ **No bulk scraping bots that risk IP bans.**
- ✅ **100% Free & Local-First.** Data stays in your local `data/` directory.

---

## 🚀 Beginner-Friendly Setup

### STEP 1: Install Node.js
Ensure you have **Node.js 20+** installed on your computer.
- Download from [nodejs.org](https://nodejs.org/) or check via terminal:
```bash
node -v
```

### STEP 2: Install Dependencies
Open your terminal in this project folder and run:
```bash
npm install
```

### STEP 3: Start the Application
Run the local development server:
```bash
npm run dev
```

### STEP 4: Open in Your Browser
Open your browser and navigate to:
```text
http://localhost:3000
```

---

## 🤖 AI Outreach Generation: Local Ollama vs Free Template Engine

The engine provides **two AI modes**, switchable automatically with zero configuration:

### 1. Built-in Free Template Engine (Default · 100% Offline)
- **Zero setup required.**
- Works immediately upon `npm run dev` with **no external software or internet required**.
- Deterministically generates high-converting, category-specific pitches for Dental Clinics, Cafes, Restaurants, Aesthetic Clinics, Salons, Gyms, Real Estate, and more.
- Tailors tone (Friendly, Professional, Premium, Very Short) and target (Receptionist, Owner, Manager, Marketing).
- Suggests category-specific website demo sections (e.g. Treatments, Implants, Doctor Bio, WhatsApp Booking for Dental; Menu, Roastery, Table Reservations for Cafe).

### 2. Local Ollama (Optional)
If you want dynamic AI text generation running 100% locally on your own computer:
1. Download and install [Ollama](https://ollama.com/).
2. Pull your preferred model (e.g. Qwen or Llama):
   ```bash
   ollama run qwen3:8b
   ```
3. Start the Lead Engine. The top status bar will automatically detect Ollama and display:
   `AI: Ollama (qwen3:8b) · Active`
4. If Ollama is ever stopped or uninstalled, the app automatically and silently falls back to the Built-in Template Engine without errors.

---

## 📋 What is Automated vs What Remains Manual

| Feature | Automated / Manual | Notes |
| :--- | :--- | :--- |
| **Business Discovery** | **Manual** (V1) | You search Google Maps (e.g., "dental clinics Dubai") and pick quality businesses. (Optional OpenStreetMap discovery tab included). |
| **Snippet & Link Parsing** | **Automated** | Paste a Google Maps text block or short URL; the parser extracts fields without guessing. |
| **Website Audit** | **Automated** | 15+ automated checks (reachable, HTTPS, mobile viewport, H1, title, meta desc, CTAs, latency). |
| **Commercial Lead Scoring** | **Automated** | 55-point formula with transparent, itemized scoring reasons. |
| **Pitch Generation** | **Automated** | WhatsApp, Email, Follow-up #1, Follow-up #2, and Sales Angle generated in seconds. |
| **Sending Outreach** | **Manual** | You click `Open WhatsApp` (opens `wa.me` with pre-filled message) or `Email`. Protects your phone number and reputation from spam bans. |
| **Follow-up Reminders** | **Automated** | Highlights overdue and due-today leads on the dashboard with 1-click status advancing. |
| **CRM Storage** | **Automated** | Auto-saves to local `data/leads.json` with full activity log. |
| **Data Backup / Export** | **Automated** | 1-click CSV export and JSON database restore. |

---

## 📊 55-Point Commercial Scoring System

The engine scores leads from **0 to 55** across 6 objective criteria:

1. **Website Need (0–10)**: 10 if no website; 6–9 if broken, non-mobile, or lacking CTAs; 2–4 if good.
2. **Business Growth Potential (0–10)**: Rewarded for multiple branches, active Instagram/social demand, broad services, hiring.
3. **Online Presence Gap (0–10)**: Measures the gap between high customer interest on Google/social and poor digital conversion funnels.
4. **Google Presence (0–10)**: Weighted score combining Google star rating (up to 6 pts) and review volume (up to 4 pts).
5. **Potential Revenue Impact (0–10)**: High-ticket niches (implants, veneers, aesthetics, luxury clinics) score 9–10; steady volume cafes/restaurants score 7–8.
6. **Ease of Contact (0–5)**: Direct WhatsApp (+2), phone (+2), email (+1), Instagram (+1), Maps (+1).

### Priority Categories:
- **Priority A (44–55 pts)**: High Opportunity — Primary outreach target.
- **Priority B (34–43 pts)**: Moderate Opportunity — Solid secondary target.
- **Priority C (0–33 pts)**: Low Opportunity — Niche or low-demand business.

---

## 🗄️ Database, Backup & Migration

All your data is saved locally in:
- `data/leads.json` — Lead pipeline records.
- `data/settings.json` — Your name, agency name, portfolio URL, and pitch defaults.
- `data/activities.json` — Audit trail of every action taken.

### Exporting & Moving to Another Laptop:
1. Click **📁 Import / Export** in the top navigation.
2. Click **💾 Backup Full Database (JSON)** or **📊 Export CSV**.
3. On your new computer, open the engine and click **📂 Select CSV or JSON Backup File**.
4. All your leads, notes, and activity history are restored instantly!

---

## ⚙️ Agency Settings & Custom Branding

Click **⚙️ Settings** in the top navigation to configure:
- **Your Name & Role** (e.g. Shiva, Frontend Developer)
- **Agency Name & Portfolio URL** (automatically included in email signatures and pitches)
- **Your WhatsApp & Email** (for client replies)
- **Default City & Category**
- **Default Pitch Tone** (Friendly, Professional, Premium, Very Short)
- **Ollama URL & Model Name** (with live connection test)

---

## 🛠️ Project Structure

```text
local-business-lead-engine/
├── app/
│   ├── api/
│   │   ├── analyze/          # Website analyzer & 55-point scoring
│   │   ├── discovery/        # Free OpenStreetMap Overpass discovery
│   │   ├── export/           # CSV & JSON export
│   │   ├── import/           # CSV & JSON restore
│   │   ├── leads/            # Leads CRUD & filtering
│   │   ├── leads/[id]/       # Individual lead details, update, delete
│   │   ├── ollama-status/    # Local Ollama ping & model list
│   │   ├── pitch/            # AI pitch generator with template fallback
│   │   ├── resolve-maps/     # Maps URL resolver & snippet parser
│   │   └── settings/         # Agency settings
│   ├── globals.css           # Clean SaaS design system
│   ├── layout.tsx            # App root layout
│   └── page.tsx              # Main dashboard
├── components/
│   ├── Navbar.tsx            # Top bar with AI status pill & actions
│   ├── StatsRow.tsx          # KPI cards & follow-up alerts
│   ├── LeadTable.tsx         # Responsive CRM table with direct action buttons
│   ├── AddLeadModal.tsx      # Add lead form & Google Maps text parser
│   ├── LeadDetailModal.tsx   # 6-tab dossier: Overview, Website, Score, Pitch, Follow-ups, Activity
│   ├── SettingsModal.tsx     # Branding & Ollama configuration
│   ├── ImportExportModal.tsx # CSV/JSON backup & restore
│   └── DiscoveryModal.tsx    # Optional free OpenStreetMap discovery
├── data/
│   ├── leads.json            # Local JSON database
│   ├── settings.json         # User settings
│   └── activities.json       # Audit trail
├── lib/
│   ├── analyze.ts            # Website analysis checks & 55-pt scoring logic
│   ├── csv.ts                # RFC-compliant CSV parser & generator
│   ├── db.ts                 # Database persistence & atomic backup logic
│   ├── parser.ts             # Google Maps copy-paste text block parser
│   ├── pitch.ts              # Deterministic template & local Ollama generator
│   └── types.ts              # Comprehensive TypeScript interfaces
├── package.json
└── tsconfig.json
```

---

## 🔒 Safe Outreach Principles Built In
- **No Insults**: The engine strictly forbids sentences like "your website is bad".
- **Receptionist-Friendly**: WhatsApp messages are drafted specifically so reception or staff can effortlessly forward them to the owner/manager.
- **Zero Commitment**: Always emphasizes that viewing the custom concept demo is **100% free with no payment or commitment**.
- **No Hallucinations**: When business data is unknown, it remains blank rather than inventing fictitious reviews or claims.
