# SIH26092 — Complete Structured Build Flow (for Antigravity)

**Goal:** Take the PRD from concept to a working, demoable prototype in a clean, dependency-ordered sequence — so nothing gets built before what it depends on.

---

## 0. Before You Start — Setup Checklist

- [ ] Upload `SIH26092_PRD.md` into Antigravity's memory/context (as you planned)
- [ ] Decide stack (recommended below) and state it explicitly in your first prompt so Antigravity doesn't guess
- [ ] Create the mock datasets **first**, by hand, before generating any code — the AI should build *around* your data, not invent its own inconsistent version

**Recommended stack (fast, demo-safe, Antigravity-friendly):**
- Frontend: **React (Next.js)** — single app, no separate backend needed for MVP
- Styling: **Tailwind CSS**
- Maps: **Leaflet + OpenStreetMap** (free, no API key friction — safer than Google Maps API for a 36-hour build)
- Data: **Static JSON files** (no database needed for MVP)
- Multilingual: **i18next** or simple JSON translation dictionaries per language
- "AI" explanation layer: a single LLM API call (OpenAI/Claude/Gemini — whichever you have a key for), isolated to one function only

---

## 1. Project Structure (tell Antigravity to scaffold exactly this)

```
sih26092-app/
├── data/
│   ├── schemes.json          # Scheme rules (thresholds, rates, caps, moratorium)
│   ├── channel-partners.json # Mock partner dataset (location, NPA%, utilization%)
│   └── translations/
│       ├── en.json
│       ├── hi.json
│       └── ta.json           # (or your 3rd chosen language)
├── lib/
│   ├── ruleEngine.js         # Scheme recommendation logic (pure function)
│   ├── emiCalculator.js      # EMI math (pure function)
│   ├── partnerFilter.js      # NPA/utilization filter + Haversine ranking
│   └── explainWithLLM.js     # Single isolated LLM call for phrasing
├── components/
│   ├── ProfileForm.jsx
│   ├── SchemeResult.jsx
│   ├── EMITable.jsx
│   ├── PartnerMap.jsx
│   └── LanguageSwitcher.jsx
├── pages/ (or app/ for App Router)
│   └── index.jsx             # Single-page flow, step-based
└── SIH26092_PRD.md           # Your reference doc, kept in repo root
```

**Why this order matters:** `lib/` functions are pure, testable, and have zero UI dependency — build and verify these FIRST in isolation before wiring any screen to them. This is the single biggest risk-reducer in a hackathon build: broken UI is visible and fixable live; broken logic hidden behind a pretty screen is what causes demo-day disasters.

---

## 2. Build Phases (Dependency-Ordered)

### Phase 1 — Data Layer (build this yourself, don't let AI invent it)
1. Write `schemes.json` — hardcode the 3 schemes with exact thresholds from the PRD:
   - Micro Finance: ≤₹1.4L, rate range, moratorium range
   - Term Loan: ≤₹50L, rate range, moratorium range
   - Educational Loan: rate range, moratorium range
2. Write `channel-partners.json` — 15-20 mock partners with:
   - name, type (SCA/PSB/RRB/NBFC-MFI), lat/long, categories served, NPA%, utilization%
   - **Deliberately include 4-5 "unhealthy" partners** (high NPA) near your demo location so the filtering is visibly proven on stage, not just theoretical

**Checkpoint:** You should be able to open these JSON files and manually trace through your own logic before any code touches them.

---

### Phase 2 — Core Logic (`lib/`)
Prompt Antigravity phase-by-phase, not all at once:

1. **`ruleEngine.js`** — "Write a pure function `recommendScheme(income, projectCost, projectType, educationStatus)` that reads `schemes.json` and returns the matching scheme object + a structured reason (not a sentence, just the data: matched field, threshold, value)."
2. **`emiCalculator.js`** — "Write a pure function `calculateEMI(loanAmount, interestRate, tenureMonths, moratoriumMonths)` using standard amortization formula, returning monthly EMI and total repayment."
3. **`partnerFilter.js`** — "Write a pure function `findEligiblePartners(userLat, userLng, loanCategory, npaThreshold)` that filters `channel-partners.json` by category + NPA/utilization threshold, then ranks remaining partners by Haversine distance."

**Checkpoint — do this before touching UI:** Test each function directly (console.log or a simple test script) with 2-3 sample inputs. Confirm outputs match your hand-calculated expectations from Phase 1. This is non-negotiable — it's the difference between a demo that works and one that breaks on stage.

---

### Phase 3 — UI Shell (no logic yet, just structure)
1. `ProfileForm.jsx` — input fields for project type, cost, income, education status
2. `SchemeResult.jsx` — displays recommended scheme (static/dummy data first)
3. `EMITable.jsx` — displays EMI breakdown (static/dummy data first)
4. `PartnerMap.jsx` — Leaflet map with hardcoded pins (no filtering logic yet)

**Checkpoint:** Click through all screens with fake/hardcoded data. Confirm the *flow* feels right before wiring real logic in.

---

### Phase 4 — Wire Logic to UI
1. Connect `ProfileForm` submit → `ruleEngine.js` → `SchemeResult`
2. Connect scheme result → `emiCalculator.js` → `EMITable`
3. Connect "Find Partner" button → `partnerFilter.js` → `PartnerMap` (now showing real filtered/ranked pins)

**Checkpoint:** Full end-to-end run — enter a profile, see a real scheme match, real EMI numbers, real filtered map. This is your MVP. Everything after this is polish.

---

### Phase 5 — LLM Explanation Layer (add last, isolated)
1. `explainWithLLM.js` — one function: takes the structured rule-engine output (from Phase 2) and calls an LLM API to phrase it naturally, in the selected language.
2. **Critical:** this function should NEVER be able to change the scheme/EMI numbers — it only rephrases what the rule engine already decided. Keep this boundary strict so a bad LLM response can never show wrong financial data.

**Checkpoint:** Confirm the LLM output always matches the underlying data — if the rule engine says Micro Finance, the LLM sentence must also say Micro Finance, every time.

---

### Phase 6 — Multilingual Layer
1. Add `translations/en.json`, `hi.json`, `ta.json` for static UI text (labels, buttons)
2. Pass selected language into `explainWithLLM.js` so generated explanations also come out in that language
3. Add `LanguageSwitcher.jsx` to toggle

**Checkpoint:** Switch languages mid-flow, confirm both static text AND dynamic LLM explanations update correctly.

---

### Phase 7 — Polish for Demo
1. Highlight the "recommended" (nearest healthy) partner distinctly on the map
2. Add subtle loading states between steps (feels more "real" on camera)
3. Pre-fill one guaranteed-good demo profile as a fallback in case live typing goes wrong during recording
4. Do a full dry-run screen recording before your final take

---

## 3. What to Explicitly Tell Antigravity in Your First Prompt

Paste something like this as your opening instruction, with the PRD attached:

> "Read the attached PRD. We're building a Next.js + Tailwind + Leaflet web app implementing the workflow in Section 8 and components in Section 9 of the PRD. Follow the phase order I give you — do not generate UI before I've approved the core logic functions in `lib/`. Keep scheme/EMI/partner-filtering logic fully deterministic (no LLM involvement) — the LLM is only used in a separate, isolated explanation function, described in Phase 5. Start with Phase 1 data files only."

This forces Antigravity to build in the same dependency-safe order instead of generating a flashy UI first and leaving your core logic as an afterthought (the #1 cause of hackathon prototypes that look good but don't actually work when clicked live).

---

## 4. Time-Box Guide (adapt to your actual hours remaining)

| Phase | Est. Time |
|---|---|
| 1 — Data Layer | 10-15% of total time |
| 2 — Core Logic | 20-25% |
| 3 — UI Shell | 15% |
| 4 — Wire Logic to UI | 20% |
| 5 — LLM Explanation | 10% |
| 6 — Multilingual | 10% |
| 7 — Polish for Demo | remaining buffer |

**Golden rule:** Phases 1-4 must be rock solid before you spend a single minute on Phase 5-7. A working, ugly MVP beats a beautiful, broken one — always.
