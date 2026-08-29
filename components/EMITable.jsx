import React, { useState } from 'react';
import { calculateEMI } from '../lib/emiCalculator';

export default function EMITable({
  loanAmount,
  interestRate,
  tenureMonths,
  moratoriumMonths,
  onChangeTenure,
  onChangeMoratorium,
  t,
}) {
  const [showSchedule, setShowSchedule] = useState(false);

  if (!loanAmount || loanAmount <= 0) return null;

  // Calculate EMI details deterministically
  let emiDetails = null;
  let emiError = null;
  try {
    emiDetails = calculateEMI({
      loanAmount,
      annualInterestRate: interestRate,
      tenureMonths,
      moratoriumMonths,
    });
  } catch (err) {
    emiError = err.message;
  }

  return (
    <div id="emi-table-container" style={{ marginTop: '26px' }}>
      <div className="section-label" style={{ marginBottom: '12px' }}>
        {t?.stepEMI || '3. EMI Projection & Repayment Breakdown'}
      </div>

      {emiError ? (
        <div style={{ color: 'var(--coral)', fontSize: '13px' }}>Error: {emiError}</div>
      ) : (
        <>
          <div className="emi-row">
            <span>{t?.labels?.loanAmount || 'Loan amount'}</span>
            <b id="val-loan-amount">₹ {emiDetails.loanAmount.toLocaleString('en-IN')}</b>
          </div>
          <div className="emi-row">
            <span>{t?.labels?.interestRate || 'Interest rate'}</span>
            <b id="val-interest-rate">{emiDetails.annualInterestRate}% p.a.</b>
          </div>
          <div className="emi-row">
            <span>{t?.labels?.moratorium || 'Moratorium'}</span>
            <b id="val-moratorium">{emiDetails.moratoriumMonths} months</b>
          </div>
          <div className="emi-row" style={{ background: 'rgba(227,168,59,0.06)', padding: '12px 8px', borderRadius: '4px' }}>
            <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{t?.labels?.monthlyEMI || 'Monthly EMI'}</span>
            <b id="val-monthly-emi" style={{ color: 'var(--gold)', fontSize: '17px' }}>
              ₹ {emiDetails.monthlyEMI.toLocaleString('en-IN')}
            </b>
          </div>
          <div className="emi-row">
            <span>{t?.labels?.totalRepayment || 'Total Repayment'}</span>
            <b id="val-total-repayment">₹ {emiDetails.totalRepayment.toLocaleString('en-IN')}</b>
          </div>
          <div className="emi-row">
            <span>{t?.labels?.totalInterest || 'Total Interest'}</span>
            <b id="val-total-interest" style={{ color: 'var(--stone)' }}>
              ₹ {emiDetails.totalInterest.toLocaleString('en-IN')}
            </b>
          </div>

          {/* Controls / Sliders */}
          <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-deep)', borderRadius: '4px', border: '1px solid var(--rule)' }}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-dim)' }}>
                <span>{t?.labels?.tenure || 'Repayment Tenure'}:</span>
                <span className="font-mono" style={{ color: 'var(--gold)' }}>{tenureMonths} Months</span>
              </div>
              <input
                type="range"
                id="slider-tenure"
                min="12"
                max="84"
                step="6"
                value={tenureMonths}
                onChange={(e) => onChangeTenure(Number(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '12px', color: 'var(--ink-dim)' }}>
                <span>{t?.labels?.moratorium || 'Moratorium Period'}:</span>
                <span className="font-mono" style={{ color: 'var(--gold)' }}>{moratoriumMonths} Months</span>
              </div>
              <input
                type="range"
                id="slider-moratorium"
                min="0"
                max="12"
                step="3"
                value={moratoriumMonths}
                onChange={(e) => onChangeMoratorium(Number(e.target.value))}
                className="slider-input"
              />
            </div>
          </div>

          {/* Schedule toggle */}
          <button
            type="button"
            id="btn-toggle-schedule"
            onClick={() => setShowSchedule(!showSchedule)}
            className="btn-ghost"
            style={{ marginTop: '14px', fontSize: '13px', cursor: 'pointer' }}
          >
            {showSchedule ? '▼ Hide Amortization Schedule' : '▶ View Amortization Schedule'}
          </button>

          {showSchedule && (
            <div id="amortization-schedule-table" style={{ marginTop: '14px', overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--rule)', color: 'var(--stone)' }}>
                    <th style={{ padding: '6px' }}>Month</th>
                    <th style={{ padding: '6px' }}>Principal (₹)</th>
                    <th style={{ padding: '6px' }}>Interest (₹)</th>
                    <th style={{ padding: '6px' }}>Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {emiDetails.schedule.map((row) => (
                    <tr key={row.month} style={{ borderBottom: '1px solid var(--rule)' }}>
                      <td style={{ padding: '6px', fontFamily: 'IBM Plex Mono, monospace' }}>m{row.month}</td>
                      <td style={{ padding: '6px', fontFamily: 'IBM Plex Mono, monospace' }}>₹{row.principal.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '6px', fontFamily: 'IBM Plex Mono, monospace' }}>₹{row.interest.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '6px', fontFamily: 'IBM Plex Mono, monospace' }}>₹{row.balance.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
