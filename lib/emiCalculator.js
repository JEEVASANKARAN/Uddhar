/**
 * emiCalculator.js — Standard Amortization EMI Calculator
 *
 * Pure function: takes loan parameters, returns monthly EMI,
 * total repayment, and total interest — with moratorium offset.
 *
 * Formula: EMI = P × r × (1+r)^n / ((1+r)^n − 1)
 *   where P = principal, r = monthly interest rate, n = repayment months
 *
 * Zero LLM involvement. Zero side effects.
 */

/**
 * @param {Object} params
 * @param {number} params.loanAmount        — Principal loan amount in ₹
 * @param {number} params.annualInterestRate — Annual interest rate as percentage (e.g., 6.5 for 6.5%)
 * @param {number} params.tenureMonths       — Total loan tenure in months (including moratorium)
 * @param {number} params.moratoriumMonths   — Grace period months before EMI payments begin (0–12)
 *
 * @returns {{
 *   loanAmount: number,
 *   annualInterestRate: number,
 *   tenureMonths: number,
 *   moratoriumMonths: number,
 *   repaymentMonths: number,
 *   monthlyEMI: number,
 *   totalRepayment: number,
 *   totalInterest: number,
 *   interestDuringMoratorium: number,
 *   effectivePrincipal: number,
 *   schedule: Array<{ month: number, principal: number, interest: number, balance: number }>
 * }}
 */
export function calculateEMI({ loanAmount, annualInterestRate, tenureMonths, moratoriumMonths = 0 }) {
  // ── Input validation ──────────────────────────────────────────────
  if (loanAmount <= 0) {
    throw new Error(`loanAmount must be positive, got ${loanAmount}`);
  }
  if (annualInterestRate < 0) {
    throw new Error(`annualInterestRate cannot be negative, got ${annualInterestRate}`);
  }
  if (tenureMonths <= 0) {
    throw new Error(`tenureMonths must be positive, got ${tenureMonths}`);
  }
  if (moratoriumMonths < 0 || moratoriumMonths >= tenureMonths) {
    throw new Error(
      `moratoriumMonths (${moratoriumMonths}) must be >= 0 and < tenureMonths (${tenureMonths})`
    );
  }

  const monthlyRate = annualInterestRate / 100 / 12;
  const repaymentMonths = tenureMonths - moratoriumMonths;

  // ── Interest accrued during moratorium (simple interest on principal) ──
  const interestDuringMoratorium = roundTo2(loanAmount * monthlyRate * moratoriumMonths);

  // ── Effective principal = original loan + accrued moratorium interest ──
  const effectivePrincipal = loanAmount + interestDuringMoratorium;

  // ── EMI calculation ───────────────────────────────────────────────
  let monthlyEMI;
  if (monthlyRate === 0) {
    // Zero-interest edge case
    monthlyEMI = roundTo2(effectivePrincipal / repaymentMonths);
  } else {
    const compoundFactor = Math.pow(1 + monthlyRate, repaymentMonths);
    monthlyEMI = roundTo2(
      (effectivePrincipal * monthlyRate * compoundFactor) / (compoundFactor - 1)
    );
  }

  const totalRepayment = roundTo2(monthlyEMI * repaymentMonths);
  const totalInterest = roundTo2(totalRepayment - loanAmount);

  // ── Amortization schedule (first 12 months + last month) ──────────
  const schedule = buildAmortizationSchedule(effectivePrincipal, monthlyRate, repaymentMonths, monthlyEMI);

  return {
    loanAmount,
    annualInterestRate,
    tenureMonths,
    moratoriumMonths,
    repaymentMonths,
    monthlyEMI,
    totalRepayment,
    totalInterest,
    interestDuringMoratorium,
    effectivePrincipal,
    schedule,
  };
}

/**
 * Builds a condensed amortization schedule: first 12 months + last month.
 * Full schedule for loans ≤ 12 repayment months.
 */
function buildAmortizationSchedule(principal, monthlyRate, repaymentMonths, emi) {
  const schedule = [];
  let balance = principal;

  for (let month = 1; month <= repaymentMonths; month++) {
    const interestComponent = roundTo2(balance * monthlyRate);
    const principalComponent = roundTo2(emi - interestComponent);
    balance = roundTo2(balance - principalComponent);

    // Prevent floating-point drift on the last month
    if (month === repaymentMonths) {
      balance = 0;
    }

    // Keep first 12 months and the final month
    if (month <= 12 || month === repaymentMonths) {
      schedule.push({
        month,
        principal: principalComponent,
        interest: interestComponent,
        balance: Math.max(0, balance),
      });
    }
  }

  return schedule;
}

/**
 * Round to 2 decimal places (financial rounding).
 */
function roundTo2(value) {
  return Math.round(value * 100) / 100;
}
