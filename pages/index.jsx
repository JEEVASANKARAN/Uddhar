import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ProfileForm from '../components/ProfileForm';
import SchemeResult from '../components/SchemeResult';
import EMITable from '../components/EMITable';
import PartnerMap from '../components/PartnerMap';
import { recommendScheme } from '../lib/ruleEngine';

import en from '../data/translations/en.json';
import hi from '../data/translations/hi.json';
import ta from '../data/translations/ta.json';

const translationsMap = { en, hi, ta };

// Phase 7: Pre-loaded demo profiles for live presentation
const DEMO_PROFILES = [
  {
    id: 'micro',
    label: 'Micro Business',
    sublabel: '→ NSFDC MF Scheme',
    income: 200000,
    projectCost: 110000,
    projectType: 'micro_business',
    educationStatus: 'undergraduate',
    userLat: 13.0400,
    userLng: 80.2300,
    locationName: 'T. Nagar, Chennai',
  },
  {
    id: 'term',
    label: 'Medium Enterprise',
    sublabel: '→ NSFDC Term Loan',
    income: 380000,
    projectCost: 350000,
    projectType: 'medium_business',
    educationStatus: 'undergraduate',
    userLat: 13.0067,
    userLng: 80.2020,
    locationName: 'Guindy, Chennai',
  },
  {
    id: 'education',
    label: 'Higher Education',
    sublabel: '→ NSFDC Edu Loan',
    income: 280000,
    projectCost: 800000,
    projectType: 'education',
    educationStatus: 'postgraduate',
    userLat: 13.1143,
    userLng: 80.1548,
    locationName: 'Ambattur, Chennai',
  },
];

export default function Home() {
  const [lang, setLang] = useState('en');
  const t = translationsMap[lang] || en;
  const [activeDemoId, setActiveDemoId] = useState('micro');

  // Applicant Profile State
  const [profile, setProfile] = useState({
    income: 200000,
    projectCost: 110000,
    projectType: 'micro_business',
    educationStatus: 'undergraduate',
    userLat: 13.0400,
    userLng: 80.2300,
    locationName: 'T. Nagar, Chennai',
  });

  // Scheme & EMI State
  const [schemeResult, setSchemeResult] = useState(null);
  const [tenureMonths, setTenureMonths] = useState(36);
  const [moratoriumMonths, setMoratoriumMonths] = useState(6);
  const [llmExplanation, setLlmExplanation] = useState('');
  const [llmLoading, setLlmLoading] = useState(false);

  // Fetch LLM explanation (isolated, async, never blocks deterministic output)
  const fetchLLMExplanation = async (result, language) => {
    setLlmLoading(true);
    setLlmExplanation('');
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeResult: result,
          language,
        }),
      });
      const data = await res.json();
      if (data.explanation) {
        setLlmExplanation(data.explanation);
      }
    } catch (err) {
      console.warn('LLM explanation unavailable:', err.message);
    } finally {
      setLlmLoading(false);
    }
  };

  // Auto-calculate on initial mount & whenever profile form submits
  const handleCalculateScheme = () => {
    const res = recommendScheme({
      income: Number(profile.income),
      projectCost: Number(profile.projectCost),
      projectType: profile.projectType,
      educationStatus: profile.educationStatus,
    });
    setSchemeResult(res);

    if (res && res.eligible && res.scheme) {
      setTenureMonths(res.scheme.maxTenureMonths || 36);
      setMoratoriumMonths(res.scheme.moratoriumMonthsMin || 6);
    }

    // Fire LLM explanation asynchronously (never blocks the UI)
    fetchLLMExplanation(res, lang);
  };

  // Re-fetch explanation when language changes
  useEffect(() => {
    if (schemeResult) {
      fetchLLMExplanation(schemeResult, lang);
    }
  }, [lang]);

  useEffect(() => {
    handleCalculateScheme();
  }, []);

  return (
    <>
      <Head>
        <title>Uddhar — Lifted, Not Left Behind | SIH 26092</title>
        <meta name="description" content="AI-Driven Scheme Matching & Smart Channel Routing for Marginalized Entrepreneurs" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* NAV */}
      <nav>
        <div className="wrap">
          <div className="logo">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M2 18 Q7 8 12 14 Q17 20 22 6" stroke="#E3A83B" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              <path d="M2 20 L22 20" stroke="#9A9284" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Uddhar
          </div>
          <div className="navlinks">
            <a href="#flow">{t?.nav?.howItWorks || 'How it works'}</a>
            <a href="#panel">{t?.nav?.insidePlatform || 'Inside the platform'}</a>
            <a href="#compare">{t?.nav?.whyNotMyScheme || 'Why not myScheme'}</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <LanguageSwitcher currentLang={lang} onChangeLang={setLang} />
            <a href="#panel" className="nav-cta">
              {t?.nav?.checkEligibility || 'Check eligibility'}
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="wrap">
          <div className="eyebrow">{t?.hero?.eyebrow || 'NSFDC Channel Finance, made navigable'}</div>
          <h1 className="hero-headline">
            {t?.hero?.headlineMain || 'A mountain was lifted'}<br />
            {t?.hero?.headlineSub ? (
              <em>{t.hero.headlineSub}</em>
            ) : (
              <>so a village <em>wouldn't drown.</em></>
            )}
          </h1>
          <p className="hero-sub">
            {t?.hero?.sub || "Every year, concessional credit sits unclaimed — not because people don't qualify, but because the system to reach it was never built for them. Uddhar is that missing shelter: the right scheme, the real cost, and a partner who can actually pay out."}
          </p>
          <div className="hero-actions">
            <a href="#panel" className="btn-primary">
              {t?.hero?.seeItWork || 'See it work'}
            </a>
            <a href="#flow" className="btn-ghost">
              {t?.hero?.readSteps || 'Read the three steps ↓'}
            </a>
          </div>
        </div>

        <svg className="ridge" viewBox="0 0 1440 160" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ridgeFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1C2140" />
              <stop offset="100%" stopColor="#0C0F1E" />
            </linearGradient>
          </defs>
          <path
            d="M0,120 L60,70 L120,110 L180,40 L240,95 L300,55 L360,100 L420,60 L480,90
               L540,50 L600,85 L660,45 L720,70 L780,55 L840,72 L900,60 L960,70
               L1020,64 L1080,68 L1140,62 L1200,66 L1260,63 L1320,65 L1380,64 L1440,65
               L1440,160 L0,160 Z"
            fill="url(#ridgeFade)"
          />
          <path
            d="M0,120 L60,70 L120,110 L180,40 L240,95 L300,55 L360,100 L420,60 L480,90
               L540,50 L600,85 L660,45 L720,70 L780,55 L840,72 L900,60 L960,70
               L1020,64 L1080,68 L1140,62 L1200,66 L1260,63 L1320,65 L1380,64 L1440,65"
            fill="none"
            stroke="#E3A83B"
            strokeWidth="1.4"
            opacity="0.55"
          />
        </svg>
      </section>

      {/* STAT STRIP */}
      <div className="stats">
        <div className="wrap">
          <div className="stat">
            <b>{t?.stats?.stat1Num || '100+'}</b>
            <span>{t?.stats?.stat1Text || 'Channel Partners a citizen must choose between, blind'}</span>
          </div>
          <div className="stat">
            <b>{t?.stats?.stat2Num || '3'}</b>
            <span>{t?.stats?.stat2Text || 'Loan schemes, near-indistinguishable without guidance'}</span>
          </div>
          <div className="stat">
            <b>{t?.stats?.stat3Num || '6.5%'}</b>
            <span>{t?.stats?.stat3Text || 'Interest available — a third of open-market rates'}</span>
          </div>
          <div className="stat">
            <b>{t?.stats?.stat4Num || '0'}</b>
            <span>{t?.stats?.stat4Text || 'Existing tools that check if a partner can actually pay'}</span>
          </div>
        </div>
      </div>

      {/* THREE MOTIONS FLOW */}
      <section id="flow">
        <div className="wrap">
          <div className="section-head">
            <span className="section-label">{t?.flow?.label || 'The lift, in three motions'}</span>
            <h2>{t?.flow?.title || 'Not a search bar. A sequence that ends in funding.'}</h2>
            <p className="section-desc">
              {t?.flow?.desc || 'Each step exists because the one before it is useless alone — a scheme match without a real cost is a guess, and a cost without a working partner is a dead end.'}
            </p>
          </div>

          <div className="flow">
            <div className="flow-row">
              <div className="flow-num">I</div>
              <div className="flow-title">{t?.flow?.step1Title || 'Recommend'}</div>
              <div>
                <div className="flow-body">
                  {t?.flow?.step1Body || 'Income, project cost, and purpose go in. A deterministic rule engine — not a guess, not a black box — returns the one scheme that actually fits: Micro Finance, Term Loan, or Educational Loan.'}
                </div>
                <span className="flow-tag">{t?.flow?.step1Tag || 'Rule-based · fully auditable'}</span>
              </div>
            </div>
            <div className="flow-row">
              <div className="flow-num">II</div>
              <div className="flow-title">{t?.flow?.step2Title || 'Calculate'}</div>
              <div>
                <div className="flow-body">
                  {t?.flow?.step2Body || "The real EMI, at the scheme's true interest band and moratorium — seen before a single form is filed at a bank. No surprises at the counter."}
                </div>
                <span className="flow-tag">{t?.flow?.step2Tag || 'Live amortization'}</span>
              </div>
            </div>
            <div className="flow-row">
              <div className="flow-num">III</div>
              <div className="flow-title">{t?.flow?.step3Title || 'Route'}</div>
              <div>
                <div className="flow-body">
                  {t?.flow?.step3Body || "The nearest authorized partner, filtered by fund health — NPA levels, utilization, overdues — before it's ever shown. Distance alone was never the right filter."}
                </div>
                <span className="flow-tag">{t?.flow?.step3Tag || 'Health-filtered · our core novelty'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE PANEL SECTION */}
      <div className="panel-section" id="panel">
        <div className="wrap" style={{ padding: '100px 0' }}>
          <div className="section-head">
            <span className="section-label">{t?.panel?.label || 'Inside the platform'}</span>
            <h2>{t?.panel?.title || 'What the applicant actually sees'}</h2>
            <p className="section-desc">{t?.panel?.desc || 'One continuous read — eligibility, cost, and a partner worth walking to.'}</p>
          </div>

          <div className="panel">
            <div className="panel-top">
              <div className="panel-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="panel-title">{t?.panel?.appTitle || 'uddhar.gov — applicant view'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--stone)' }}>Lang:</span>
                <LanguageSwitcher currentLang={lang} onChangeLang={setLang} />
              </div>
            </div>

            <div className="panel-body">
              {/* LEFT SIDE: Inputs & Calculations */}
              <div className="panel-left">
                <div className="section-label" style={{ marginBottom: '12px' }}>
                  {t?.stepProfile || '1. Entrepreneur Profile & Inputs'}
                </div>

                {/* Phase 7: Demo quick-fill buttons */}
                <div id="demo-profiles-bar" style={{ display: 'flex', gap: '6px', marginBottom: '18px', flexWrap: 'wrap' }}>
                  {DEMO_PROFILES.map((dp) => (
                    <button
                      key={dp.id}
                      id={`demo-btn-${dp.id}`}
                      type="button"
                      onClick={() => {
                        setActiveDemoId(dp.id);
                        const { id, label, sublabel, ...profileFields } = dp;
                        setProfile(profileFields);
                        // auto-calculate after setting profile
                        setTimeout(() => {
                          const res = require('../lib/ruleEngine').recommendScheme(profileFields);
                          setSchemeResult(res);
                          if (res && res.eligible && res.scheme) {
                            setTenureMonths(res.scheme.maxTenureMonths || 36);
                            setMoratoriumMonths(res.scheme.moratoriumMonthsMin || 6);
                          }
                          fetchLLMExplanation(res, lang);
                        }, 0);
                      }}
                      style={{
                        fontSize: '11px',
                        fontFamily: 'IBM Plex Mono, monospace',
                        padding: '5px 10px',
                        borderRadius: '3px',
                        border: activeDemoId === dp.id ? '1px solid var(--gold)' : '1px solid var(--rule)',
                        background: activeDemoId === dp.id ? 'rgba(227,168,59,0.15)' : 'var(--bg-deep)',
                        color: activeDemoId === dp.id ? 'var(--gold)' : 'var(--stone)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                      }}
                    >
                      <div>{dp.label}</div>
                      <div style={{ fontSize: '9px', opacity: 0.75 }}>{dp.sublabel}</div>
                    </button>
                  ))}
                </div>

                <ProfileForm
                  profile={profile}
                  onChange={setProfile}
                  onSubmit={handleCalculateScheme}
                  t={t}
                />

                {schemeResult && (
                  <div style={{ marginTop: '28px' }}>
                    <div className="section-label" style={{ marginBottom: '12px' }}>
                      {t?.stepScheme || '2. Scheme Recommendation'}
                    </div>
                    <SchemeResult
                      result={schemeResult}
                      llmExplanation={llmExplanation}
                      llmLoading={llmLoading}
                      t={t}
                    />

                    {schemeResult.eligible && (
                      <EMITable
                        loanAmount={schemeResult.loanAmount}
                        interestRate={schemeResult.scheme.interestRateMin}
                        tenureMonths={tenureMonths}
                        moratoriumMonths={moratoriumMonths}
                        onChangeTenure={setTenureMonths}
                        onChangeMoratorium={setMoratoriumMonths}
                        t={t}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT SIDE: Map & Partner Routing */}
              <div className="panel-right">
                <div className="section-label" style={{ marginBottom: '16px' }}>
                  {t?.stepPartner || '4. Authorized Channel Partner Routing'}
                </div>
                <PartnerMap
                  userLat={profile.userLat}
                  userLng={profile.userLng}
                  loanCategory={
                    schemeResult && schemeResult.eligible && schemeResult.scheme
                      ? schemeResult.scheme.category
                      : 'micro_finance'
                  }
                  t={t}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIFFERENTIATOR SECTION */}
      <section id="compare">
        <div className="wrap">
          <div className="section-head">
            <span className="section-label">{t?.compare?.label || 'Why not just search myScheme.gov.in'}</span>
            <h2>{t?.compare?.title || 'Search finds a page. Uddhar finds a way through.'}</h2>
          </div>

          <div className="compare">
            <div className="compare-col">
              <div className="compare-head">{t?.compare?.existingTitle || 'Existing portals'}</div>
              <div className="compare-item">
                <span className="mark">–</span> {t?.compare?.ex1 || 'Requires knowing what to search for'}
              </div>
              <div className="compare-item">
                <span className="mark">–</span> {t?.compare?.ex2 || 'No repayment figures shown'}
              </div>
              <div className="compare-item">
                <span className="mark">–</span> {t?.compare?.ex3 || 'Every partner treated as equal'}
              </div>
              <div className="compare-item">
                <span className="mark">–</span> {t?.compare?.ex4 || 'One-language interface'}
              </div>
            </div>
            <div className="compare-col win">
              <div className="compare-head">{t?.compare?.uddharTitle || 'Uddhar'}</div>
              <div className="compare-item">
                <span className="mark">✓</span> {t?.compare?.ud1 || 'Infers the scheme from income and cost alone'}
              </div>
              <div className="compare-item">
                <span className="mark">✓</span> {t?.compare?.ud2 || 'Real EMI, before you approach a bank'}
              </div>
              <div className="compare-item">
                <span className="mark">✓</span> {t?.compare?.ud3 || 'Filters out partners unlikely to disburse'}
              </div>
              <div className="compare-item">
                <span className="mark">✓</span> {t?.compare?.ud4 || 'Explained back to you in your own language'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <span className="section-label" style={{ justifyContent: 'center', display: 'flex' }}>
            {t?.footer?.slogan || 'SIH 2026 · PS 26092'}
          </span>
          <h2>
            {t?.footer?.headingMain || 'The goal was never approval.'}<br />
            {t?.footer?.headingSub || 'It was always getting the money into the right hands.'}
          </h2>
          <a href="#panel" className="btn-primary">
            {t?.footer?.cta || 'Check your eligibility'}
          </a>
          <div className="footer-fine">
            {t?.footer?.fine || 'UDDHAR — FROM SANSKRIT, "TO LIFT UP, TO RESCUE" — GOVARDHAN UDDHAR, BHAGAVATA PURANA'}
          </div>
        </div>
      </footer>
    </>
  );
}
