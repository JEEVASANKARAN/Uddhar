/**
 * explainWithLLM.js — Isolated LLM Explanation Layer
 *
 * CRITICAL BOUNDARY: This function ONLY rephrases what the rule engine
 * already decided. It NEVER changes scheme names, EMI numbers, or
 * eligibility decisions. If the LLM fails or hallucinates, the
 * deterministic output from ruleEngine.js is always the fallback.
 *
 * Used server-side only (via API route). Never called from client.
 */

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
};

/**
 * @param {Object} params
 * @param {Object} params.schemeResult    — Full output from recommendScheme()
 * @param {Object} [params.emiDetails]    — Full output from calculateEMI() (optional)
 * @param {string} params.language        — Language code: 'en', 'hi', or 'ta'
 * @returns {Promise<string>}             — Natural language explanation
 */
export async function explainWithLLM({ schemeResult, emiDetails, language = 'en' }) {
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) {
    console.warn('explainWithLLM: No LLM_API_KEY set, returning deterministic fallback.');
    return buildFallbackExplanation(schemeResult, emiDetails, language);
  }

  const langName = LANGUAGE_NAMES[language] || 'English';

  // Build a structured prompt that constrains the LLM to only rephrase
  const prompt = buildPrompt(schemeResult, emiDetails, langName);

  try {
    // Try Google Gemini API first
    const response = await callGeminiAPI(apiKey, prompt);
    if (response) return response;

    // Fallback to deterministic explanation if API call fails
    return buildFallbackExplanation(schemeResult, emiDetails, language);
  } catch (error) {
    console.error('explainWithLLM: LLM call failed, using fallback.', error.message);
    return buildFallbackExplanation(schemeResult, emiDetails, language);
  }
}

/**
 * Calls Google Gemini API (generativelanguage.googleapis.com)
 */
async function callGeminiAPI(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 300,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text?.trim() || null;
}

/**
 * Builds the LLM prompt. The prompt explicitly constrains the model:
 * - It MUST use the exact scheme name provided
 * - It MUST NOT invent different numbers
 * - It should explain WHY the applicant qualifies in plain language
 */
function buildPrompt(schemeResult, emiDetails, langName) {
  if (!schemeResult.eligible) {
    return `You are a financial assistant for NSFDC concessional loan schemes for Scheduled Caste beneficiaries in India.

The applicant is NOT eligible. Here is the structured reason:
- Rejection code: ${schemeResult.reason.code}
- Field: ${schemeResult.reason.field}
- Threshold: ${schemeResult.reason.threshold}
- Actual value: ${schemeResult.reason.actual}
- Message: ${schemeResult.reason.message}

Rephrase this rejection in a compassionate, clear, and helpful way in ${langName}. 
Do NOT suggest alternative schemes not mentioned here.
Keep it under 3 sentences.
Respond ONLY with the explanation text, nothing else.`;
  }

  const { scheme, loanAmount, reason } = schemeResult;
  let emiInfo = '';
  if (emiDetails) {
    emiInfo = `
EMI Details (use these EXACT numbers):
- Loan Amount: ₹${emiDetails.loanAmount.toLocaleString('en-IN')}
- Interest Rate: ${emiDetails.annualInterestRate}% per annum
- Monthly EMI: ₹${emiDetails.monthlyEMI.toLocaleString('en-IN')}
- Total Repayment: ₹${emiDetails.totalRepayment.toLocaleString('en-IN')}
- Moratorium: ${emiDetails.moratoriumMonths} months`;
  }

  return `You are a financial assistant for NSFDC concessional loan schemes for Scheduled Caste beneficiaries in India.

The applicant qualifies for:
- Scheme: ${scheme.name} (use this EXACT name, do not change it)
- Loan Amount: ₹${loanAmount.toLocaleString('en-IN')} (up to ${scheme.financingPercentage}% financing)
- Interest Rate: ${scheme.interestRateMin}%${scheme.interestRateMin !== scheme.interestRateMax ? `–${scheme.interestRateMax}%` : ''} per annum
- Project Cost: ₹${reason.matchedFields.projectCost.toLocaleString('en-IN')}
- Annual Income: ₹${reason.matchedFields.income.toLocaleString('en-IN')}
${emiInfo}

Write a warm, clear explanation in ${langName} that:
1. Confirms their eligibility for "${scheme.name}" (use this exact name)
2. Briefly explains WHY they qualify (income and cost thresholds)
3. Mentions the interest rate advantage (concessional vs market rate)
4. If EMI details are provided, mention the monthly payment amount

RULES:
- Use the EXACT numbers provided above. Do NOT invent or round differently.
- Keep it under 4 sentences.
- Be encouraging but factual.
- Respond ONLY with the explanation text, nothing else.`;
}

/**
 * Deterministic fallback when LLM is unavailable.
 * Returns a template-based explanation (always correct, just less natural).
 */
function buildFallbackExplanation(schemeResult, emiDetails, language) {
  if (!schemeResult.eligible) {
    return schemeResult.reason?.message || 'You do not currently meet the eligibility criteria for NSFDC concessional schemes.';
  }

  const { scheme, loanAmount } = schemeResult;
  const rate = scheme.interestRateMin === scheme.interestRateMax
    ? `${scheme.interestRateMin}%`
    : `${scheme.interestRateMin}%–${scheme.interestRateMax}%`;

  const base = `Based on your profile, you qualify for the ${scheme.name}. You can receive a loan of up to ₹${loanAmount.toLocaleString('en-IN')} at a concessional interest rate of ${rate} per annum — significantly lower than open-market rates.`;

  if (emiDetails) {
    return `${base} Your estimated monthly EMI would be ₹${emiDetails.monthlyEMI.toLocaleString('en-IN')} over ${emiDetails.repaymentMonths} months (after a ${emiDetails.moratoriumMonths}-month grace period).`;
  }

  return base;
}
