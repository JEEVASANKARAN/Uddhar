/**
 * Phase 2 — Verification Script
 * Tests ruleEngine, emiCalculator, and partnerFilter with sample inputs.
 * Run: node lib/test-phase2.mjs
 */

import { recommendScheme } from "./ruleEngine.js";
import { calculateEMI } from "./emiCalculator.js";
import { findEligiblePartners } from "./partnerFilter.js";

let pass = 0;
let fail = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    pass++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    fail++;
  }
}

// ═══════════════════════════════════════════════════════════════════
console.log("\n══ 1. RULE ENGINE TESTS ══");
// ═══════════════════════════════════════════════════════════════════

// Test 1a: Micro business, ₹80K project, ₹2L income → Micro Finance
const t1a = recommendScheme({ income: 200000, projectCost: 80000, projectType: "micro_business", educationStatus: "" });
assert("Micro business ₹80K → eligible", t1a.eligible === true);
assert("Micro business ₹80K → Micro Finance Scheme", t1a.scheme.id === "micro_finance");
assert("Micro business ₹80K → loan = 90% of ₹80K = ₹72,000", t1a.loanAmount === 72000);
console.log(`  → Reason: ${t1a.reason.message}`);

// Test 1b: Medium business, ₹5L project, ₹4L income → Term Loan
const t1b = recommendScheme({ income: 400000, projectCost: 500000, projectType: "medium_business", educationStatus: "" });
assert("Medium business ₹5L → eligible", t1b.eligible === true);
assert("Medium business ₹5L → Term Loan Scheme", t1b.scheme.id === "term_loan");
assert("Medium business ₹5L → loan = 90% of ₹5L = ₹4,50,000", t1b.loanAmount === 450000);
console.log(`  → Reason: ${t1b.reason.message}`);

// Test 1c: Education, ₹10L cost, ₹3L income → Educational Loan
const t1c = recommendScheme({ income: 300000, projectCost: 1000000, projectType: "education", educationStatus: "postgraduate" });
assert("Education ₹10L → eligible", t1c.eligible === true);
assert("Education ₹10L → Educational Loan Scheme", t1c.scheme.id === "educational_loan");
assert("Education ₹10L → loan = 90% of ₹10L = ₹9,00,000", t1c.loanAmount === 900000);
console.log(`  → Reason: ${t1c.reason.message}`);

// Test 1d: Income too high → rejected
const t1d = recommendScheme({ income: 600000, projectCost: 100000, projectType: "micro_business", educationStatus: "" });
assert("Income ₹6L → not eligible", t1d.eligible === false);
assert("Income ₹6L → INCOME_EXCEEDS_LIMIT", t1d.reason.code === "INCOME_EXCEEDS_LIMIT");
console.log(`  → Reason: ${t1d.reason.message}`);

// Test 1e: Project cost exceeds Micro Finance cap → rejected
const t1e = recommendScheme({ income: 300000, projectCost: 200000, projectType: "micro_business", educationStatus: "" });
assert("Micro ₹2L cost → exceeds micro cap, auto-reclassified to Term Loan", t1e.eligible === true);
assert("Auto-reclassified → Term Loan", t1e.scheme.id === "term_loan");
console.log(`  → Reason: ${t1e.reason.message}`);

// ═══════════════════════════════════════════════════════════════════
console.log("\n══ 2. EMI CALCULATOR TESTS ══");
// ═══════════════════════════════════════════════════════════════════

// Test 2a: ₹72,000 at 6.5% for 36 months, 3 month moratorium
const t2a = calculateEMI({ loanAmount: 72000, annualInterestRate: 6.5, tenureMonths: 36, moratoriumMonths: 3 });
assert("EMI test 1 → repaymentMonths = 33", t2a.repaymentMonths === 33);
assert("EMI test 1 → monthlyEMI > 0", t2a.monthlyEMI > 0);
assert("EMI test 1 → totalRepayment > loanAmount", t2a.totalRepayment > 72000);
assert("EMI test 1 → schedule has entries", t2a.schedule.length > 0);
console.log(`  → EMI: ₹${t2a.monthlyEMI} | Total: ₹${t2a.totalRepayment} | Interest: ₹${t2a.totalInterest}`);
console.log(`  → Moratorium interest: ₹${t2a.interestDuringMoratorium} | Effective principal: ₹${t2a.effectivePrincipal}`);

// Test 2b: ₹4,50,000 at 7.5% for 60 months, 6 month moratorium
const t2b = calculateEMI({ loanAmount: 450000, annualInterestRate: 7.5, tenureMonths: 60, moratoriumMonths: 6 });
assert("EMI test 2 → repaymentMonths = 54", t2b.repaymentMonths === 54);
assert("EMI test 2 → monthlyEMI is reasonable (₹8K–₹12K range)", t2b.monthlyEMI > 8000 && t2b.monthlyEMI < 12000);
console.log(`  → EMI: ₹${t2b.monthlyEMI} | Total: ₹${t2b.totalRepayment} | Interest: ₹${t2b.totalInterest}`);

// Test 2c: Zero-interest edge case
const t2c = calculateEMI({ loanAmount: 120000, annualInterestRate: 0, tenureMonths: 12, moratoriumMonths: 0 });
assert("Zero interest → EMI = ₹10,000", t2c.monthlyEMI === 10000);
assert("Zero interest → totalInterest = 0", t2c.totalInterest === 0);
console.log(`  → EMI: ₹${t2c.monthlyEMI} | Total: ₹${t2c.totalRepayment}`);

// ═══════════════════════════════════════════════════════════════════
console.log("\n══ 3. PARTNER FILTER TESTS ══");
// ═══════════════════════════════════════════════════════════════════

// User location: T. Nagar, Chennai (13.04, 80.23)
const userLat = 13.04;
const userLng = 80.23;

// Test 3a: micro_finance category, default thresholds
const t3a = findEligiblePartners({ userLat, userLng, loanCategory: "micro_finance" });
assert(`Micro finance → ${t3a.eligible.length} eligible, ${t3a.excluded.length} excluded`, t3a.eligible.length + t3a.excluded.length === 16);
assert("Micro finance → eligible sorted by distance", t3a.eligible.every((p, i, arr) => i === 0 || arr[i - 1].distanceKm <= p.distanceKm));
console.log(`  → Eligible: ${t3a.eligible.map(p => `${p.name} (${p.distanceKm}km)`).join(", ")}`);

// Test 3b: term_loan category
const t3b = findEligiblePartners({ userLat, userLng, loanCategory: "term_loan" });
assert(`Term loan → ${t3b.eligible.length} eligible partners`, t3b.eligible.length > 0);
// PNB Egmore (12.4% NPA) should be excluded
const pnbExcluded = t3b.excluded.find(p => p.id === "cp-007");
assert("PNB Egmore (high NPA) excluded from term loan", !!pnbExcluded);
console.log(`  → Eligible: ${t3b.eligible.map(p => `${p.name} (${p.distanceKm}km)`).join(", ")}`);

// Test 3c: Verify unhealthy partners are excluded
const t3c = findEligiblePartners({ userLat, userLng, loanCategory: "micro_finance", npaThreshold: 8.0, utilizationThreshold: 50.0 });
const unhealthyNames = t3c.excluded.filter(p => p.exclusionReasons.some(r => r.code === "NPA_TOO_HIGH" || r.code === "UTILIZATION_TOO_LOW"));
assert(`Unhealthy partners excluded: ${unhealthyNames.length}`, unhealthyNames.length >= 3);
console.log(`  → Excluded (unhealthy): ${unhealthyNames.map(p => `${p.name} (NPA:${p.npaRate}%, Util:${p.fundUtilization}%)`).join(", ")}`);

// ═══════════════════════════════════════════════════════════════════
console.log(`\n══ RESULTS: ${pass} passed, ${fail} failed ══\n`);
if (fail > 0) process.exit(1);
