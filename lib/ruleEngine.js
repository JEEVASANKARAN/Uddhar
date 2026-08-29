/**
 * ruleEngine.js — Deterministic Scheme Recommendation Logic
 *
 * Pure function: takes applicant profile inputs, evaluates them against
 * scheme thresholds from schemes.json, and returns the matching scheme
 * object plus a structured reason object (not a sentence — just data).
 *
 * Zero LLM involvement. Zero side effects.
 */

import schemes from "../data/schemes.json" with { type: "json" };

/**
 * @param {Object} profile
 * @param {number} profile.income          — Annual family income in ₹
 * @param {number} profile.projectCost     — Estimated project/education cost in ₹
 * @param {string} profile.projectType     — One of: "micro_business", "medium_business", "education"
 * @param {string} profile.educationStatus — One of: "undergraduate", "postgraduate", "diploma", "higher_education", or "" (empty for non-education)
 *
 * @returns {{ eligible: boolean, scheme: object|null, reason: object }}
 *   - eligible: true if a scheme matched
 *   - scheme:   the full scheme object from schemes.json (or null)
 *   - reason:   structured data explaining the match or rejection
 */
export function recommendScheme({ income, projectCost, projectType, educationStatus }) {
  // ── Step 1: Income gate (applies to ALL schemes) ──────────────────
  const incomeThreshold = 500000; // ₹5.00 Lakh — NSFDC universal cap
  if (income > incomeThreshold) {
    return {
      eligible: false,
      scheme: null,
      reason: {
        code: "INCOME_EXCEEDS_LIMIT",
        field: "income",
        threshold: incomeThreshold,
        actual: income,
        message: `Annual family income ₹${income.toLocaleString("en-IN")} exceeds the ₹${incomeThreshold.toLocaleString("en-IN")} cap for all NSFDC schemes.`,
      },
    };
  }

  // ── Step 2: Determine target category from projectType ────────────
  let targetCategory;
  if (projectType === "education") {
    targetCategory = "education";
  } else if (projectType === "micro_business") {
    targetCategory = "micro_finance";
  } else if (projectType === "medium_business") {
    targetCategory = "term_loan";
  } else {
    return {
      eligible: false,
      scheme: null,
      reason: {
        code: "INVALID_PROJECT_TYPE",
        field: "projectType",
        actual: projectType,
        message: `Unrecognized project type "${projectType}". Expected one of: micro_business, medium_business, education.`,
      },
    };
  }

  // ── Step 3: Find the matching scheme by category ──────────────────
  const scheme = schemes.find((s) => s.category === targetCategory);
  if (!scheme) {
    return {
      eligible: false,
      scheme: null,
      reason: {
        code: "NO_SCHEME_FOUND",
        field: "projectType",
        actual: targetCategory,
        message: `No scheme configured for category "${targetCategory}".`,
      },
    };
  }

  // ── Step 4: Validate project cost against scheme bounds ───────────
  if (projectCost <= 0) {
    return {
      eligible: false,
      scheme: null,
      reason: {
        code: "INVALID_PROJECT_COST",
        field: "projectCost",
        threshold: 0,
        actual: projectCost,
        message: "Project cost must be greater than zero.",
      },
    };
  }

  if (projectCost > scheme.maxProjectCost) {
    // For business types, try to reclassify to a scheme whose range fits
    if (targetCategory !== "education") {
      const betterScheme = schemes.find(
        (s) => s.category !== "education" && projectCost >= s.minProjectCost && projectCost <= s.maxProjectCost
      );
      if (betterScheme) {
        return buildSuccessResult(betterScheme, { income, projectCost, projectType, educationStatus }, "AUTO_RECLASSIFIED");
      }
    }
    return {
      eligible: false,
      scheme: null,
      reason: {
        code: "COST_EXCEEDS_SCHEME_CAP",
        field: "projectCost",
        threshold: scheme.maxProjectCost,
        actual: projectCost,
        schemeName: scheme.name,
        message: `Project cost ₹${projectCost.toLocaleString("en-IN")} exceeds the ${scheme.name} cap of ₹${scheme.maxProjectCost.toLocaleString("en-IN")}.`,
      },
    };
  }

  // For business types, also enforce minProjectCost (micro vs term boundary)
  if (targetCategory !== "education" && projectCost < scheme.minProjectCost) {
    // Try to find a better-fitting scheme instead of outright rejecting
    const betterScheme = schemes.find(
      (s) => s.category !== "education" && projectCost >= s.minProjectCost && projectCost <= s.maxProjectCost
    );
    if (betterScheme) {
      return buildSuccessResult(betterScheme, { income, projectCost, projectType, educationStatus }, "AUTO_RECLASSIFIED");
    }
    return {
      eligible: false,
      scheme: null,
      reason: {
        code: "COST_BELOW_SCHEME_MIN",
        field: "projectCost",
        threshold: scheme.minProjectCost,
        actual: projectCost,
        schemeName: scheme.name,
        message: `Project cost ₹${projectCost.toLocaleString("en-IN")} is below the ${scheme.name} minimum of ₹${scheme.minProjectCost.toLocaleString("en-IN")}.`,
      },
    };
  }

  // ── Step 5: Build success result ──────────────────────────────────
  return buildSuccessResult(scheme, { income, projectCost, projectType, educationStatus }, "MATCHED");
}

/**
 * Internal helper: constructs the success return object with computed
 * loan amount and structured reason data.
 */
function buildSuccessResult(scheme, { income, projectCost, projectType, educationStatus }, matchType) {
  const loanAmount = Math.min(
    Math.floor(projectCost * (scheme.financingPercentage / 100)),
    scheme.maxLoanAmount
  );

  return {
    eligible: true,
    scheme: { ...scheme },
    loanAmount,
    reason: {
      code: matchType,
      matchedFields: {
        projectType,
        projectCost,
        income,
        ...(projectType === "education" ? { educationStatus } : {}),
      },
      appliedThresholds: {
        maxIncome: scheme.maxIncome,
        maxProjectCost: scheme.maxProjectCost,
        financingPercentage: scheme.financingPercentage,
      },
      message:
        matchType === "AUTO_RECLASSIFIED"
          ? `Project cost fits ${scheme.name} (auto-reclassified from selected type).`
          : `Eligible for ${scheme.name}. Loan up to ₹${loanAmount.toLocaleString("en-IN")} at ${scheme.interestRateMin}%${scheme.interestRateMin !== scheme.interestRateMax ? `–${scheme.interestRateMax}%` : ""} interest.`,
    },
  };
}
