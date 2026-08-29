# Product Requirements Document (PRD)
## SIH 2026 — PS 26092: AI-Driven Scheme Matching & Smart Channel Routing for Marginalized Entrepreneurs

**Ministry:** Social Justice & Empowerment (MoSJE — *Ministry of Social Justice and Empowerment*) | **Category:** Software | **PS Number:** SIH26092

---

## 0. Glossary — Every Acronym Explained (Read This First)

| Acronym | Full Form | What It Actually Means (Plain English) |
|---|---|---|
| **SC** | Scheduled Caste | A constitutionally recognized group in India that is historically socio-economically disadvantaged. The government runs special concessional (discounted/subsidized) financial schemes for this group. |
| **NSFDC** | National Scheduled Castes Finance and Development Corporation | The central government body that owns and runs this concessional loan scheme. It does not lend money directly — it works through "Channel Partners" (explained below). |
| **SCA** | State Channelizing Agency | A state-government-owned financial agency (one per state, roughly) that NSFDC uses to disburse loans to SC beneficiaries within that state. Think of it as the state's official middleman for this scheme. |
| **PSB** | Public Sector Bank | A regular government-owned commercial bank (e.g., State Bank of India, Punjab National Bank) that also participates as a Channel Partner to disburse these concessional loans. |
| **RRB** | Regional Rural Bank | A smaller, government-sponsored bank that specifically serves rural areas — often the closest formal bank branch for people in villages/small towns, so it's an important Channel Partner for reach. |
| **NBFC-MFI** | Non-Banking Financial Company – Micro Finance Institution | A financial company that is NOT a bank (doesn't take deposits like a bank does) but is licensed to give out small loans, typically to low-income borrowers. Many operate in areas banks don't reach. |
| **Channel Partner** | — (umbrella term) | Any one of the four types above (SCA / PSB / RRB / NBFC-MFI). Collectively, these ~100+ organizations are the ONLY entities allowed to actually hand out NSFDC loan money to a citizen. NSFDC itself never deals with the applicant directly. |
| **Channel Finance System** | — | The overall process/network by which NSFDC's funds flow: NSFDC → Channel Partner → Applicant. Our platform helps applicants navigate this system correctly the first time. |
| **NPA** | Non-Performing Asset | A loan that has stopped being repaid by its borrower (i.e., the borrower has defaulted). A Channel Partner with a **high NPA rate** has a lot of bad/defaulted loans on its books — this often means the partner is financially stressed, slower, or more cautious/reluctant to disburse new loans. |
| **Fund Utilization / Overdue** | — | Refers to how much of the money NSFDC already allocated to a Channel Partner has actually been disbursed vs. sitting unused, and whether that partner has any overdue (late) obligations back to NSFDC. A partner with poor utilization or overdues is a bad candidate to route a new applicant to — they may be slow, stuck in paperwork backlogs, or temporarily restricted from getting fresh funds. |
| **EMI** | Equated Monthly Installment | The fixed monthly payment amount a borrower pays back on a loan, calculated from the loan amount, interest rate, and repayment period. |
| **Moratorium Period** | — | A grace period after taking a loan during which the borrower does NOT have to start repaying yet (e.g., a student loan might not require repayment until studies finish). Ranges from 3–12 months in this scheme. |
| **Micro Finance Scheme** | — | The smallest loan category in this scheme — for small business projects costing up to ₹1.40 Lakh. |
| **Term Loan** | — | The larger loan category — for bigger business projects, up to ₹50.00 Lakh. |
| **Educational Loan Scheme** | — | A separate loan category specifically to fund education costs (tuition, etc.) for SC students. |
| **Lakh** | — | An Indian numbering unit. 1 Lakh = 100,000 (so ₹5.00 Lakh = ₹500,000). |
| **PRD** | Product Requirements Document | This document — a structured spec explaining what we're building, why, and how. |
| **RAG** | Retrieval-Augmented Generation | An AI technique where a language model looks up real documents/data before answering, instead of relying purely on memorized knowledge — used elsewhere in AI to reduce made-up (hallucinated) answers. (Referenced later for context, not core to this build.) |
| **LLM** | Large Language Model | The type of AI model (like GPT-style models) used in this project ONLY to phrase explanations in natural, multilingual language — never used to make the actual eligibility or financial decisions. |
| **MVP** | Minimum Viable Product | The smallest working version of the product that still demonstrates the full core value — what we aim to build within the hackathon's time limit. |
| **Haversine Distance** | — | A standard mathematical formula used to calculate the straight-line distance between two GPS coordinates (latitude/longitude) on Earth's curved surface — used here to rank Channel Partners by how close they are to the applicant. |

---

## 1. Problem Statement

Scheduled Caste (SC) beneficiaries with annual family income up to ₹5.00 Lakhs are eligible for concessional (discounted-rate) credit — up to 90% of their project or education cost financed, at 6.5%–8% interest. But they **cannot apply for this loan directly**. Every rupee must pass through one of the ~100+ **Channel Partners** — the SCAs, PSBs, RRBs, and NBFC-MFIs defined in the glossary above.

Applicants face three compounding failures:

1. **Scheme confusion** — They can't tell which of the three loan types fits their situation:
   - **Micro Finance Scheme** — small projects, up to ₹1.40 lakh
   - **Term Loan** — larger projects, up to ₹50.00 lakh
   - **Educational Loan Scheme** — for education costs
2. **Partner discovery failure** — They can't locate which nearby Channel Partner (SCA, PSB, RRB, or NBFC-MFI) is actually authorized to process their specific loan category.
3. **Blind routing** — Even if they find *a* partner, there's no way to know if that partner is financially healthy — i.e., has a low **NPA** rate and good **fund utilization** — versus one that's overloaded with defaults and unlikely to disburse quickly.

**Result:** offline confusion, misrouted applications, disbursement delays.

---

## 2. What We Are Solving

We are closing the full journey gap between **"a citizen is eligible"** and **"a citizen is funded"** — not just recommending a scheme, but ensuring the recommendation is financially transparent (EMI-aware) and operationally actionable (routed to a partner who can actually disburse).

---

## 3. Our Solution — Overview

A multilingual web/mobile platform with three integrated modules functioning as one continuous decision pipeline:

```
User Profile Input → Scheme Recommendation → EMI Calculation → Partner Routing (health-filtered)
```

Each module solves exactly one point of failure identified above — no scope creep, no redundant features.

---

## 4. How It Solves the Problem Efficiently

| Failure Point | Module | Mechanism |
|---|---|---|
| Scheme confusion | Smart Scheme Recommender | Deterministic rule engine on income/cost/project-type inputs — instant, explainable, no black-box risk |
| No cost visibility | Financial Calculator | Real-time EMI projection using scheme-specific rate/cap/moratorium rules |
| Blind/misrouted applications | Geo-Spatial Partner Locator & Router | Distance-ranked partner list, **filtered by NPA/fund-utilization health** before being shown to the user |

Because eligibility and EMI logic are **rule-based, not generative**, the core outputs are 100% deterministic and auditable — critical for a financial-assistance tool where a wrong answer has real consequences.

---

## 5. Novelty — What's New Here

- **Proactive, not search-based** — existing government portals (e.g., myScheme.gov.in) require the citizen to already know what to search for. Our recommender infers the right scheme from basic life facts (income, project cost, education status) without requiring scheme literacy.
- **Partner-health-aware routing** — this is the core novel contribution. No known platform currently filters Channel Partner recommendations by NPA status or fund-utilization health. This directly targets *why* disbursement delays happen, not just *where* to apply.
- **Unified pipeline** — scheme discovery, cost transparency, and routing are typically three separate (or entirely absent) processes today; we collapse them into one continuous flow.

---

## 6. How This Differs From Pre-Existing Solutions

**No existing platform performs the full pipeline described above.**

- **myScheme.gov.in** — static keyword/category search across all government schemes; requires the user to already know roughly what they're looking for; no EMI calculation; no partner-health filtering.
- **Bank/NBFC individual portals** — each partner only shows its own products; no cross-partner comparison; no eligibility guidance; no routing intelligence.
- **Generic loan-comparison aggregators (private sector)** — cover commercial loans, not concessional SC-specific channel finance schemes; irrelevant partner network; no NPA-aware routing (this concept does not exist in any consumer-facing loan platform we are aware of).

**Conclusion:** individual pieces (scheme search, EMI calculators, bank locators) exist in isolation elsewhere, but the specific combination — proactive eligibility inference + concessional-scheme EMI modeling + partner-health-filtered routing — has no direct pre-existing equivalent.

---

## 7. How We Are Going to Make It Work (Build Strategy)

Since financial-eligibility logic must be deterministic, we deliberately **do not** rely on an LLM for the core decision output. LLM/AI usage is scoped to *explanation and language*, not *decision-making*:

- **Decision layer:** Hand-coded / config-driven rule engine (JSON-defined thresholds for income, cost, loan type) — fully deterministic, testable, and demo-safe.
- **Explanation layer:** LLM used only to turn the rule engine's structured output into a natural, multilingual sentence for the user (e.g., "Based on your ₹80,000 project cost and income, you qualify for the Micro Finance Scheme at 6.5% interest").
- **Routing layer:** Static/mock Channel Partner dataset (location, category served, NPA%, utilization%) — filtered via a simple threshold rule (e.g., exclude partners above a defined NPA%) before ranking by distance.

This split keeps the system's most important outputs (eligibility, EMI, routing) fully explainable and non-hallucinating, while still delivering an "AI-powered" multilingual experience.

---

## 8. Workflow (End-to-End)

```
1. User opens app → selects preferred language
2. User inputs: project type, estimated cost, annual family income, education status
3. Rule Engine evaluates inputs against scheme thresholds
      ↓
4. Scheme Recommender outputs: scheme name + eligibility reason (LLM-phrased, multilingual)
      ↓
5. Financial Calculator auto-populates EMI table:
      - Loan amount (up to scheme cap)
      - Interest rate (scheme-specific band)
      - Moratorium period
      - Monthly EMI + total repayment
      ↓
6. User taps "Find Partner"
      ↓
7. Geo-Spatial Locator:
      - Pulls user's location (or manual entry)
      - Filters Channel Partner dataset by: (a) serves this loan category, (b) NPA/utilization below threshold
      - Ranks remaining partners by distance
      ↓
8. User sees ranked list + map pins of eligible, healthy Channel Partners
      ↓
9. User selects a partner → sees contact/application info (mocked or real, depending on data availability)
```

---

## 9. System Components

| Component | Role | Notes |
|---|---|---|
| **Frontend (Web/Mobile UI)** | User input forms, results display, map view | Multilingual from the start (not retrofitted) |
| **Rule Engine (Scheme Recommender)** | Deterministic eligibility logic | JSON-config thresholds, easily auditable/updatable |
| **EMI Calculator Module** | Amortization math with moratorium offset | Pure function, zero external dependency |
| **Channel Partner Dataset** | Partner name, location (lat/long), category served, NPA% (default rate), utilization% (fund usage rate) | Curated/mocked dataset built in early build hours |
| **Geo-Filter & Ranking Engine** | Filters out unhealthy partners (high NPA / poor fund utilization), ranks remaining ones by distance | Simple threshold rule + Haversine distance formula (see Glossary) |
| **Map Integration** | Visual display of ranked, filtered partners | Google Maps API / Leaflet + OpenStreetMap |
| **LLM Explanation Layer** | Converts structured rule-engine output into natural multilingual sentences | Used only for phrasing, never for decision logic |
| **Language Layer** | UI translation + LLM-generated explanations in local languages | 2–3 Indian languages for MVP |

---

## 10. Impact Goals (Aligned to Official Brief)

- Enhance financial literacy among the target demographic regarding concessional lending
- Improve transparency and efficiency in the channel finance ecosystem — faster disbursements, better fund utilization

---

## 11. One-Line Pitch

*"We don't just tell you which loan you qualify for — we calculate what it'll cost you, and route you to a partner who can actually get it disbursed."*
