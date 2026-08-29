import React from 'react';

export default function SchemeResult({ result, llmExplanation, llmLoading, t }) {
  if (!result) return null;

  if (!result.eligible) {
    return (
      <div id="scheme-result-card" className="match-card" style={{ borderColor: 'rgba(195,90,80,0.4)', background: 'rgba(195,90,80,0.08)' }}>
        <div id="scheme-name" className="scheme-name" style={{ color: 'var(--coral)' }}>
          ⚠️ Not Eligible for Concessional Scheme
        </div>
        <div id="scheme-reason" className="scheme-why" style={{ color: 'var(--ink)' }}>
          {llmExplanation || result.reason?.message || 'Profile does not meet NSFDC threshold requirements.'}
        </div>
      </div>
    );
  }

  const { scheme, loanAmount, reason } = result;

  return (
    <div id="scheme-result-card" className="match-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <span style={{ fontSize: '11px', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--jade)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ✓ {reason?.code === 'AUTO_RECLASSIFIED' ? 'Auto-Reclassified Match' : 'Matched Scheme'}
          </span>
          <h3 id="scheme-name" className="scheme-name" style={{ marginTop: '2px' }}>
            {scheme.name}
          </h3>
        </div>
        <span
          id="scheme-interest-rate"
          style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '14px',
            background: 'var(--gold)',
            color: 'var(--bg-deep)',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: '3px',
          }}
        >
          {scheme.interestRateMin}%{scheme.interestRateMin !== scheme.interestRateMax ? `–${scheme.interestRateMax}%` : ''} p.a.
        </span>
      </div>

      <p id="scheme-reason" className="scheme-why">
        {llmLoading ? (
          <span style={{ color: 'var(--stone)', fontStyle: 'italic', fontSize: '12px' }}>✦ Generating explanation in your language…</span>
        ) : (
          llmExplanation || reason?.message || scheme.description
        )}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(243,239,230,0.1)' }}>
        <div>
          <div className="field-label">{t?.labels?.maxSubsidy || 'Coverage'}</div>
          <div id="scheme-financing-percentage" className="field-value" style={{ marginBottom: 0, fontSize: '14px' }}>
            {scheme.financingPercentage}% Financed
          </div>
        </div>
        <div>
          <div className="field-label">{t?.labels?.moratorium || 'Moratorium'}</div>
          <div id="scheme-moratorium" className="field-value" style={{ marginBottom: 0, fontSize: '14px' }}>
            {scheme.moratoriumMonthsMin}–{scheme.moratoriumMonthsMax} Months
          </div>
        </div>
        <div>
          <div className="field-label">Max Loan</div>
          <div className="field-value" style={{ marginBottom: 0, fontSize: '14px' }}>
            ₹{(scheme.maxLoanAmount / 100000).toFixed(2)}L
          </div>
        </div>
      </div>
    </div>
  );
}
