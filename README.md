# Uddhar — Lifted, Not Left Behind

**SIH 2026 · Problem Statement 26092**  
*AI-Driven Scheme Matching & Smart Health-Aware Channel Routing for Marginalized Entrepreneurs*

---

## What We Built

**Uddhar** (Sanskrit: *to lift up, to rescue*) is a full-stack web platform that solves a problem at the intersection of finance and public policy: every year, concessional NSFDC loans meant for Scheduled Caste entrepreneurs and students go unclaimed — not because people don't qualify, but because the system to navigate them was never built for them.

Uddhar provides three things nobody else does simultaneously:

| Step | What | Why it matters |
|---|---|---|
| **I. Recommend** | Deterministic scheme matching from income + project cost | Removes guesswork; fully auditable decision |
| **II. Calculate** | Real amortisation EMI before stepping into a bank | No surprises at the counter |
| **III. Route** | Nearest authorized partner filtered by NPA & utilisation health | Distance alone was never the right filter |

---

## Architecture Overview

```
Uddhar/
├── data/
│   ├── schemes.json              # NSFDC scheme rules (thresholds, rates, caps, moratorium)
│   ├── channel-partners.json     # 16 mock partners — 11 healthy, 5 deliberately unhealthy
│   └── translations/
│       ├── en.json               # English UI strings (complete)
│       ├── hi.json               # Hindi UI strings (complete)
│       └── ta.json               # Tamil UI strings (complete)
├── lib/
│   ├── ruleEngine.js             # PHASE 2 — pure deterministic scheme matching
│   ├── emiCalculator.js          # PHASE 2 — standard amortisation with moratorium
│   ├── partnerFilter.js          # PHASE 2 — NPA/utilisation gate + Haversine ranking
│   └── explainWithLLM.js         # PHASE 5 — isolated Gemini API explanation layer
├── components/
│   ├── ProfileForm.jsx           # Applicant input form
│   ├── SchemeResult.jsx          # Matched scheme card with LLM explanation
│   ├── EMITable.jsx              # Interactive EMI calculator + amortisation schedule
│   ├── PartnerMap.jsx            # Leaflet map + health-filtered ranked partner list
│   └── LanguageSwitcher.jsx      # EN / HI / TA language toggle
├── pages/
│   ├── _app.jsx                  # Global CSS injection
│   ├── index.jsx                 # Single-page stepwise application flow
│   └── api/
│       └── explain.js            # Server-side API route — LLM key never reaches browser
├── styles/
│   └── globals.css               # Design system: Fraunces + IBM Plex, dark theme
├── .env.local                    # ← NOT committed (API key lives here)
├── .gitignore                    # node_modules, .next, .env.local excluded
├── package.json
└── README.md
```

---

## Build Phases Completed

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Data layer — `schemes.json`, `channel-partners.json`, translations | ✅ Done |
| **Phase 2** | Core logic — `ruleEngine`, `emiCalculator`, `partnerFilter` (100% test pass) | ✅ Done |
| **Phase 3** | UI Shell — all 5 React components built | ✅ Done |
| **Phase 4** | Logic wired to UI — full end-to-end flow operational | ✅ Done |
| **Phase 5** | LLM Explanation Layer — Gemini API, server-side only, schema-validated | ✅ Done |
| **Phase 6** | Multilingual — all UI + LLM explanations in EN/HI/TA | ✅ Done |
| **Phase 7** | Polish, README, pre-filled demo profiles, loading states | ✅ Done |

---

## Core Features

### 1. Deterministic Rule Engine (`lib/ruleEngine.js`)
- Reads `data/schemes.json` — 3 NSFDC schemes with exact thresholds
- Matches: Micro Finance (≤₹1.4L), Term Loan (≤₹50L), Educational Loan
- Auto-reclassifies project type if cost exceeds tier boundary (e.g. a micro business with ₹3L cost → routes to Term Loan tier)
- Income gate: family income must be ≤₹5,00,000
- Returns a structured reason object — never just a string

### 2. EMI Calculator (`lib/emiCalculator.js`)
- Standard reducing-balance amortisation formula
- Moratorium period: simple interest accrues on principal during grace period, capitalised before repayment begins
- Interactive sliders for tenure (12–84 months) and moratorium (0–12 months)
- Collapsible full amortisation schedule (month-by-month principal / interest / balance)

### 3. Health-Aware Partner Filter (`lib/partnerFilter.js`)
- Two-stage gate: category match → NPA% threshold (default 8%) + utilisation% gate
- 5 partners deliberately have NPA > 10% (high risk) to demonstrate filtering in live demo
- Haversine great-circle distance ranking on surviving partners
- Toggle to reveal excluded partners (with red markers and explanatory tooltips)

### 4. LLM Explanation Layer (`lib/explainWithLLM.js` + `pages/api/explain.js`)
- Calls **Google Gemini 2.0 Flash** via server-side API route
- API key stored in `.env.local`, never sent to browser
- Strictly constrained prompt: LLM may only *rephrase* the rule engine output — it cannot change scheme name, rates, or amounts
- Response validation: if the LLM drops the correct scheme name, output is rejected and deterministic fallback is used
- Graceful fallback: if API key missing or call fails, a template-based explanation is returned automatically

### 5. Multilingual Interface (`data/translations/`)
- Three complete language packs: English, Hindi (हिंदी), Tamil (தமிழ்)
- Switching language instantly re-renders all static UI text
- Also triggers a fresh LLM API call to regenerate the scheme explanation in the new language
- All financial numbers remain locale-formatted with `en-IN` grouping (₹ format)

### 6. Leaflet Partner Map (`components/PartnerMap.jsx`)
- OpenStreetMap tiles — zero API key required
- Custom SVG div-icons: gold (user location), green ✓ (healthy partner), red ✕ (filtered out)
- Rich popups: partner name, type, NPA%, utilisation%, distance, route authorisation status
- Checkbox toggle to reveal/hide high-risk partners on map

---

## Demo Profiles (Pre-filled)

The application starts with a guaranteed-good demo profile for the live demonstration:

| Field | Value |
|---|---|
| Project Type | Micro Business / Shop / Artisan |
| Project Cost | ₹1,10,000 |
| Annual Income | ₹2,00,000 |
| Location | T. Nagar, Chennai |
| Expected Scheme Match | NSFDC Micro Finance Scheme |
| Expected EMI (36m) | ~₹3,400/month |

Change the project cost to `₹3,00,000` to see **auto-reclassification to Term Loan** in action.  
Change the income to `₹6,00,000` to see the **income gate rejection**.

---

## Step-by-Step Setup & Execution Guide

### Prerequisites

- **Node.js** v18 or higher (`node --version`)
- **npm** v9 or higher (`npm --version`)
- A **Google Gemini API key** (for the LLM explanation layer; the app works without it — the explanation falls back to a deterministic template)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/JEEVASANKARAN/Uddhar.git
cd Uddhar
```

---

### Step 2 — Install Dependencies

```bash
npm install
```

This installs: `next`, `react`, `react-dom`, `leaflet`, `lucide-react`.

---

### Step 3 — Configure the LLM API Key (Optional but Recommended)

Create a `.env.local` file in the project root:

```bash
touch .env.local
```

Add the following line to `.env.local`:

```env
LLM_API_KEY=your_gemini_api_key_here
```

> ⚠️ **Never commit `.env.local` to git.** It is already listed in `.gitignore`.  
> Without this key, the app still works fully — the LLM explanation box will show a deterministic template instead.

---

### Step 4 — Run the Development Server

```bash
npm run dev
```

The application will start at **[http://localhost:3000](http://localhost:3000)**.

Open your browser and navigate to that URL.

---

### Step 5 — Explore the Application

The page has the following sections (you can scroll or use the nav links):

1. **Hero** — Introduction and entry CTA
2. **Stats Strip** — Key problem statistics
3. **How It Works** — The three-step lift process
4. **Inside the Platform** (`#panel`) — The live interactive tool:
   - **Left Panel**: Enter project type, cost, income, and location → click **Recommend Scheme →**
   - After submission: see the matched scheme, LLM explanation, EMI breakdown with sliders
   - **Right Panel**: Leaflet map with health-filtered partner markers + ranked list
5. **Why Not myScheme** — Differentiator comparison table
6. **Footer** — CTA

---

### Step 6 — Switch Languages

Use the **language switcher** (top-right of the nav, or inside the panel header) to toggle between:

- `English` (EN)
- `हिंदी` (HI) — Hindi
- `தமிழ்` (TA) — Tamil

Switching language instantly translates all UI text and regenerates the LLM explanation in the selected language.

---

### Step 7 — Build for Production (Optional)

```bash
npm run build
npm run start
```

---

## Testing the Core Logic

To independently verify the deterministic logic functions without any UI:

```bash
node lib/test-phase2.mjs
```

This runs 26 test cases across all three `lib/` modules. Expected output:

```
✅ All 26 tests passed (26/26)
```

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| Deterministic logic first, LLM last | Logic errors hidden behind a UI cause demo disasters. Pure functions testable in isolation ensure reliability. |
| LLM explanation is server-side only | API key never reaches the browser. Response is validated against the scheme name before being shown. |
| OpenStreetMap + Leaflet (not Google Maps) | Zero API key friction. No billing surprises. Fully open. |
| Static JSON data layer | No database, no backend spin-up. Instant cold start for demo. |
| Vanilla CSS (not Tailwind utility classes) | Design tokens stored as CSS variables; consistent theming without purging or build-step issues. |

---

## NSFDC Scheme Reference

| Scheme | Max Project Cost | Income Limit | Interest Rate | Moratorium |
|---|---|---|---|---|
| Micro Finance (MF) | ₹1,40,000 | ₹3,00,000/year | 5%–7% p.a. | 3–6 months |
| Term Loan (TL) | ₹50,00,000 | ₹5,00,000/year | 6%–8% p.a. | 6–12 months |
| Educational Loan (EL) | ₹20,00,000 | ₹5,00,000/year | 4%–6% p.a. | 12–24 months |

---

## Environment Variables Reference

| Variable | Required | Purpose |
|---|---|---|
| `LLM_API_KEY` | Optional | Google Gemini API key for natural language explanation. Falls back to template if absent. |

---

## Project Team & Submission

- **Problem Statement:** SIH 2026 — PS 26092
- **Team:** [Your team name here]
- **Repository:** [https://github.com/JEEVASANKARAN/Uddhar](https://github.com/JEEVASANKARAN/Uddhar)
- **Tech Stack:** Next.js 14, React 18, Leaflet 1.9, Vanilla CSS, Google Gemini 2.0 Flash

---

## License

This project was built for Smart India Hackathon 2026. Educational and demonstration use only.
